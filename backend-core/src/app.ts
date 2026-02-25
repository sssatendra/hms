import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { logger } from './utils/logger';
import { sendError, ErrorCodes } from './utils/response';
import { tenantMiddleware } from './middleware/tenant';

// Routes
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import patientsRoutes from './modules/patients/patients.routes';
import appointmentsRoutes from './modules/appointments/appointments.routes';
import pharmacyRoutes from './modules/pharmacy/pharmacy.routes';
import labRoutes from './modules/lab/lab.routes';
import emrRoutes from './modules/emr/emr.routes';
import billingRoutes from './modules/billing/billing.routes';
import wardsRoutes from './modules/wards/wards.routes';
import inventoryRoutes from './modules/inventory/inventory.routes';
import accountingRoutes from './modules/accounting/accounting.routes';
import tenantsRoutes from './modules/tenants/tenants.routes';

export const createApp = (): Application => {
  const app = express();

  // ─── Security ─────────────────────────────────────────────────────────────
  app.use(helmet({
    contentSecurityPolicy: config.isProd,
    crossOriginEmbedderPolicy: config.isProd,
  }));

  app.use(cors({
    origin: config.services.frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
  }));

  // ─── Rate Limiting ─────────────────────────────────────────────────────────
  const limiter = rateLimit({
    windowMs: config.security.rateLimitWindowMs,
    max: config.security.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      sendError(res, ErrorCodes.RATE_LIMITED, 'Too many requests, please try again later', 429);
    },
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    handler: (req, res) => {
      sendError(res, ErrorCodes.RATE_LIMITED, 'Too many auth attempts', 429);
    },
  });

  app.use('/api/v1/auth', authLimiter);
  app.use(limiter);

  // ─── Parsing ───────────────────────────────────────────────────────────────
  app.use(compression());
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ extended: true, limit: '100mb' }));
  app.use(cookieParser());

  // ─── Logging ───────────────────────────────────────────────────────────────
  if (config.isDev) {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined', {
      stream: { write: (msg) => logger.info(msg.trim()) },
    }));
  }

  // ─── Trust proxy (for correct IP behind reverse proxy) ────────────────────
  app.set('trust proxy', 1);

  // ─── Health Check ──────────────────────────────────────────────────────────
  app.get('/health', async (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      service: 'hms-backend-core',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
    });
  });

  // ─── API Routes ────────────────────────────────────────────────────────────
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', tenantMiddleware, usersRoutes);
  app.use('/api/v1/patients', tenantMiddleware, patientsRoutes);
  app.use('/api/v1/appointments', tenantMiddleware, appointmentsRoutes);
  app.use('/api/v1/pharmacy', tenantMiddleware, pharmacyRoutes);
  app.use('/api/v1/lab', tenantMiddleware, labRoutes);
  app.use('/api/v1/emr', tenantMiddleware, emrRoutes);
  app.use('/api/v1/billing', tenantMiddleware, billingRoutes);
  app.use('/api/v1/wards', tenantMiddleware, wardsRoutes);
  app.use('/api/v1/inventory', tenantMiddleware, inventoryRoutes);
  app.use('/api/v1/accounting', tenantMiddleware, accountingRoutes);
  app.use('/api/v1/tenants', tenantMiddleware, tenantsRoutes);

  // ─── 404 Handler ───────────────────────────────────────────────────────────
  app.use((req: Request, res: Response) => {
    sendError(res, ErrorCodes.NOT_FOUND, `Route ${req.method} ${req.path} not found`, 404);
  });

  // ─── Global Error Handler ──────────────────────────────────────────────────
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error('Unhandled error', {
      message: err.message,
      stack: config.isDev ? err.stack : undefined,
      path: req.path,
      method: req.method,
    });

    if (res.headersSent) {
      return next(err);
    }

    sendError(
      res,
      ErrorCodes.INTERNAL_ERROR,
      config.isDev ? err.message : 'An unexpected error occurred',
      500
    );
  });

  return app;
};
