import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { prisma } from '../../services/prisma';
import { sendSuccess, sendError, sendCreated, ErrorCodes } from '../../utils/response';
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from '../../utils/jwt';
import { config } from '../../config';
import { logger } from '../../utils/logger';
import { cacheSet, cacheGet, CacheKeys, getRedisClient } from '../../services/redis';
import { addAuditLogJob } from '../../services/queue';
import { authenticate } from '../../middleware/auth';
import speakeasy from 'speakeasy';

const router = Router();

// Cookie options
const cookieOptions = {
  httpOnly: true,
  secure: config.isProd,
  sameSite: 'strict' as const,
  path: '/',
};

// ─── Schemas ──────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  tenant_slug: z.string().min(1),
});

const registerSchema = z.object({
  tenant_name: z.string().min(2),
  tenant_slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  phone: z.string().optional(),
});

const changePasswordSchema = z.object({
  current_password: z.string(),
  new_password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
});

const verify2FASchema = z.object({
  token: z.string().min(6).max(6),
});

const login2FASchema = z.object({
  mfa_token: z.string(),
  otp_code: z.string().min(6).max(6),
});

// ─── Routes ───────────────────────────────────────────────────────────────────

// POST /api/v1/auth/register - Register new tenant + admin user
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = registerSchema.parse(req.body);

    // Check slug uniqueness
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug: data.tenant_slug },
    });

    if (existingTenant) {
      sendError(res, ErrorCodes.CONFLICT, 'Tenant slug already taken', 409);
      return;
    }

    // Get or create ADMIN role
    const adminRole = await prisma.role.upsert({
      where: { name: 'ADMIN' },
      create: { name: 'ADMIN', description: 'Hospital Administrator' },
      update: {},
    });

    const passwordHash = await bcrypt.hash(data.password, config.security.bcryptRounds);

    // Create tenant + admin user in transaction
    const { tenant, user } = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: data.tenant_name,
          slug: data.tenant_slug,
        },
      });

      const user = await tx.user.create({
        data: {
          tenant_id: tenant.id,
          role_id: adminRole.id,
          email: data.email,
          password_hash: passwordHash,
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
          status: 'ACTIVE',
          email_verified: true,
        },
      });

      return { tenant, user };
    });

    // Sign tokens
    const accessToken = signAccessToken({
      userId: user.id,
      tenantId: tenant.id,
      role: 'ADMIN',
      email: user.email,
    });

    const refreshToken = signRefreshToken({
      userId: user.id,
      tenantId: tenant.id,
      tokenFamily: uuidv4(),
    });

    res.cookie('access_token', accessToken, {
      ...cookieOptions,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.cookie('refresh_token', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    sendCreated(res, {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: 'ADMIN',
        tenant_id: tenant.id,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      sendError(res, ErrorCodes.VALIDATION_ERROR, 'Validation failed', 400, error.errors);
      return;
    }
    logger.error('Registration error', { error });
    sendError(res, ErrorCodes.INTERNAL_ERROR, 'Registration failed', 500);
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, tenant_slug } = loginSchema.parse(req.body);

    // Find tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenant_slug },
    });

    if (!tenant || !tenant.is_active) {
      sendError(res, ErrorCodes.UNAUTHORIZED, 'Invalid credentials', 401);
      return;
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { tenant_id_email: { tenant_id: tenant.id, email } },
      include: { role: true },
    });

    if (!user || !user.is_active) {
      sendError(res, ErrorCodes.UNAUTHORIZED, 'Invalid credentials', 401);
      return;
    }

    // Check status
    if (user.status === 'SUSPENDED') {
      sendError(res, ErrorCodes.FORBIDDEN, 'Account suspended', 403);
      return;
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      sendError(res, ErrorCodes.UNAUTHORIZED, 'Invalid credentials', 401);
      return;
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        last_login_at: new Date(),
        last_login_ip: req.ip,
      },
    });

    // Handle MFA if enabled AND secret is set
    if (user.two_factor_enabled && user.two_factor_secret) {
      const mfaToken = signAccessToken({
        userId: user.id,
        tenantId: tenant.id,
        role: user.role.name,
        email: user.email,
        mfa_pending: true,
      });

      sendSuccess(res, {
        mfa_required: true,
        mfa_token: mfaToken,
      });
      return;
    }

    // Generate tokens
    const sessionId = uuidv4();
    const accessToken = signAccessToken({
      userId: user.id,
      tenantId: tenant.id,
      role: user.role.name,
      email: user.email,
      sessionId,
    });

    const tokenFamily = uuidv4();
    const refreshToken = signRefreshToken({
      userId: user.id,
      tenantId: tenant.id,
      tokenFamily,
    });

    // Audit log
    await addAuditLogJob({
      tenantId: tenant.id,
      userId: user.id,
      action: 'LOGIN',
      resource: 'auth',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Set cookies
    res.cookie('access_token', accessToken, {
      ...cookieOptions,
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.cookie('refresh_token', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    sendSuccess(res, {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role.name,
        avatar_url: user.avatar_url,
        tenant_id: tenant.id,
        department_id: user.department_id,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        logo_url: tenant.logo_url,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      sendError(res, ErrorCodes.VALIDATION_ERROR, 'Validation failed', 400, error.errors);
      return;
    }
    logger.error('Login error', { error });
    sendError(res, ErrorCodes.INTERNAL_ERROR, 'Login failed', 500);
  }
});

// POST /api/v1/auth/refresh
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      sendError(res, ErrorCodes.UNAUTHORIZED, 'Refresh token required', 401);
      return;
    }

    const payload = verifyRefreshToken(refreshToken);

    const user = await prisma.user.findFirst({
      where: { id: payload.userId, tenant_id: payload.tenantId },
      include: { role: true },
    });

    if (!user || !user.is_active) {
      sendError(res, ErrorCodes.UNAUTHORIZED, 'Invalid refresh token', 401);
      return;
    }

    const newAccessToken = signAccessToken({
      userId: user.id,
      tenantId: payload.tenantId,
      role: user.role.name,
      email: user.email,
    });

    res.cookie('access_token', newAccessToken, {
      ...cookieOptions,
      maxAge: 24 * 60 * 60 * 1000,
    });

    sendSuccess(res, { message: 'Token refreshed' });
  } catch (error: any) {
    sendError(res, ErrorCodes.INVALID_TOKEN, 'Invalid refresh token', 401);
  }
});

// POST /api/v1/auth/logout
router.post('/logout', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const accessToken = req.cookies?.access_token;

    if (accessToken) {
      // Blacklist the token until it expires
      const redis = getRedisClient();
      await redis.setex(CacheKeys.blacklist(accessToken), 15 * 60, '1');
    }

    await addAuditLogJob({
      tenantId: req.user!.tenantId,
      userId: req.user!.userId,
      action: 'LOGOUT',
      resource: 'auth',
      ipAddress: req.ip,
    });

    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    sendSuccess(res, { message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error', { error });
    sendError(res, ErrorCodes.INTERNAL_ERROR, 'Logout failed', 500);
  }
});

// GET /api/v1/auth/me
router.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone: true,
        avatar_url: true,
        status: true,
        availability_status: true,
        specialization: true,
        license_number: true,
        tenant_id: true,
        two_factor_enabled: true,
        role: { select: { name: true } },
        department: { select: { id: true, name: true } },
      },
    });

    if (!user) {
      sendError(res, ErrorCodes.NOT_FOUND, 'User not found', 404);
      return;
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenant_id },
      select: {
        id: true,
        name: true,
        slug: true,
        logo_url: true,
        settings: true,
      }
    });

    // Need to restructure user slightly so `role` is a string to match the frontend `User` interface
    const formattedUser = {
      ...user,
      role: user.role.name
    };

    sendSuccess(res, { user: formattedUser, tenant });
  } catch (error) {
    logger.error('Get me error', { error });
    sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to get user', 500);
  }
});

// POST /api/v1/auth/change-password
router.post('/change-password', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { current_password, new_password } = changePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) {
      sendError(res, ErrorCodes.NOT_FOUND, 'User not found', 404);
      return;
    }

    const valid = await bcrypt.compare(current_password, user.password_hash);
    if (!valid) {
      sendError(res, ErrorCodes.UNAUTHORIZED, 'Current password incorrect', 401);
      return;
    }

    const newHash = await bcrypt.hash(new_password, config.security.bcryptRounds);
    await prisma.user.update({
      where: { id: user.id },
      data: { password_hash: newHash },
    });

    await addAuditLogJob({
      tenantId: req.user!.tenantId,
      userId: req.user!.userId,
      action: 'UPDATE',
      resource: 'user_password',
    });

    sendSuccess(res, { message: 'Password changed successfully' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      sendError(res, ErrorCodes.VALIDATION_ERROR, 'Validation failed', 400, error.errors);
      return;
    }
    sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to change password', 500);
  }
});

// POST /api/v1/auth/login/2fa - Verify TOTP during login
router.post('/login/2fa', async (req: Request, res: Response): Promise<void> => {
  try {
    const { mfa_token, otp_code } = login2FASchema.parse(req.body);

    const payload = verifyAccessToken(mfa_token);
    if (!payload.mfa_pending) {
      sendError(res, ErrorCodes.UNAUTHORIZED, 'Invalid MFA token', 401);
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { role: true, tenant: true },
    });

    if (!user || !user.two_factor_secret) {
      sendError(res, ErrorCodes.UNAUTHORIZED, '2FA not setup', 401);
      return;
    }

    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: otp_code,
    });

    if (!verified) {
      sendError(res, ErrorCodes.UNAUTHORIZED, 'Invalid 2FA code', 401);
      return;
    }

    // Generate final tokens
    const sessionId = uuidv4();
    const accessToken = signAccessToken({
      userId: user.id,
      tenantId: user.tenant_id,
      role: user.role.name,
      email: user.email,
      sessionId,
    });

    const tokenFamily = uuidv4();
    const refreshToken = signRefreshToken({
      userId: user.id,
      tenantId: user.tenant_id,
      tokenFamily,
    });

    // Audit log
    await addAuditLogJob({
      tenantId: user.tenant_id,
      userId: user.id,
      action: 'LOGIN',
      resource: 'auth_2fa',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Set cookies
    res.cookie('access_token', accessToken, {
      ...cookieOptions,
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.cookie('refresh_token', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    sendSuccess(res, {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role.name,
        avatar_url: user.avatar_url,
        tenant_id: user.tenant_id,
        department_id: user.department_id,
      },
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug,
        logo_url: user.tenant.logo_url,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      sendError(res, ErrorCodes.VALIDATION_ERROR, 'Validation failed', 400, error.errors);
      return;
    }
    logger.error('2FA login error', {
      message: error.message,
      stack: error.stack,
      error
    });
    sendError(res, ErrorCodes.INTERNAL_ERROR, '2FA login failed', 500);
  }
});

// POST /api/v1/auth/2fa/setup - Generate TOTP secret
router.post('/2fa/setup', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) {
      sendError(res, ErrorCodes.NOT_FOUND, 'User not found', 404);
      return;
    }

    const secret = speakeasy.generateSecret({
      name: `HMS (${user.email})`,
      issuer: 'Hospital Management System',
    });

    // Store secret temporarily (or overwrite existing)
    await prisma.user.update({
      where: { id: user.id },
      data: { two_factor_secret: secret.base32 },
    });

    sendSuccess(res, {
      secret: secret.base32,
      otpauth_url: secret.otpauth_url,
    });
  } catch (error) {
    logger.error('2FA setup error', { error });
    sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to setup 2FA', 500);
  }
});

// POST /api/v1/auth/2fa/verify - Verify and enable 2FA
router.post('/2fa/verify', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = verify2FASchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user || !user.two_factor_secret) {
      sendError(res, ErrorCodes.BAD_REQUEST, '2FA not setup', 400);
      return;
    }

    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token,
    });

    if (!verified) {
      sendError(res, ErrorCodes.UNAUTHORIZED, 'Invalid verification code', 401);
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { two_factor_enabled: true },
    });

    await addAuditLogJob({
      tenantId: req.user!.tenantId,
      userId: req.user!.userId,
      action: 'UPDATE',
      resource: '2fa_enabled',
    });

    sendSuccess(res, { message: '2FA enabled successfully' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      sendError(res, ErrorCodes.VALIDATION_ERROR, 'Validation failed', 400, error.errors);
      return;
    }
    logger.error('2FA verify error', { error });
    sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to verify 2FA', 500);
  }
});

// POST /api/v1/auth/2fa/disable - Disable 2FA
router.post('/2fa/disable', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = verify2FASchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user || !user.two_factor_enabled || !user.two_factor_secret) {
      sendError(res, ErrorCodes.BAD_REQUEST, '2FA not enabled', 400);
      return;
    }

    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token,
    });

    if (!verified) {
      sendError(res, ErrorCodes.UNAUTHORIZED, 'Invalid verification code', 401);
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        two_factor_enabled: false,
        two_factor_secret: null,
      },
    });

    await addAuditLogJob({
      tenantId: req.user!.tenantId,
      userId: req.user!.userId,
      action: 'UPDATE',
      resource: '2fa_disabled',
    });

    sendSuccess(res, { message: '2FA disabled successfully' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      sendError(res, ErrorCodes.VALIDATION_ERROR, 'Validation failed', 400, error.errors);
      return;
    }
    logger.error('2FA disable error', { error });
    sendError(res, ErrorCodes.INTERNAL_ERROR, 'Failed to disable 2FA', 500);
  }
});

export default router;
