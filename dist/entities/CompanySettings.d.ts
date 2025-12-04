import { User } from './User';
export declare class CompanySettings {
    id: string;
    companyName: string;
    address: string;
    phone: string;
    email: string;
    logo?: string;
    workingHours: string;
    maxVisitorDuration: number;
    requirePreApproval: boolean;
    allowMultipleEntries: boolean;
    enableQRCode: boolean;
    enableEmailNotifications: boolean;
    emergencyContact: string;
    updatedBy: User;
    updatedById: string;
    createdAt: Date;
    updatedAt: Date;
    getWorkingHours(): {
        start: string;
        end: string;
    };
    setWorkingHours(hours: {
        start: string;
        end: string;
    }): void;
    validateWorkingHours(): void;
    updateSettings(updates: Partial<CompanySettings>, userId: string): void;
    getPublicSettings(): any;
    isWithinWorkingHours(checkTime?: Date): boolean;
}
