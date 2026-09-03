import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AuthRequest, JwtPayload } from '../types';
import { errorResponse } from '../utils/api-response';

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return errorResponse(res, 401, 'Unauthorized: No token provided');
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return errorResponse(res, 401, 'Unauthorized: Invalid token');
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return errorResponse(res, 401, 'Unauthorized');
    }
    if (!roles.includes(req.user.role)) {
      return errorResponse(res, 403, 'Forbidden: Insufficient permissions');
    }
    next();
  };
};

export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload;
      req.user = decoded;
    } catch (e) {
      // ignore
    }
  }
  next();
};
