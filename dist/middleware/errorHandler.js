"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.notFound = exports.errorHandler = exports.AppError = void 0;
const logger_1 = __importDefault(require("../config/logger"));
class AppError extends Error {
    constructor(message, statusCode, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const errorHandler = (err, req, res, _next) => {
    let error = { ...err };
    error.message = err.message;
    logger_1.default.error('Error:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
    });
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = new AppError(message, 404);
    }
    if (err.code === 11000) {
        const message = 'Duplicate field value entered';
        error = new AppError(message, 400);
    }
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map((val) => val.message).join(', ');
        error = new AppError(message, 400);
    }
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid token';
        error = new AppError(message, 401);
    }
    if (err.name === 'TokenExpiredError') {
        const message = 'Token expired';
        error = new AppError(message, 401);
    }
    const response = {
        success: false,
        message: error.isOperational
            ? error.message
            : 'Something went wrong',
        ...(process.env.NODE_ENV === 'development' && { error: err.stack }),
    };
    res.status(error.statusCode || 500).json(response);
};
exports.errorHandler = errorHandler;
const notFound = (req, res, _next) => {
    const message = `Route ${req.originalUrl} not found`;
    const response = {
        success: false,
        message,
    };
    res.status(404).json(response);
};
exports.notFound = notFound;
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
exports.asyncHandler = asyncHandler;
//# sourceMappingURL=errorHandler.js.map