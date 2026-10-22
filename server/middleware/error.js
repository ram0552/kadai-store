module.exports = function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const status = err.status || 500;
  if (!err.status) console.error(err);
  res.status(status).json({
    success: false,
    message: err.status ? err.message : 'Something went wrong. Please try again.',
  });
};
