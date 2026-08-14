import 'reflect-metadata';
import express, { Request, Response, NextFunction } from 'express';
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
    // Dev mode: allow all
    if (!isProduction) return callback(null, true);
    // Production with whitelist: check origin
    if (allowedOrigins.length > 0) {
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS: Origin '${origin}' not allowed`), false);
    }
    return callback(null, true);
  },
  credentials: true,
}));

// HTTP request logging — structured JSON in prod, colorized in dev
app.use(morgan(isProduction ? 'combined' : 'dev'));

// Global rate limiter — 100 requests per 15 minutes per IP
app.use(globalRateLimiter);

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

// Health Check Endpoint — includes DB connectivity test
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

// Swagger API Documentation UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/menu', optionRoutes); // Mount options under /api/menu to match client paths
app.use('/api/ratings', ratingRoutes); // Mounts /products/:productId/ratings under /api/ratings
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/device-tokens', deviceTokenRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/app-settings', settingsRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/audit', auditRoutes);

// Fallback for undefined routes (404)
app.all('*', (req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(errorMiddleware);

export { logger };
export default app;
