import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export const notFound = (req, _res, next) =>
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));

/** Single error funnel — every error in the app ends up here. */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, _req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong';
  let details = err.details;

  // MongoDB validation
  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = 'Validation failed';
    details = Object.fromEntries(
      Object.entries(err.errors).map(([k, v]) => [k, v.message])
    );
  }

  // Duplicate key (unique index)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `That ${field} is already registered`;
    details = { [field]: `Already in use` };
  }

  // Bad ObjectId in the URL
  if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid value for ${err.path}`;
  }

  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    details = Object.fromEntries(
      err.issues.map((i) => [i.path.join('.') || 'body', i.message])
    );
  }

  if (statusCode >= 500) console.error('✖', err);

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { errors: details } : {}),
    ...(env.isProd ? {} : { stack: err.stack }),
  });
};
