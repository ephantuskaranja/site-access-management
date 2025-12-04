import { AlertType, AlertSeverity } from '../types';
import { User } from './User';
export declare class Alert {
    id: string;
    type: AlertType;
    severity: AlertSeverity;
    title: string;
    message: string;
    user?: User;
    userId?: string;
    isRead: boolean;
    actionRequired: boolean;
    metadata?: string;
    createdAt: Date;
    updatedAt: Date;
    markAsRead(): void;
    markAsUnread(): void;
    get parsedMetadata(): any;
    setMetadata(data: any): void;
}
