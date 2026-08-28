const { AppError } = require("./errorHandler");

/**
 * Middleware: allows only users with role === "admin".
 * Must be used AFTER authenticateUser.
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return next(new AppError("Access denied: admin only", 403));
  }
  next();
};

module.exports = { requireAdmin };
