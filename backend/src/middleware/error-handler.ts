import { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/errors.js';
import { env } from '../config/env.js';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode,
    });
    return;
  }

  console.error('Unhandled error:', err);

  res.status(500).json({
    error: env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    statusCode: 500,
  });
}
