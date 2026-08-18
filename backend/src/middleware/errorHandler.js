function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

function errorHandler(error, req, res, next) {
  let statusCode = error.statusCode || res.statusCode || 500;
  let message = error.message || "Server error";

  if (statusCode < 400) {
    statusCode = 500;
  }

  if (error.name === "CastError") {
    statusCode = 404;
    message = "Resource not found.";
  }

  if (error.code === 11000) {
    statusCode = 409;
    message = "Email already exists.";
  }

  if (error.name === "MulterError") {
    statusCode = 400;
    message = error.message;
  }

  res.status(statusCode).json({
    message,
    details: process.env.NODE_ENV === "production" ? undefined : error.stack,
  });
}

module.exports = { errorHandler, notFound };
