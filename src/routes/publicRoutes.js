const express = require('express');

function createPublicRoutes(publicController) {
  const router = express.Router();

  router.get('/services', publicController.getServices);
  router.get('/projects', publicController.getProjects);
  router.get('/gallery', publicController.getGallery);
  router.post('/enquiries', publicController.createEnquiry);

  return router;
}

module.exports = { createPublicRoutes };
