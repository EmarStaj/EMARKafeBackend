import 'reflect-metadata';
import app, { logger } from './app';

// Auto-deploy test trigger

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
  console.log(`🚀 EMARKafe Backend running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: any) => {
  logger.error('Unhandled Rejection! Shutting down server...');
  logger.error(err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: any) => {
  logger.error('Uncaught Exception! Shutting down server...');
  logger.error(err);
  process.exit(1);
});
