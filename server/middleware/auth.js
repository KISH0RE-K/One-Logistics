const jwt = require("jsonwebtoken");
const { AppError } = require("./errorHandler");
const User = require("../models/User");

/**
 * Middleware: verifies JWT and attaches req.user.
 */
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new AppError("No token provided", 401));
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select("-passwordHash");
    if (!user) {
      return next(new AppError("User not found", 401));
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { authenticateUser };
