import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum DriverStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('drivers')
@Index(['name'])
@Index(['status'])
@Index(['passCode'])
export class Driver {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({
    length: 20,
    default: DriverStatus.ACTIVE,
  })
  status!: string; // string for SQL Server compatibility

  @Column({ length: 4 })
  passCode!: string; // 4-digit verification code

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
