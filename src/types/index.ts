import { Request } from 'express';

// User Types
export enum UserRole {
  ADMIN = 'admin',
  SECURITY_GUARD = 'security_guard',
  EMPLOYEE = 'employee',
  VISITOR = 'visitor',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export interface IUser {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  password?: string;
  employeeId?: string;
  department?: string;
  profileImage?: string;
  loginAttempts: number;
  lockUntil?: Date;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Visitor Types
export enum VisitorStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CHECKED_IN = 'checked_in',
  CHECKED_OUT = 'checked_out',
  EXPIRED = 'expired',
}

export enum VisitPurpose {
  MEETING = 'meeting',
  DELIVERY = 'delivery',
  MAINTENANCE = 'maintenance',
  INTERVIEW = 'interview',
  OTHER = 'other',
}

export interface IVisitor {
  _id?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  idNumber: string;
  company?: string;
  vehicleNumber?: string;
  photo?: string;
  qrCode?: string;
  hostEmployee: string; // Employee ID or name
  hostDepartment: string;
  visitPurpose: VisitPurpose;
  expectedDate: Date;
  expectedTime: string;
  actualCheckIn?: Date;
  actualCheckOut?: Date;
  status: VisitorStatus;
  approvedBy?: string;
  rejectionReason?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Access Log Types
export enum AccessAction {
  CHECK_IN = 'check_in',
  CHECK_OUT = 'check_out',
  ACCESS_GRANTED = 'access_granted',
  ACCESS_DENIED = 'access_denied',
}

export interface IAccessLog {
  _id?: string;
  visitorId?: string;
  employeeId?: string;
  guardId: string;
  action: AccessAction;
  location: string;
  timestamp: Date;
  notes?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: Date;
}

// Alert Types
export enum AlertType {
  SECURITY = 'security',
  SYSTEM = 'system',
  VISITOR = 'visitor',
  ACCESS = 'access',
}

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface IAlert {
  _id?: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  userId?: string;
  isRead: boolean;
  actionRequired: boolean;
  metadata?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

// Company Settings
export interface ICompanySettings {
  _id?: string;
  companyName: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
  workingHours: {
    start: string;
    end: string;
  };
  maxVisitorDuration: number; // in minutes
  requirePreApproval: boolean;
  allowMultipleEntries: boolean;
  enableQRCode: boolean;
  enableEmailNotifications: boolean;
  emergencyContact: string;
  updatedBy: string;
  updatedAt?: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: any[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Authentication Types
export interface AuthTokenPayload {
  userId: string;
  role: UserRole;
  email: string;
  iat?: number;
  exp?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: Omit<IUser, 'password'>;
}

// Express Request Extensions
export interface AuthRequest extends Request {
  user?: IUser;
  userId?: string;
}

// Dashboard Statistics
export interface DashboardStats {
  totalVisitors: number;
  activeVisitors: number;
  pendingApprovals: number;
  todayEntries: number;
  todayExits: number;
  alertsCount: number;
  recentActivities: IAccessLog[];
}

// Validation Types
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// File Upload Types
export interface FileUploadOptions {
  allowedTypes: string[];
  maxSize: number;
  destination: string;
}

// Email Types
export interface EmailData {
  to: string;
  subject: string;
  template: string;
  data: any;
}

// Report Types
export enum ReportType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom',
}

export interface ReportParams {
  type: ReportType;
  startDate: Date;
  endDate: Date;
  filters?: any;
}