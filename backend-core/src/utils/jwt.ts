import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface JWTPayload {
  userId: string;
  tenantId: string;
  role: string;
  email: string;
  sessionId?: string;
  mfa_pending?: boolean;
}

export interface RefreshTokenPayload {
  userId: string;
  tenantId: string;
  tokenFamily: string;
}

export const signAccessToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
    issuer: 'hms-core',
    audience: 'hms-client',
  } as jwt.SignOptions);
};

export const signRefreshToken = (payload: RefreshTokenPayload): string => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
    issuer: 'hms-core',
  } as jwt.SignOptions);
};

export const verifyAccessToken = (token: string): JWTPayload => {
  return jwt.verify(token, config.jwt.secret, {
    issuer: 'hms-core',
    audience: 'hms-client',
  }) as JWTPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, config.jwt.refreshSecret, {
    issuer: 'hms-core',
  }) as RefreshTokenPayload;
};

export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
};
