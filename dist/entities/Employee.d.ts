export declare class Employee {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    department: string;
    position?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    get fullName(): string;
    getApprovalToken(): string;
}
