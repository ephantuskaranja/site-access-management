import { Vehicle } from './Vehicle';
import { User } from './User';
export declare enum MovementType {
    ENTRY = "entry",
    EXIT = "exit"
}
export declare enum MovementStatus {
    PENDING = "pending",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}
export declare class VehicleMovement {
    id: string;
    vehicleId: string;
    area: string;
    movementType: string;
    status: string;
    mileage: number;
    driverName: string;
    driverPhone?: string;
    driverLicense?: string;
    purpose?: string;
    notes?: string;
    destination: string | null;
    recordedById: string;
    recordedAt: Date;
    vehicle: Vehicle;
    recordedBy: User;
    createdAt: Date;
    updatedAt: Date;
}
