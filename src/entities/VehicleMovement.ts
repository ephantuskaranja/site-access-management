import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Vehicle } from './Vehicle';
import { User } from './User';

export enum MovementType {
  ENTRY = 'entry',
  EXIT = 'exit'
}

export enum MovementStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

@Entity('vehicle_movements')
@Index(['vehicleId'])
@Index(['movementType'])
@Index(['status'])
@Index(['recordedAt'])
@Index(['recordedById'])
@Index(['area'])
export class VehicleMovement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  vehicleId!: string;

  @Column({ length: 100 })
  area!: string; // e.g., 'North site', 'South site', 'Main site'

  @Column({
    length: 20
  })
  movementType!: string; // Changed to string for SQL Server compatibility

  @Column({
    length: 20,
    default: MovementStatus.COMPLETED
  })
  status!: string; // Changed to string for SQL Server compatibility

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  mileage!: number;

  @Column({ length: 100 })
  driverName!: string;

  @Column({ nullable: true, length: 20 })
  driverPhone?: string;

  @Column({ nullable: true, length: 100 })
  driverLicense?: string;

  @Column({ nullable: true, type: 'text' })
  purpose?: string;

  @Column({ nullable: true, type: 'text' })
  notes?: string;

  @Column({ type: 'nvarchar', nullable: true, length: 100 })
  destination!: string | null;

  @Column({ type: 'uuid' })
  recordedById!: string;

  @Column({ type: 'datetime' })
  recordedAt!: Date;

  @ManyToOne(() => Vehicle, { eager: true })
  @JoinColumn({ name: 'vehicleId' })
  vehicle!: Vehicle;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'recordedById' })
  recordedBy!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}