import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';

import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiRouter } from './routes/index.js';

export const createApp = () => {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin || env.clientOrigins.includes(origin)) return cb(null, true);
        return cb(new Error(`Origin not allowed by CORS: ${origin}`));
      },
      credentials: true,
    }),
  );

  // Razorpay signs the raw body — capture it before JSON parsing replaces it.
  app.use(
    express.json({
      limit: '1mb',
      verify: (req, res, buf) => {
        if (req.originalUrl.endsWith('/payments/webhook')) req.rawBody = buf;
      },
    }),
  );
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  if (!env.isTest) {
    app.use(morgan('dev', { stream: { write: (line) => logger.debug(line.trim()) } }));
  }

  app.use('/uploads', express.static(env.uploads.dir, { maxAge: '1d' }));

  app.get('/api/v1/health', (req, res) => {
    res.json({
      success: true,
      data: {
        status: 'up',
        env: env.nodeEnv,
        db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        uptimeSeconds: Math.round(process.uptime()),
        time: new Date().toISOString(),
      },
      message: 'Service healthy',
    });
  });

  app.use('/api/v1', apiLimiter, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export default createApp;
