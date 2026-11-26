/**
 * Centralized error-handling middleware.
 * Logs technical error details on the server while returning a generic
 * safe message to the client so internal details are never exposed.
 */
function errorHandler(err, req, res, next) {
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON request body.' });
  }
  console.error('[Server Error]', err);
  if (res.headersSent) {
    return next(err);
  }
  return res.status(500).json({ error: 'An unexpected server error occurred.' });
}

module.exports = errorHandler;
