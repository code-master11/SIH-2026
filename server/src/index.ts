import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import { config } from './config';
import { globalLimiter } from './middleware/rateLimit.middleware';
import { initSocket } from './socket/socket.handler';
import { errorResponse } from './utils/api-response';
import logger from './lib/logger';

// ─── Ensure required directories exist on startup ─────────────────────────────
const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logger.info(`Created directory: ${dir}`);
  }
};
ensureDir(path.resolve(config.UPLOAD_DIR as string));
ensureDir(path.resolve('./temp'));

// Routes
import authRoutes from './routes/auth.routes';
import caseRoutes from './routes/case.routes';
import documentRoutes from './routes/document.routes';
import auditRoutes from './routes/audit.routes';
import searchRoutes from './routes/search.routes';
import adminRoutes from './routes/admin.routes';
import notificationRoutes from './routes/notification.routes';

const app = express();
const server = http.createServer(app);

// Init Socket.io
initSocket(server);

// Middleware
app.use(helmet());
app.use(cors({ origin: config.FRONTEND_URL, credentials: true }));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use('/api/', globalLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(`${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  errorResponse(res, err.status || 500, err.message || 'Internal Server Error');
});

// Start Server
const PORT = config.PORT;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${config.NODE_ENV} mode`);
});
