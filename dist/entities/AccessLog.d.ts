import { AccessAction } from '../types';
import { User } from './User';
import { Visitor } from './Visitor';
export declare class AccessLog {
    id: string;
    visitor?: Visitor;
    visitorId?: string;
    employee?: User;
    employeeId?: string;
    guard: User;
    guardId: string;
    action: AccessAction;
    location: string;
    timestamp: Date;
    notes?: string;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
}
