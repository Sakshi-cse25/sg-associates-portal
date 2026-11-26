const { validateEnquiry } = require('../utils/validators');

function createPublicController({ serviceModel, projectModel, galleryModel, enquiryModel }) {
  return {
    getServices(req, res) {
      const services = serviceModel.findAll();
      return res.json({ services });
    },

    getProjects(req, res) {
      const projects = projectModel.findAll();
      return res.json({ projects });
    },

    getGallery(req, res) {
      const gallery = galleryModel.findAll();
      return res.json({ gallery });
    },

    createEnquiry(req, res) {
      const validation = validateEnquiry(req.body);
      if (!validation.valid) {
        return res.status(400).json({
          error: 'Please correct the highlighted fields.',
          errors: validation.errors,
        });
      }

      const { service_id } = validation.data;
      if (service_id !== null && !serviceModel.findById(service_id)) {
        return res.status(400).json({
          error: 'Please correct the highlighted fields.',
          errors: { service_id: 'Selected service was not found.' },
        });
      }

      const enquiry = enquiryModel.create(validation.data);
      return res.status(201).json({
        message: 'Thank you. Your enquiry has been recorded.',
        enquiry,
      });
    },
  };
}

module.exports = { createPublicController };
