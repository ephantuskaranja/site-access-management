export declare enum VehicleType {
    CAR = "car",
    TRUCK = "truck",
    VAN = "van",
    MOTORCYCLE = "motorcycle",
    BUS = "bus",
    OTHER = "other"
}
export declare enum VehicleStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    MAINTENANCE = "maintenance",
    RETIRED = "retired"
}
export declare class Vehicle {
    id: string;
    licensePlate: string;
    make?: string;
    model?: string;
    year?: number;
    color?: string;
    type: string;
    status: string;
    department?: string;
    assignedDriver?: string;
    currentMileage?: number;
    notes?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
