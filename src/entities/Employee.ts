import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('employees')
@Index(['email'], { unique: true })
@Index(['employeeId'], { unique: true })
@Index(['department'])
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 20, unique: true })
  employeeId!: string;

  @Column({ length: 50 })
  firstName!: string;

  @Column({ length: 50 })
  lastName!: string;

  @Column({ length: 100, unique: true })
  email!: string;

  @Column({ length: 20, nullable: true })
  phone?: string;

  @Column({ length: 100 })
  department!: string;

  @Column({ length: 100, nullable: true })
  position?: string;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Computed property for full name
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  // Method to get email approval token
  getApprovalToken(): string {
    // Generate a token based on employee ID and email (without timestamp for consistency)
    const crypto = require('crypto');
    return crypto.createHash('sha256')
      .update(`${this.id}-${this.email}-approval-token`)
      .digest('hex');
  }
}