import { ApiError } from '../utils/ApiError.js';
import { verifyToken } from '../utils/token.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import User from '../models/User.js';

/** Extracts the bearer token and attaches `req.user`. */
export const protect = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : req.cookies?.token;

  if (!token) throw ApiError.unauthorized('Please log in to continue');

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    throw ApiError.unauthorized('Session expired, please log in again');
  }

  const user = await User.findById(decoded.sub);
  if (!user) throw ApiError.unauthorized('Account no longer exists');

  req.user = user;
  next();
});

/** Optional auth: attaches the user when a token is present, never throws. */
export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : req.cookies?.token;
  if (token) {
    try {
      const decoded = verifyToken(token);
      req.user = await User.findById(decoded.sub);
    } catch {
      /* ignore invalid token for public routes */
    }
  }
  next();
});

/** Role gate — must run after `protect`. */
export const authorize =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) return next(ApiError.forbidden());
    next();
  };
