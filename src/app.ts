import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './config/swagger.json';

// Import Config
import { logger } from './config/logger';

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
import settingsRoutes from './modules/settings/settings.routes';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

const app = express();

// Global Middlewares
app.use(helmet({
  contentSecurityPolicy: false
}));

// CORS — restrict to allowed origins in production
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (!isProduction) return callback(null, true); // Dev: allow all
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS: Origin '${origin}' not allowed`), false);
  },
  credentials: true,
}));

// HTTP request logging — structured JSON in prod, colorized in dev
app.use(morgan(isProduction ? 'combined' : 'dev'));

// Global rate limiter — 100 requests per 15 minutes per IP
app.use(globalRateLimiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
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
app.use('/api/options', optionRoutes);
app.use('/api', ratingRoutes); // Mounts /products/:productId/ratings under /api
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/device-tokens', deviceTokenRoutes);
app.use('/api/settings', settingsRoutes);

// Fallback for undefined routes (404)
app.all('*', (req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(errorMiddleware);

export { logger };
export default app;
