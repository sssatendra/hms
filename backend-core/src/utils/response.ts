import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: ApiResponse['meta']
): Response => {
  const response: ApiResponse<T> = { success: true, data };
  if (meta) response.meta = meta;
  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  code: string,
  message: string,
  statusCode = 400,
  details?: unknown
): Response => {
  const response: ApiResponse = {
    success: false,
    error: { code, message, ...(details ? { details } : {}) },
  };
  return res.status(statusCode).json(response);
};

export const sendCreated = <T>(res: Response, data: T): Response =>
  sendSuccess(res, data, 201);

export const sendNoContent = (res: Response): Response =>
  res.status(204).send();

// Common error codes
export const ErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  BAD_REQUEST: 'BAD_REQUEST',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  TENANT_MISMATCH: 'TENANT_MISMATCH',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  EXPIRED_ITEM: 'EXPIRED_ITEM',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVER_ERROR: 'SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;
