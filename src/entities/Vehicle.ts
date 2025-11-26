import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum VehicleType {
  CAR = 'car',
  TRUCK = 'truck',
  VAN = 'van',
  MOTORCYCLE = 'motorcycle',
  BUS = 'bus',
  OTHER = 'other'
}

export enum VehicleStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  RETIRED = 'retired'
}

@Entity('vehicles')
@Index(['licensePlate'], { unique: true })
@Index(['status'])
@Index(['type'])
@Index(['isActive'])
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 20, unique: true })
  licensePlate!: string;

  @Column({ nullable: true, length: 50 })
  make?: string;

  @Column({ nullable: true, length: 50 })
  model?: string;

  @Column({ nullable: true, type: 'int' })
  year?: number;

  @Column({ nullable: true, length: 30 })
  color?: string;

  @Column({
    length: 20,
    default: VehicleType.CAR
  })
  type!: string; // Changed to string for SQL Server compatibility

  @Column({
    length: 20,
    default: VehicleStatus.ACTIVE
  })
  status!: string; // Changed to string for SQL Server compatibility

  @Column({ nullable: true, length: 100 })
  department?: string;

  // destination moved to vehicle_movements

  @Column({ nullable: true, length: 100 })
  assignedDriver?: string;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  currentMileage?: number;

  @Column({ nullable: true, type: 'text' })
  notes?: string;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}