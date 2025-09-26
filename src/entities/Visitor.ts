import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
} from 'typeorm';
import { VisitorStatus, VisitPurpose } from '../types';
import { User } from './User';

@Entity('visitors')
@Index(['idNumber'], { unique: true })
@Index(['phone'])
@Index(['status'])
@Index(['expectedDate'])
@Index(['hostEmployee'])
@Index(['hostDepartment'])
export class Visitor {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 50 })
  firstName!: string;

  @Column({ length: 50 })
  lastName!: string;

  @Column({ nullable: true, length: 100 })
  email?: string;

  @Column({ length: 20 })
  phone!: string;

  @Column({ unique: true, length: 50 })
  idNumber!: string;

  @Column({ nullable: true, length: 100 })
  company?: string;

  @Column({ nullable: true, length: 20 })
  vehicleNumber?: string;

  @Column({ nullable: true })
  photo?: string;

  @Column({ nullable: true })
  qrCode?: string;

  @Column({ length: 100 })
  hostEmployee!: string;

  @Column({ length: 100 })
  hostDepartment!: string;

  @Column({
    type: 'varchar',
    enum: VisitPurpose,
  })
  visitPurpose!: VisitPurpose;

  @Column({ type: 'date' })
  expectedDate!: Date;

  @Column({ length: 5 }) // HH:MM format
  expectedTime!: string;

  @Column({ nullable: true })
  actualCheckIn?: Date;

  @Column({ nullable: true })
  actualCheckOut?: Date;

  @Column({
    type: 'varchar',
    enum: VisitorStatus,
    default: VisitorStatus.PENDING,
  })
  status!: VisitorStatus;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approvedById' })
  approvedBy?: User;

  @Column({ nullable: true })
  approvedById?: string;

  @Column({ nullable: true, length: 500 })
  rejectionReason?: string;

  @Column({ nullable: true, length: 500 })
  notes?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Virtual properties
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  get visitDuration(): string | null {
    if (!this.actualCheckIn || !this.actualCheckOut) return null;
    
    const duration = this.actualCheckOut.getTime() - this.actualCheckIn.getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  }

  @BeforeInsert()
  generateQRCode(): void {
    if (!this.qrCode && this.status === VisitorStatus.APPROVED) {
      this.qrCode = `VISITOR:${this.id}:${this.idNumber}:${Date.now()}`;
    }
  }

  // Instance methods
  approve(approvedById: string): void {
    this.status = VisitorStatus.APPROVED;
    this.approvedById = approvedById;
    delete this.rejectionReason;
    this.generateQRCode();
  }

  reject(reason: string): void {
    this.status = VisitorStatus.REJECTED;
    this.rejectionReason = reason;
    delete this.approvedById;
  }

  checkIn(): void {
    this.status = VisitorStatus.CHECKED_IN;
    this.actualCheckIn = new Date();
  }

  checkOut(): void {
    this.status = VisitorStatus.CHECKED_OUT;
    this.actualCheckOut = new Date();
  }

  isExpired(): boolean {
    if (this.status === VisitorStatus.CHECKED_OUT) return false;
    
    const now = new Date();
    const visitDate = new Date(this.expectedDate);
    visitDate.setHours(23, 59, 59, 999);
    
    return now > visitDate;
  }
}