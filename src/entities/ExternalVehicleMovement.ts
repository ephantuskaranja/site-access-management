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
import { User } from './User';
import { MovementStatus } from './VehicleMovement';

@Entity('external_vehicle_movements')
@Index(['vehiclePlate'])
@Index(['movementType'])
@Index(['status'])
@Index(['recordedAt'])
@Index(['recordedById'])
@Index(['area'])
export class ExternalVehicleMovement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'nvarchar', length: 50 })
  vehiclePlate!: string;

  @Column({ type: 'nvarchar', length: 100 })
  area!: string;

  @Column({ type: 'nvarchar', length: 20 })
  movementType!: string; // 'entry' | 'exit'

  @Column({ type: 'nvarchar', length: 20, default: MovementStatus.COMPLETED })
  status!: string;

  @Column({ type: 'nvarchar', length: 100 })
  driverName!: string;

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  destination!: string | null;

  @Column({ type: 'uuid' })
  recordedById!: string;

  @Column({ type: 'datetime' })
  recordedAt!: Date;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'recordedById' })
  recordedBy!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
