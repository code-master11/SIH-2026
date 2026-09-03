import { Response } from 'express';
import { ApiResponse, PaginatedResponse } from '../types';

export const successResponse = <T>(res: Response, statusCode: number, message: string, data?: T) => {
  const response: ApiResponse<T> = { success: true, message, data };
  return res.status(statusCode).json(response);
};

export const errorResponse = (res: Response, statusCode: number, message: string) => {
  const response: ApiResponse<null> = { success: false, message };
  return res.status(statusCode).json(response);
};

export const paginatedResponse = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data: T[],
  meta: PaginatedResponse<T>['meta']
) => {
  const response: PaginatedResponse<T> = { success: true, message, data, meta };
  return res.status(statusCode).json(response);
};
