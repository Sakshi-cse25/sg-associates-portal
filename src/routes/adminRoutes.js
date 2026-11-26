const express = require('express');
const { requireAdmin } = require('../middleware/auth');

function createAdminRoutes(adminController) {
  const router = express.Router();

  router.post('/login', adminController.login);
  router.post('/logout', adminController.logout);

  router.use(requireAdmin);
  router.get('/me', adminController.me);

  router.get('/enquiries', adminController.listEnquiries);
  router.patch('/enquiries/:id', adminController.updateEnquiryStatus);

  router.post('/services', adminController.createService);
  router.put('/services/:id', adminController.updateService);
  router.delete('/services/:id', adminController.deleteService);

  router.post('/projects', adminController.createProject);
  router.put('/projects/:id', adminController.updateProject);
  router.delete('/projects/:id', adminController.deleteProject);

  router.post('/gallery', adminController.createGalleryItem);
  router.delete('/gallery/:id', adminController.deleteGalleryItem);

  return router;
}

module.exports = { createAdminRoutes };
