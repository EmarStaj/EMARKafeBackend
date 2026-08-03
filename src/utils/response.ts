import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
}

/**
 * Sends a successful API response.
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200
): Response<ApiResponse<T>> => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Sends an error API response.
 */
export const sendError = (
  res: Response,
  message = 'Internal Server Error',
  statusCode = 500,
  errors: any = null
): Response<ApiResponse> => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};
