import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message: string = 'Success',
  statusCode: number = 200
) => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  message: string = 'Error',
  statusCode: number = 500,
  data?: any
) => {
  const response: ApiResponse = {
    success: false,
    message,
    ...(data && { data }),
  };
  res.status(statusCode).json(response);
};

export const sendNotFound = (res: Response, message: string = 'Resource not found') => {
  sendError(res, message, 404);
};

export const sendBadRequest = (res: Response, message: string = 'Bad request') => {
  sendError(res, message, 400);
};

export const sendUnauthorized = (res: Response, message: string = 'Unauthorized') => {
  sendError(res, message, 401);
};

export const sendForbidden = (res: Response, message: string = 'Forbidden') => {
  sendError(res, message, 403);
};

export const sendInternalError = (res: Response, message: string = 'Internal server error') => {
  sendError(res, message, 500);
};