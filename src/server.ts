// Load environment variables from project root regardless of working directory
import './loadEnv';
import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import expressLayouts from 'express-ejs-layouts';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';

import config from './config';
import logger from './config/logger';
import database from './config/database';
import { errorHandler, notFound } from './middleware/errorHandler';
import { setupSwagger } from './utils/swagger';

// Import routes
import authRoutes from './routes/auth';
import visitorRoutes from './routes/visitors';
import vehicleRoutes from './routes/vehicles';
import vehicleMovementRoutes from './routes/vehicleMovements';
import employeeRoutes from './routes/employees';
import externalVehicleMovementRoutes from './routes/externalVehicleMovements';
import reportsRoutes from './routes/reports';
// import userRoutes from './routes/users';
// import dashboardRoutes from './routes/dashboard';
// import accessLogRoutes from './routes/accessLogs';
// import settingsRoutes from './routes/settings';

class App {
  public app: express.Application;
  public server: any;
  public io: Server;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.setupSwagger();
    this.initializeSocketIO();
    this.initializeErrorHandling();

    // Global error logging to diagnose crashes
    process.on('unhandledRejection', (reason: any) => {
      logger.error('Unhandled promise rejection:', reason);
    });
    process.on('uncaughtException', (err: Error) => {
      logger.error('Uncaught exception:', err);
    });
  }

  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: false,
      crossOriginOpenerPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: false,
      hsts: false,
      originAgentCluster: false,
      referrerPolicy: { policy: 'no-referrer' },
    }));

    // CORS
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || true,
      credentials: true,
    }));

    // Rate limiting (CJS-safe simple in-memory limiter)
    const buckets = new Map<string, { count: number; resetAt: number }>();
    const simpleLimiter: express.RequestHandler = (req, res, next) => {
      const now = Date.now();
      const key = req.ip || 'unknown';
      const windowMs = config.rateLimit.windowMs;
      const max = config.rateLimit.max;
      const bucket = buckets.get(key);
      if (!bucket || now > bucket.resetAt) {
        buckets.set(key, { count: 1, resetAt: now + windowMs });
        return next();
      }
      if (bucket.count < max) {
        bucket.count += 1;
        return next();
      }
      const retryAfter = Math.max(0, Math.ceil((bucket.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({
        message: 'Too many requests from this IP, please try again later.'
      });
    };
    this.app.use(simpleLimiter);

    // Compression
    this.app.use(compression());

    // Logging
    this.app.use(morgan('combined', {
      stream: {
        write: (message: string) => logger.info(message.trim()),
      },
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Expose runtime config to views (e.g., idle timeout for client)
    this.app.use((_req, res, next) => {
      res.locals.idleTimeoutMs = (config.session.idleTimeoutMinutes || 15) * 60 * 1000;
      next();
    });

    // Static files (CSS, JS, images)
    const publicPath = path.join(__dirname, '..', 'public');
    this.app.use(express.static(publicPath));
    

    // Set view engine and layouts
    this.app.use(expressLayouts);
    // Resolve views path for both dev (src) and production (dist)
    const devViews = path.join(__dirname, 'views');
    const prodViews = path.join(__dirname, '../src/views');
    this.app.set("views", devViews);
    try {
      // If dev path doesn't exist (running from dist), switch to prod path
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const fs = require('fs');
      if (!fs.existsSync(devViews) && fs.existsSync(prodViews)) {
        this.app.set("views", prodViews);
      }
    } catch (_) {
      // Fallback to prodViews if any error
      this.app.set("views", prodViews);
    }
    this.app.set('view engine', 'ejs');
    this.app.set('layout', 'layout'); // Use layout.ejs as default layout

    // Static files
    this.app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
    this.app.use('/public', express.static(path.join(__dirname, '../public')));
  }

  private initializeRoutes(): void {
    // Health check
    this.app.get('/health', (_req, res) => {
      res.status(200).json({
        success: true,
        message: 'Site Access Management System is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.nodeEnv,
      });
    });

    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/visitors', visitorRoutes);
    this.app.use('/api/vehicles', vehicleRoutes);
    this.app.use('/api/vehicle-movements', vehicleMovementRoutes);
    this.app.use('/api/employees', employeeRoutes);
    this.app.use('/api/reports', reportsRoutes);
    this.app.use('/api/external-vehicle-movements', externalVehicleMovementRoutes);
    // this.app.use('/api/users', userRoutes);
    // this.app.use('/api/dashboard', dashboardRoutes);
    // this.app.use('/api/access-logs', accessLogRoutes);

    // Frontend routes
    this.setupFrontendRoutes();
    // this.app.use('/api/settings', settingsRoutes);

    // Serve frontend in production
    if (config.nodeEnv === 'production') {
      this.app.use(express.static(path.join(__dirname, '../client/build')));
      this.app.get('*', (_req, res) => {
        res.sendFile(path.join(__dirname, '../client/build/index.html'));
      });
    }
  }

  private initializeSocketIO(): void {
    this.io.on('connection', (socket) => {
      logger.info(`New client connected: ${socket.id}`);

      // Join room based on user role
      socket.on('join-room', (room) => {
        socket.join(room);
        logger.info(`Socket ${socket.id} joined room: ${room}`);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFound);
    
    // Global error handler
    this.app.use(errorHandler);
  }

  private setupSwagger(): void {
    setupSwagger(this.app);
  }

  private setupFrontendRoutes(): void {
    // Login page (no layout)
    this.app.get('/', (_req, res) => {
      res.render('login', { 
        title: 'Sign In - Site Access Management',
        layout: false // Don't use layout for login page
      });
    });

    // Dashboard
    this.app.get('/dashboard', (_req, res) => {
      res.render('dashboard', { 
        title: 'Dashboard - Site Access Management',
        page: 'dashboard'
      });
    });

    // User management
    this.app.get('/users', (_req, res) => {
      res.render('users', { 
        title: 'User Management - Site Access Management',
        page: 'users'
      });
    });

    // Visitor management
    this.app.get('/visitors', (_req, res) => {
      res.render('visitors', { 
        title: 'Visitor Management - Site Access Management',
        page: 'visitors'
      });
    });

    // Vehicle management
    this.app.get('/vehicles', (_req, res) => {
      res.render('vehicles', { 
        title: 'Vehicle Management - Site Access Management',
        page: 'vehicles'
      });
    });

    // Vehicle movements
    this.app.get('/movements', (_req, res) => {
      res.render('movements', { 
        title: 'Vehicle Movements - Site Access Management',
        page: 'movements'
      });
    });

    // Reports
    this.app.get('/reports', (_req, res) => {
      res.render('reports', { 
        title: 'Reports - Site Access Management',
        page: 'reports'
      });
    });

    // Settings
    this.app.get('/settings', (_req, res) => {
      res.render('settings', { 
        title: 'Settings - Site Access Management',
        page: 'settings'
      });
    });
  }

  public async start(): Promise<void> {
    try {
      // Connect to database
      await database.connect();

      // Start server
      this.server.listen(config.port, () => {
        logger.info(`🚀 Server running on port ${config.port} in ${config.nodeEnv} mode`);
        logger.info(`📚 API Documentation: http://localhost:${config.port}/api-docs`);
      });

      // Graceful shutdown
      process.on('SIGTERM', this.gracefulShutdown.bind(this));
      process.on('SIGINT', this.gracefulShutdown.bind(this));

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  private async gracefulShutdown(signal: string): Promise<void> {
    logger.info(`Received ${signal}, shutting down gracefully`);

    this.server.close(() => {
      logger.info('HTTP server closed');
      
      database.disconnect().then(() => {
        logger.info('Database connection closed');
        process.exit(0);
      });
    });

    // Force close after 10s
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  }
}

// Create and start the application
const app = new App();

if (require.main === module) {
  app.start();
}

export default app;