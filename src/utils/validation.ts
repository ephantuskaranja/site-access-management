import Joi from 'joi';
import { UserRole, UserStatus, VisitorStatus, VisitPurpose } from '../types';

// User validation schemas
export const createUserSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).required(),
  lastName: Joi.string().trim().min(2).max(50).required(),
  email: Joi.string().email().lowercase().trim().required(),
  phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).required(),
  password: Joi.string().min(8).max(128).required(),
  role: Joi.string().valid(...Object.values(UserRole)).required(),
  employeeId: Joi.string().trim().optional(),
  department: Joi.string().trim().max(100).optional(),
  status: Joi.string().valid(...Object.values(UserStatus)).optional(),
});

export const updateUserSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).optional(),
  lastName: Joi.string().trim().min(2).max(50).optional(),
  email: Joi.string().email().lowercase().trim().optional(),
  phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional(),
  role: Joi.string().valid(...Object.values(UserRole)).optional(),
  employeeId: Joi.string().trim().allow('').optional(),
  department: Joi.string().trim().max(100).allow('').optional(),
  status: Joi.string().valid(...Object.values(UserStatus)).optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(1).required(),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).max(128).required(),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
    .messages({ 'any.only': 'Passwords do not match' }),
});

// Visitor validation schemas
export const createVisitorSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).required(),
  lastName: Joi.string().trim().min(2).max(50).required(),
  email: Joi.string().email().lowercase().trim().optional().allow(''),
  phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).required(),
  idNumber: Joi.string().trim().min(5).max(50).required(),
  company: Joi.string().trim().max(100).optional().allow(''),
  vehicleNumber: Joi.string().trim().max(20).optional().allow(''),
  hostEmployee: Joi.string().trim().required(),
  hostDepartment: Joi.string().trim().required(),
  visitPurpose: Joi.string().valid(...Object.values(VisitPurpose)).required(),
  expectedDate: Joi.date().min('now').required(),
  expectedTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  notes: Joi.string().trim().max(500).optional().allow(''),
});

export const updateVisitorSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).optional(),
  lastName: Joi.string().trim().min(2).max(50).optional(),
  email: Joi.string().email().lowercase().trim().optional().allow(''),
  phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional(),
  company: Joi.string().trim().max(100).optional().allow(''),
  vehicleNumber: Joi.string().trim().max(20).optional().allow(''),
  hostEmployee: Joi.string().trim().optional(),
  hostDepartment: Joi.string().trim().optional(),
  visitPurpose: Joi.string().valid(...Object.values(VisitPurpose)).optional(),
  expectedDate: Joi.date().min('now').optional(),
  expectedTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  notes: Joi.string().trim().max(500).optional().allow(''),
});

export const approveVisitorSchema = Joi.object({
  notes: Joi.string().trim().max(500).optional().allow(''),
});

export const rejectVisitorSchema = Joi.object({
  reason: Joi.string().trim().min(10).max(500).required(),
});

export const checkInVisitorSchema = Joi.object({
  location: Joi.string().trim().max(100).optional().default('Main Gate'),
  notes: Joi.string().trim().max(500).optional().allow(''),
});

export const checkOutVisitorSchema = Joi.object({
  location: Joi.string().trim().max(100).optional().default('Main Gate'),
  notes: Joi.string().trim().max(500).optional().allow(''),
});

// Access log validation schemas
export const createAccessLogSchema = Joi.object({
  visitorId: Joi.string().hex().length(24).optional(),
  employeeId: Joi.string().hex().length(24).optional(),
  action: Joi.string().valid('check_in', 'check_out', 'access_granted', 'access_denied').required(),
  location: Joi.string().trim().max(100).required(),
  notes: Joi.string().trim().max(500).optional().allow(''),
});

// Query validation schemas
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().optional(),
  order: Joi.string().valid('asc', 'desc').default('desc'),
});

export const visitorQuerySchema = paginationSchema.keys({
  status: Joi.string().valid(...Object.values(VisitorStatus)).optional(),
  hostDepartment: Joi.string().trim().optional(),
  visitPurpose: Joi.string().valid(...Object.values(VisitPurpose)).optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().min(Joi.ref('startDate')).optional(),
  search: Joi.string().trim().max(100).optional(),
});

export const userQuerySchema = paginationSchema.keys({
  role: Joi.string().valid(...Object.values(UserRole)).optional(),
  status: Joi.string().valid(...Object.values(UserStatus)).optional(),
  department: Joi.string().trim().optional(),
  search: Joi.string().trim().max(100).optional(),
});

export const accessLogQuerySchema = paginationSchema.keys({
  startDate: Joi.date().optional(),
  endDate: Joi.date().min(Joi.ref('startDate')).optional(),
  guardId: Joi.string().hex().length(24).optional(),
  visitorId: Joi.string().hex().length(24).optional(),
  action: Joi.string().valid('check_in', 'check_out', 'access_granted', 'access_denied').optional(),
  location: Joi.string().trim().optional(),
});

// Parameter validation schemas
export const mongoIdSchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
});

// Company settings validation schema
export const updateCompanySettingsSchema = Joi.object({
  companyName: Joi.string().trim().min(2).max(100).optional(),
  address: Joi.string().trim().min(10).max(500).optional(),
  phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional(),
  email: Joi.string().email().lowercase().trim().optional(),
  workingHours: Joi.object({
    start: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    end: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  }).optional(),
  maxVisitorDuration: Joi.number().integer().min(30).max(1440).optional(),
  requirePreApproval: Joi.boolean().optional(),
  allowMultipleEntries: Joi.boolean().optional(),
  enableQRCode: Joi.boolean().optional(),
  enableEmailNotifications: Joi.boolean().optional(),
  emergencyContact: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional(),
});

// Report validation schema
export const generateReportSchema = Joi.object({
  type: Joi.string().valid('daily', 'weekly', 'monthly', 'custom').required(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().min(Joi.ref('startDate')).optional(),
  format: Joi.string().valid('pdf', 'csv', 'excel').default('pdf'),
  filters: Joi.object({
    department: Joi.string().trim().optional(),
    visitPurpose: Joi.string().valid(...Object.values(VisitPurpose)).optional(),
    status: Joi.string().valid(...Object.values(VisitorStatus)).optional(),
  }).optional(),
});