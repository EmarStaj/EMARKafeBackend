import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './config/swagger.json';

// Import Middlewares
import { errorMiddleware } from './middlewares/error.middleware';
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

const app = express();

// Global Middlewares
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
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

export default app;
