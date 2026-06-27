/**
 * Authentication middleware for protected routes.
 * Validates JWT tokens, attaches the authenticated user to req.user,
 * and provides optional or admin-only route enforcement.
 */
import jwt from  'jsonwebtoken';
import User from  '../models/userModel.js';

/**
 * Verify the bearer token and attach the authenticated user to req.user.
 * @param { Request} req
 * @param { Response} res
 * @param { NextFunction} next
 */
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const user = await User.findById(decoded.userId).select('-passwordHash');
    if (!user) return res.status(401).json({ error: 'User not found' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Attempt optional authentication and continue even if no token exists.
 * @param { Request} req
 * @param { Response} res
 * @param { NextFunction} next
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      req.user = await User.findById(decoded.userId).select('-passwordHash');
    }
  } catch (_) {}
  next();
};

/**
 * Restrict route access to authenticated admin users.
 * @param { Request} req
 * @param { Response} res
 * @param { NextFunction} next
 */
const adminOnly = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
  if (req.user.role !== 'admin')
    return res.status(403).json({ error: 'Admin access required' });
  next();
};


export { authenticate, optionalAuth , adminOnly};