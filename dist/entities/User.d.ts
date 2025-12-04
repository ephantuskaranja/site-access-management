import { UserRole, UserStatus } from '../types';
export declare class User {
    id: string;
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
    requirePasswordChange: boolean;
    createdAt: Date;
    updatedAt: Date;
    get fullName(): string;
    hashPassword(): Promise<void>;
    isPasswordCorrect(candidatePassword: string): Promise<boolean>;
    isLocked(): boolean;
    toJSON(): any;
}
