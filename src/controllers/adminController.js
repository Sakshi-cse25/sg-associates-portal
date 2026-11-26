const { verifyPassword } = require('../utils/password');
const { createSession, destroySession } = require('../middleware/auth');
const {
  ALLOWED_ENQUIRY_STATUSES,
  cleanString,
  validateService,
  validateProject,
  validateGalleryItem,
} = require('../utils/validators');

function parseIdParam(rawId) {
  const id = Number(rawId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function createAdminController({
  adminModel,
  enquiryModel,
  serviceModel,
  projectModel,
  galleryModel,
}) {
  return {
    login(req, res) {
      const username = cleanString(req.body && req.body.username);
      const password = typeof (req.body && req.body.password) === 'string' ? req.body.password : '';

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
      }

      const admin = adminModel.findByUsername(username);
      if (!admin || !verifyPassword(password, admin.password_hash)) {
        return res.status(401).json({ error: 'Invalid username or password.' });
      }

      adminModel.updateLastLogin(admin.admin_id);
      createSession(res, admin);
      return res.json({
        message: 'Login successful.',
        admin: { admin_id: admin.admin_id, username: admin.username },
      });
    },

    logout(req, res) {
      destroySession(req, res);
      return res.json({ message: 'Logged out successfully.' });
    },

    me(req, res) {
      const admin = adminModel.findById(req.adminSession.adminId);
      return res.json({ admin });
    },

    listEnquiries(req, res) {
      const enquiries = enquiryModel.findAll();
      return res.json({ enquiries });
    },

    updateEnquiryStatus(req, res) {
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ error: 'Invalid enquiry ID.' });
      }

      const status = cleanString(req.body && req.body.status);
      if (!ALLOWED_ENQUIRY_STATUSES.includes(status)) {
        return res.status(400).json({
          error: `Status must be one of: ${ALLOWED_ENQUIRY_STATUSES.join(', ')}.`,
        });
      }

      const updated = enquiryModel.updateStatus(id, status);
      if (!updated) {
        return res.status(404).json({ error: 'Enquiry not found.' });
      }
      return res.json({ message: 'Enquiry status updated.', enquiry: updated });
    },

    createService(req, res) {
      const validation = validateService(req.body);
      if (!validation.valid) {
        return res.status(400).json({ error: 'Validation failed.', errors: validation.errors });
      }
      const service = serviceModel.create(validation.data);
      return res.status(201).json({ message: 'Service created.', service });
    },

    updateService(req, res) {
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ error: 'Invalid service ID.' });
      }
      const validation = validateService(req.body);
      if (!validation.valid) {
        return res.status(400).json({ error: 'Validation failed.', errors: validation.errors });
      }
      const updated = serviceModel.update(id, validation.data);
      if (!updated) {
        return res.status(404).json({ error: 'Service not found.' });
      }
      return res.json({ message: 'Service updated.', service: updated });
    },

    deleteService(req, res) {
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ error: 'Invalid service ID.' });
      }
      const removed = serviceModel.remove(id);
      if (!removed) {
        return res.status(404).json({ error: 'Service not found.' });
      }
      return res.json({ message: 'Service deleted.' });
    },

    createProject(req, res) {
      const validation = validateProject(req.body);
      if (!validation.valid) {
        return res.status(400).json({ error: 'Validation failed.', errors: validation.errors });
      }
      const project = projectModel.create(validation.data);
      return res.status(201).json({ message: 'Project created.', project });
    },

    updateProject(req, res) {
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ error: 'Invalid project ID.' });
      }
      const validation = validateProject(req.body);
      if (!validation.valid) {
        return res.status(400).json({ error: 'Validation failed.', errors: validation.errors });
      }
      const updated = projectModel.update(id, validation.data);
      if (!updated) {
        return res.status(404).json({ error: 'Project not found.' });
      }
      return res.json({ message: 'Project updated.', project: updated });
    },

    deleteProject(req, res) {
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ error: 'Invalid project ID.' });
      }
      const removed = projectModel.remove(id);
      if (!removed) {
        return res.status(404).json({ error: 'Project not found.' });
      }
      return res.json({ message: 'Project deleted.' });
    },

    createGalleryItem(req, res) {
      const validation = validateGalleryItem(req.body);
      if (!validation.valid) {
        return res.status(400).json({ error: 'Validation failed.', errors: validation.errors });
      }
      const { project_id } = validation.data;
      if (project_id !== null && !projectModel.findById(project_id)) {
        return res.status(400).json({
          error: 'Validation failed.',
          errors: { project_id: 'Related project was not found.' },
        });
      }
      const item = galleryModel.create(validation.data);
      return res.status(201).json({ message: 'Gallery item added.', item });
    },

    deleteGalleryItem(req, res) {
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ error: 'Invalid gallery image ID.' });
      }
      const removed = galleryModel.remove(id);
      if (!removed) {
        return res.status(404).json({ error: 'Gallery item not found.' });
      }
      return res.json({ message: 'Gallery item deleted.' });
    },
  };
}

module.exports = { createAdminController };
