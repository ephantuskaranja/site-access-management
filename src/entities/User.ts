import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  Index,
} from 'typeorm';
import bcrypt from 'bcryptjs';
import { UserRole, UserStatus } from '../types';

@Entity('users')
@Index(['email'])
@Index(['employeeId'])
@Index(['role', 'status'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 50 })
  firstName!: string;

  @Column({ length: 50 })
  lastName!: string;

  @Column({ unique: true, length: 100 })
  email!: string;

  @Column({ length: 20 })
  phone!: string;

  @Column({
    type: 'varchar',
    enum: UserRole,
    default: UserRole.VISITOR,
  })
  role!: UserRole;

  @Column({
    type: 'varchar',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status!: UserStatus;

  @Column({ nullable: true, select: false })
  password?: string;

  @Column({ unique: true, nullable: true, length: 50 })
  employeeId?: string;

  @Column({ nullable: true, length: 100 })
  department?: string;

  @Column({ nullable: true })
  profileImage?: string;

  @Column({ default: 0 })
  loginAttempts!: number;

  @Column({ nullable: true })
  lockUntil?: Date;

  @Column({ nullable: true })
  lastLogin?: Date;

  @Column({ default: false })
  requirePasswordChange!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Virtual property for full name
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  // Hash password before saving
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    if (this.password) {
      // Only hash if the password is not already hashed
      const isAlreadyHashed = this.password.startsWith('$2a$') || this.password.startsWith('$2b$');
      if (!isAlreadyHashed) {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
      }
    }
  }

  // Instance methods
  async isPasswordCorrect(candidatePassword: string): Promise<boolean> {
    if (!this.password) return false;
    return await bcrypt.compare(candidatePassword, this.password);
  }

  isLocked(): boolean {
    return !!(this.lockUntil && this.lockUntil > new Date());
  }

  toJSON(): any {
    const { password, loginAttempts, lockUntil, ...result } = this;
    return result;
  }
}