"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReportSchema = exports.updateCompanySettingsSchema = exports.mongoIdSchema = exports.accessLogQuerySchema = exports.userQuerySchema = exports.visitorQuerySchema = exports.paginationSchema = exports.createAccessLogSchema = exports.checkOutVisitorSchema = exports.checkInVisitorSchema = exports.rejectVisitorSchema = exports.approveVisitorSchema = exports.updateVisitorSchema = exports.createVisitorSchema = exports.changePasswordSchema = exports.loginSchema = exports.updateUserSchema = exports.createUserSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const types_1 = require("../types");
exports.createUserSchema = joi_1.default.object({
    firstName: joi_1.default.string().trim().min(2).max(50).required(),
    lastName: joi_1.default.string().trim().min(2).max(50).required(),
    email: joi_1.default.string().email().lowercase().trim().required(),
    phone: joi_1.default.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).required(),
    password: joi_1.default.string().min(8).max(128).required(),
    role: joi_1.default.string().valid(...Object.values(types_1.UserRole)).required(),
    employeeId: joi_1.default.string().trim().optional(),
    department: joi_1.default.string().trim().max(100).optional(),
    status: joi_1.default.string().valid(...Object.values(types_1.UserStatus)).optional(),
});
exports.updateUserSchema = joi_1.default.object({
    firstName: joi_1.default.string().trim().min(2).max(50).optional(),
    lastName: joi_1.default.string().trim().min(2).max(50).optional(),
    email: joi_1.default.string().email().lowercase().trim().optional(),
    phone: joi_1.default.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional(),
    role: joi_1.default.string().valid(...Object.values(types_1.UserRole)).optional(),
    employeeId: joi_1.default.string().trim().allow('').optional(),
    department: joi_1.default.string().trim().max(100).allow('').optional(),
    status: joi_1.default.string().valid(...Object.values(types_1.UserStatus)).optional(),
});
exports.loginSchema = joi_1.default.object({
    email: joi_1.default.string().email().lowercase().trim().required(),
    password: joi_1.default.string().min(1).required(),
});
exports.changePasswordSchema = joi_1.default.object({
    currentPassword: joi_1.default.string().required(),
    newPassword: joi_1.default.string().min(8).max(128).required(),
    confirmPassword: joi_1.default.string().valid(joi_1.default.ref('newPassword')).required()
        .messages({ 'any.only': 'Passwords do not match' }),
});
exports.createVisitorSchema = joi_1.default.object({
    firstName: joi_1.default.string().trim().min(2).max(50).required(),
    lastName: joi_1.default.string().trim().min(2).max(50).required(),
    email: joi_1.default.string().email().lowercase().trim().optional().allow(''),
    phone: joi_1.default.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).required(),
    idNumber: joi_1.default.string().trim().min(5).max(50).required(),
    visitorCardNumber: joi_1.default.string().trim().max(50).optional().allow(''),
    company: joi_1.default.string().trim().max(100).optional().allow(''),
    vehicleNumber: joi_1.default.string().trim().max(20).optional().allow(''),
    hostEmployee: joi_1.default.string().trim().required(),
    hostDepartment: joi_1.default.string().trim().required(),
    visitPurpose: joi_1.default.string().valid(...Object.values(types_1.VisitPurpose)).required(),
    expectedDate: joi_1.default.date().min('now').required(),
    expectedTime: joi_1.default.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    notes: joi_1.default.string().trim().max(500).optional().allow(''),
    autoApprove: joi_1.default.boolean().optional().default(false),
});
exports.updateVisitorSchema = joi_1.default.object({
    firstName: joi_1.default.string().trim().min(2).max(50).optional(),
    lastName: joi_1.default.string().trim().min(2).max(50).optional(),
    email: joi_1.default.string().email().lowercase().trim().optional().allow(''),
    phone: joi_1.default.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional(),
    visitorCardNumber: joi_1.default.string().trim().max(50).optional().allow(''),
    company: joi_1.default.string().trim().max(100).optional().allow(''),
    vehicleNumber: joi_1.default.string().trim().max(20).optional().allow(''),
    hostEmployee: joi_1.default.string().trim().optional(),
    hostDepartment: joi_1.default.string().trim().optional(),
    visitPurpose: joi_1.default.string().valid(...Object.values(types_1.VisitPurpose)).optional(),
    expectedDate: joi_1.default.date().min('now').optional(),
    expectedTime: joi_1.default.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    notes: joi_1.default.string().trim().max(500).optional().allow(''),
});
exports.approveVisitorSchema = joi_1.default.object({
    notes: joi_1.default.string().trim().max(500).optional().allow(''),
});
exports.rejectVisitorSchema = joi_1.default.object({
    reason: joi_1.default.string().trim().min(10).max(500).required(),
});
exports.checkInVisitorSchema = joi_1.default.object({
    location: joi_1.default.string().trim().max(100).optional().default('Main Gate'),
    notes: joi_1.default.string().trim().max(500).optional().allow(''),
});
exports.checkOutVisitorSchema = joi_1.default.object({
    location: joi_1.default.string().trim().max(100).optional().default('Main Gate'),
    notes: joi_1.default.string().trim().max(500).optional().allow(''),
});
exports.createAccessLogSchema = joi_1.default.object({
    visitorId: joi_1.default.string().hex().length(24).optional(),
    employeeId: joi_1.default.string().hex().length(24).optional(),
    action: joi_1.default.string().valid('check_in', 'check_out', 'access_granted', 'access_denied').required(),
    location: joi_1.default.string().trim().max(100).required(),
    notes: joi_1.default.string().trim().max(500).optional().allow(''),
});
exports.paginationSchema = joi_1.default.object({
    page: joi_1.default.number().integer().min(1).default(1),
    limit: joi_1.default.number().integer().min(1).max(100).default(10),
    sort: joi_1.default.string().optional(),
    order: joi_1.default.string().valid('asc', 'desc').default('desc'),
});
exports.visitorQuerySchema = exports.paginationSchema.keys({
    status: joi_1.default.string().valid(...Object.values(types_1.VisitorStatus)).optional(),
    hostDepartment: joi_1.default.string().trim().optional(),
    visitPurpose: joi_1.default.string().valid(...Object.values(types_1.VisitPurpose)).optional(),
    startDate: joi_1.default.date().optional(),
    endDate: joi_1.default.date().min(joi_1.default.ref('startDate')).optional(),
    search: joi_1.default.string().trim().max(100).optional(),
});
exports.userQuerySchema = exports.paginationSchema.keys({
    role: joi_1.default.string().valid(...Object.values(types_1.UserRole)).optional(),
    status: joi_1.default.string().valid(...Object.values(types_1.UserStatus)).optional(),
    department: joi_1.default.string().trim().optional(),
    search: joi_1.default.string().trim().max(100).optional(),
});
exports.accessLogQuerySchema = exports.paginationSchema.keys({
    startDate: joi_1.default.date().optional(),
    endDate: joi_1.default.date().min(joi_1.default.ref('startDate')).optional(),
    guardId: joi_1.default.string().hex().length(24).optional(),
    visitorId: joi_1.default.string().hex().length(24).optional(),
    action: joi_1.default.string().valid('check_in', 'check_out', 'access_granted', 'access_denied').optional(),
    location: joi_1.default.string().trim().optional(),
});
exports.mongoIdSchema = joi_1.default.object({
    id: joi_1.default.string().hex().length(24).required(),
});
exports.updateCompanySettingsSchema = joi_1.default.object({
    companyName: joi_1.default.string().trim().min(2).max(100).optional(),
    address: joi_1.default.string().trim().min(10).max(500).optional(),
    phone: joi_1.default.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional(),
    email: joi_1.default.string().email().lowercase().trim().optional(),
    workingHours: joi_1.default.object({
        start: joi_1.default.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
        end: joi_1.default.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    }).optional(),
    maxVisitorDuration: joi_1.default.number().integer().min(30).max(1440).optional(),
    requirePreApproval: joi_1.default.boolean().optional(),
    allowMultipleEntries: joi_1.default.boolean().optional(),
    enableQRCode: joi_1.default.boolean().optional(),
    enableEmailNotifications: joi_1.default.boolean().optional(),
    emergencyContact: joi_1.default.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional(),
});
exports.generateReportSchema = joi_1.default.object({
    type: joi_1.default.string().valid('daily', 'weekly', 'monthly', 'custom').required(),
    startDate: joi_1.default.date().optional(),
    endDate: joi_1.default.date().min(joi_1.default.ref('startDate')).optional(),
    format: joi_1.default.string().valid('pdf', 'csv', 'excel').default('pdf'),
    filters: joi_1.default.object({
        department: joi_1.default.string().trim().optional(),
        visitPurpose: joi_1.default.string().valid(...Object.values(types_1.VisitPurpose)).optional(),
        status: joi_1.default.string().valid(...Object.values(types_1.VisitorStatus)).optional(),
    }).optional(),
});
//# sourceMappingURL=validation.js.map