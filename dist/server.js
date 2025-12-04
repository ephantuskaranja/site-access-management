"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const express_ejs_layouts_1 = __importDefault(require("express-ejs-layouts"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const path_1 = __importDefault(require("path"));
const config_1 = __importDefault(require("./config"));
const logger_1 = __importDefault(require("./config/logger"));
const database_1 = __importDefault(require("./config/database"));
const errorHandler_1 = require("./middleware/errorHandler");
const swagger_1 = require("./utils/swagger");
const auth_1 = __importDefault(require("./routes/auth"));
const visitors_1 = __importDefault(require("./routes/visitors"));
const vehicles_1 = __importDefault(require("./routes/vehicles"));
const vehicleMovements_1 = __importDefault(require("./routes/vehicleMovements"));
const employees_1 = __importDefault(require("./routes/employees"));
const reports_1 = __importDefault(require("./routes/reports"));
class App {
    constructor() {
        this.app = (0, express_1.default)();
        this.server = (0, http_1.createServer)(this.app);
        this.io = new socket_io_1.Server(this.server, {
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
    }
    initializeMiddlewares() {
        this.app.use((0, helmet_1.default)({
            contentSecurityPolicy: false,
            crossOriginOpenerPolicy: false,
            crossOriginEmbedderPolicy: false,
            crossOriginResourcePolicy: false,
            hsts: false,
            originAgentCluster: false,
            referrerPolicy: { policy: 'no-referrer' },
        }));
        this.app.use((0, cors_1.default)({
            origin: process.env.FRONTEND_URL || true,
            credentials: true,
        }));
        const buckets = new Map();
        const simpleLimiter = (req, res, next) => {
            const now = Date.now();
            const key = req.ip || 'unknown';
            const windowMs = config_1.default.rateLimit.windowMs;
            const max = config_1.default.rateLimit.max;
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
        this.app.use((0, compression_1.default)());
        this.app.use((0, morgan_1.default)('combined', {
            stream: {
                write: (message) => logger_1.default.info(message.trim()),
            },
        }));
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        this.app.use((_req, res, next) => {
            res.locals.idleTimeoutMs = (config_1.default.session.idleTimeoutMinutes || 15) * 60 * 1000;
            next();
        });
        const publicPath = path_1.default.join(__dirname, '..', 'public');
        this.app.use(express_1.default.static(publicPath));
        this.app.use(express_ejs_layouts_1.default);
        this.app.set("views", path_1.default.join(__dirname, "../src/views"));
        this.app.set('view engine', 'ejs');
        this.app.set('layout', 'layout');
        this.app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
        this.app.use('/public', express_1.default.static(path_1.default.join(__dirname, '../public')));
    }
    initializeRoutes() {
        this.app.get('/health', (_req, res) => {
            res.status(200).json({
                success: true,
                message: 'Site Access Management System is running',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                environment: config_1.default.nodeEnv,
            });
        });
        this.app.use('/api/auth', auth_1.default);
        this.app.use('/api/visitors', visitors_1.default);
        this.app.use('/api/vehicles', vehicles_1.default);
        this.app.use('/api/vehicle-movements', vehicleMovements_1.default);
        this.app.use('/api/employees', employees_1.default);
        this.app.use('/api/reports', reports_1.default);
        this.setupFrontendRoutes();
        if (config_1.default.nodeEnv === 'production') {
            this.app.use(express_1.default.static(path_1.default.join(__dirname, '../client/build')));
            this.app.get('*', (_req, res) => {
                res.sendFile(path_1.default.join(__dirname, '../client/build/index.html'));
            });
        }
    }
    initializeSocketIO() {
        this.io.on('connection', (socket) => {
            logger_1.default.info(`New client connected: ${socket.id}`);
            socket.on('join-room', (room) => {
                socket.join(room);
                logger_1.default.info(`Socket ${socket.id} joined room: ${room}`);
            });
            socket.on('disconnect', () => {
                logger_1.default.info(`Client disconnected: ${socket.id}`);
            });
        });
    }
    initializeErrorHandling() {
        this.app.use(errorHandler_1.notFound);
        this.app.use(errorHandler_1.errorHandler);
    }
    setupSwagger() {
        (0, swagger_1.setupSwagger)(this.app);
    }
    setupFrontendRoutes() {
        this.app.get('/', (_req, res) => {
            res.render('login', {
                title: 'Sign In - Site Access Management',
                layout: false
            });
        });
        this.app.get('/dashboard', (_req, res) => {
            res.render('dashboard', {
                title: 'Dashboard - Site Access Management',
                page: 'dashboard'
            });
        });
        this.app.get('/users', (_req, res) => {
            res.render('users', {
                title: 'User Management - Site Access Management',
                page: 'users'
            });
        });
        this.app.get('/visitors', (_req, res) => {
            res.render('visitors', {
                title: 'Visitor Management - Site Access Management',
                page: 'visitors'
            });
        });
        this.app.get('/vehicles', (_req, res) => {
            res.render('vehicles', {
                title: 'Vehicle Management - Site Access Management',
                page: 'vehicles'
            });
        });
        this.app.get('/movements', (_req, res) => {
            res.render('movements', {
                title: 'Vehicle Movements - Site Access Management',
                page: 'movements'
            });
        });
        this.app.get('/reports', (_req, res) => {
            res.render('reports', {
                title: 'Reports - Site Access Management',
                page: 'reports'
            });
        });
        this.app.get('/settings', (_req, res) => {
            res.render('settings', {
                title: 'Settings - Site Access Management',
                page: 'settings'
            });
        });
    }
    async start() {
        try {
            await database_1.default.connect();
            this.server.listen(config_1.default.port, () => {
                logger_1.default.info(`🚀 Server running on port ${config_1.default.port} in ${config_1.default.nodeEnv} mode`);
                logger_1.default.info(`📚 API Documentation: http://localhost:${config_1.default.port}/api-docs`);
            });
            process.on('SIGTERM', this.gracefulShutdown.bind(this));
            process.on('SIGINT', this.gracefulShutdown.bind(this));
        }
        catch (error) {
            logger_1.default.error('Failed to start server:', error);
            process.exit(1);
        }
    }
    async gracefulShutdown(signal) {
        logger_1.default.info(`Received ${signal}, shutting down gracefully`);
        this.server.close(() => {
            logger_1.default.info('HTTP server closed');
            database_1.default.disconnect().then(() => {
                logger_1.default.info('Database connection closed');
                process.exit(0);
            });
        });
        setTimeout(() => {
            logger_1.default.error('Could not close connections in time, forcefully shutting down');
            process.exit(1);
        }, 10000);
    }
}
const app = new App();
if (require.main === module) {
    app.start();
}
exports.default = app;
//# sourceMappingURL=server.js.map