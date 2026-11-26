const path = require('node:path');
const express = require('express');
const securityHeaders = require('./middleware/securityHeaders');
const errorHandler = require('./middleware/errorHandler');
const { createServiceModel } = require('./models/serviceModel');
const { createProjectModel } = require('./models/projectModel');
const { createGalleryModel } = require('./models/galleryModel');
const { createEnquiryModel } = require('./models/enquiryModel');
const { createAdminModel } = require('./models/adminModel');
const { createPublicController } = require('./controllers/publicController');
const { createAdminController } = require('./controllers/adminController');
const { createPublicRoutes } = require('./routes/publicRoutes');
const { createAdminRoutes } = require('./routes/adminRoutes');

/**
 * Builds and configures the Express application with a given database handle.
 * Accepting `db` as an argument enables isolated in-memory integration testing.
 */
function createApp(db) {
  const app = express();

  const models = {
    serviceModel: createServiceModel(db),
    projectModel: createProjectModel(db),
    galleryModel: createGalleryModel(db),
    enquiryModel: createEnquiryModel(db),
    adminModel: createAdminModel(db),
  };

  const publicController = createPublicController(models);
  const adminController = createAdminController(models);

  app.use(securityHeaders);
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: false }));

  // Prevent caching of API responses and sensitive admin pages
  app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api', createPublicRoutes(publicController));
  app.use('/api/admin', createAdminRoutes(adminController));

  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  // Serve static front-end assets with lightweight browser caching
  const publicDir = path.join(__dirname, '..', 'public');
  app.use(
    express.static(publicDir, {
      maxAge: '1h',
      setHeaders(res, filePath) {
        if (filePath.endsWith('admin.html') || filePath.endsWith('admin-login.html')) {
          res.setHeader('Cache-Control', 'no-store');
        }
      },
    })
  );

  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
