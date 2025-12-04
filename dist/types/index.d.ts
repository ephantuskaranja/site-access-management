import { Request } from 'express';
export declare enum UserRole {
    ADMIN = "admin",
    SECURITY_GUARD = "security_guard",
    RECEPTIONIST = "receptionist",
    VISITOR = "visitor"
}
export declare enum UserStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    SUSPENDED = "suspended"
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
export interface IEmployee {
    id?: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    department: string;
    position?: string;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare enum VisitorStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected",
    CHECKED_IN = "checked_in",
    CHECKED_OUT = "checked_out",
    EXPIRED = "expired"
}
export declare enum VisitPurpose {
    MEETING = "meeting",
    DELIVERY = "delivery",
    PIG_DELIVERY = "pig_delivery",
    MAINTENANCE = "maintenance",
    CONTRACT_WORKS = "contract_works",
    INTERVIEW = "interview",
    PIG_ORDER = "pig_order",
    OTHER = "other"
}
export interface IVisitor {
    _id?: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone: string;
    idNumber: string;
    visitorCardNumber?: string;
    company?: string;
    vehicleNumber?: string;
    photo?: string;
    qrCode?: string;
    hostEmployee: string;
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
export declare enum AccessAction {
    CHECK_IN = "check_in",
    CHECK_OUT = "check_out",
    ACCESS_GRANTED = "access_granted",
    ACCESS_DENIED = "access_denied",
    LOGIN = "login",
    LOGOUT = "logout",
    LOGIN_FAILED = "login_failed",
    VISITOR_CHECKIN = "visitor_checkin",
    VISITOR_CHECKOUT = "visitor_checkout",
    VEHICLE_ENTRY = "vehicle_entry",
    VEHICLE_EXIT = "vehicle_exit",
    SUSPICIOUS_ACTIVITY = "suspicious_activity"
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
export declare enum AlertType {
    SECURITY = "security",
    SYSTEM = "system",
    VISITOR = "visitor",
    ACCESS = "access"
}
export declare enum AlertSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
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
    maxVisitorDuration: number;
    requirePreApproval: boolean;
    allowMultipleEntries: boolean;
    enableQRCode: boolean;
    enableEmailNotifications: boolean;
    emergencyContact: string;
    updatedBy: string;
    updatedAt?: Date;
}
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
export interface AuthRequest extends Request {
    user?: IUser;
    userId?: string;
}
export interface DashboardStats {
    totalVisitors: number;
    activeVisitors: number;
    pendingApprovals: number;
    todayEntries: number;
    todayExits: number;
    alertsCount: number;
    recentActivities: IAccessLog[];
}
export interface ValidationError {
    field: string;
    message: string;
    value?: any;
}
export interface FileUploadOptions {
    allowedTypes: string[];
    maxSize: number;
    destination: string;
}
export interface EmailData {
    to: string;
    subject: string;
    template: string;
    data: any;
}
export declare enum ReportType {
    DAILY = "daily",
    WEEKLY = "weekly",
    MONTHLY = "monthly",
    CUSTOM = "custom"
}
export interface ReportParams {
    type: ReportType;
    startDate: Date;
    endDate: Date;
    filters?: any;
}
