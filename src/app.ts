import 'reflect-metadata';
import express, { Request, Response, NextFunction, Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './config/swagger.json';

// Import Config
import { logger } from './config/logger';
import { supabaseAdmin } from './config/supabase';

// Import Middlewares
import { errorMiddleware } from './middlewares/error.middleware';
import { globalRateLimiter } from './middlewares/rate-limit.middleware';
import { AppError } from './utils/app-error';

// Import Route modules
import authRoutes from './modules/auth/auth.routes';
import profileRoutes from './modules/profile/profile.routes';
import menuRoutes from './modules/menu/menu.routes';
import cartRoutes from './modules/cart/cart.routes';
import orderRoutes from './modules/order/order.routes';
import favoritesRoutes from './modules/favorites/favorites.routes';
import categoryRoutes from './modules/category/category.routes';
import branchRoutes from './modules/branch/branch.routes';
import optionRoutes from './modules/option/option.routes';
import ratingRoutes from './modules/rating/rating.routes';
import loyaltyRoutes from './modules/loyalty/loyalty.routes';
import deviceTokenRoutes from './modules/device-token/device-token.routes';
import notificationRoutes from './modules/notification/notification.routes';
import walletRoutes from './modules/wallet/wallet.routes';
import settingsRoutes from './modules/settings/settings.routes';
import auditRoutes from './modules/audit/audit.routes';
import staffRoutes from './modules/staff/staff.routes';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

const app = express();

// Trust first proxy (Traefik/Coolify) for rate limiting
app.set('trust proxy', 1);

// Global Middlewares
app.use(helmet({
  contentSecurityPolicy: false
}));

// CORS — restrict to allowed origins in production
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : [];

if (isProduction && allowedOrigins.length === 0) {
  logger.warn('⚠️ SECURITY WARNING: ALLOWED_ORIGINS is not set in production. CORS whitelist is permissive for early deployment.');
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, native HTTP clients, Postman)
    if (!origin) return callback(null, true);
    // Dev mode: reflect origin
    if (!isProduction) return callback(null, origin);
    // Production with whitelist: check origin
    if (allowedOrigins.length > 0) {
      // If wildcard '*' is in the list, reflect origin to allow credentials
      if (allowedOrigins.includes('*')) return callback(null, origin);
      // Otherwise strictly match the origin
      if (allowedOrigins.includes(origin)) return callback(null, origin);
      return callback(new Error(`CORS: Origin '${origin}' not allowed`), false);
    }
    return callback(null, origin);
  },
  credentials: true,
}));

// HTTP request logging — structured JSON in prod, colorized in dev
app.use(morgan(isProduction ? 'combined' : 'dev'));

// Health Check Endpoint — includes DB connectivity test (MUST be before rate limiter so Render health checks never get 429)
app.get('/health', async (_req: Request, res: Response) => {
  let dbStatus = 'ok';
  try {
    // Lightweight DB ping: fetch a single row from a small table
    const { error } = await supabaseAdmin.from('app_settings').select('key').limit(1);
    if (error) dbStatus = 'degraded';
  } catch {
    dbStatus = 'unreachable';
  }

  const httpStatus = dbStatus === 'ok' ? 200 : 503;
  res.status(httpStatus).json({
    status: dbStatus === 'ok' ? 'OK' : 'DEGRADED',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    services: { database: dbStatus },
  });
});

// Swagger API Documentation UI (exempt from rate limit)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Global rate limiter — applies only to /api routes (100 requests per 15 minutes per IP)
app.use('/api', globalRateLimiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Force Content-Type: application/json for POST, PUT, PATCH
app.use((req: Request, res: Response, next: NextFunction): void => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    if (!req.is('application/json') && !req.is('multipart/form-data')) {
      res.status(415).json({
        success: false,
        message: 'Unsupported Media Type: Only application/json is allowed'
      });
      return;
    }
  }
  next();
});

// API Routes (versioned & backwards compatible)
const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/profile', profileRoutes);
apiRouter.use('/menu', menuRoutes);
apiRouter.use('/cart', cartRoutes);
apiRouter.use('/orders', orderRoutes);
apiRouter.use('/favorites', favoritesRoutes);
apiRouter.use('/categories', categoryRoutes);
apiRouter.use('/branches', branchRoutes);
apiRouter.use('/options', optionRoutes);
apiRouter.use('/menu', optionRoutes); // Also mount options under /menu for backwards compatibility
apiRouter.use('/ratings', ratingRoutes); // Mounts /products/:productId/ratings under /ratings
apiRouter.use('/loyalty', loyaltyRoutes);
apiRouter.use('/device-tokens', deviceTokenRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/wallet', walletRoutes);
apiRouter.use('/settings', settingsRoutes);
apiRouter.use('/app-settings', settingsRoutes);
apiRouter.use('/audit-logs', auditRoutes);
apiRouter.use('/audit', auditRoutes);
apiRouter.use('/staff', staffRoutes);
apiRouter.use('/admin/staff', staffRoutes);

// Mount versioned (/api/v1) and unversioned (/api) routes
app.use('/api/v1', apiRouter);
app.use('/api', apiRouter);

// Fallback for undefined routes (404)
app.all('*', (req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(errorMiddleware);

export { logger };
export default app;
