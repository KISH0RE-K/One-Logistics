const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const auditService = require('../services/auditService');

const generateToken = (user) =>
  jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

/**
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return next(new AppError('Email already registered', 409));

    // Default all self-registrations to 'customer'
    const assignedRole = role === 'admin' ? 'admin' : 'customer';

    const user = await User.create({
      name,
      email,
      passwordHash: password, // pre-save hook hashes this
      role: assignedRole,
    });

    const token = generateToken(user);

    await auditService.log({
      userId: user._id,
      action: 'REGISTER',
      resource: 'user',
      resourceId: user._id,
    });

    res.status(201).json({ success: true, data: { token, user } });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) return next(new AppError('Invalid email or password', 401));

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return next(new AppError('Invalid email or password', 401));

    const token = generateToken(user);

    await auditService.log({
      userId: user._id,
      action: 'LOGIN',
      resource: 'user',
      resourceId: user._id,
    });

    res.json({ success: true, data: { token, user } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    res.json({ success: true, data: { user: req.user } });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe };
