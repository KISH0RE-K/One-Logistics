/**
 * Custom error class for structured API errors.
 * Usage: throw new AppError("Message", statusCode)
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Centralized Express error-handling middleware.
 * Must be registered last in server.js.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Mongoose: duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || "Field";
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  }

  // Mongoose: schema validation
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join(", ");
  }

  // Mongoose: bad ObjectId
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid value for field '${err.path}'`;
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") { statusCode = 401; message = "Invalid token"; }
  if (err.name === "TokenExpiredError") { statusCode = 401; message = "Token has expired"; }

  const body = { success: false, message };
  if (process.env.NODE_ENV === "development") body.stack = err.stack;

  res.status(statusCode).json(body);
};

module.exports = { AppError, errorHandler };
