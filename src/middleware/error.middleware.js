function errorHandler(err, req, res, next) {
  console.error('Unhandled application error:', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'Internal server error',
  });
}

module.exports = { errorHandler };
