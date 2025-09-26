import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
} from 'typeorm';
import { User } from './User';

@Entity('company_settings')
export class CompanySettings {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 100 })
  companyName!: string;

  @Column({ length: 500 })
  address!: string;

  @Column({ length: 20 })
  phone!: string;

  @Column({ length: 100 })
  email!: string;

  @Column({ nullable: true })
  logo?: string;

  @Column({ type: 'ntext' })
  workingHours!: string; // JSON string for working hours

  @Column({ default: 480 }) // 8 hours in minutes
  maxVisitorDuration!: number;

  @Column({ default: true })
  requirePreApproval!: boolean;

  @Column({ default: false })
  allowMultipleEntries!: boolean;

  @Column({ default: true })
  enableQRCode!: boolean;

  @Column({ default: true })
  enableEmailNotifications!: boolean;

  @Column({ length: 20 })
  emergencyContact!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'updatedById' })
  updatedBy!: User;

  @Column()
  updatedById!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Helper methods for working hours
  getWorkingHours(): { start: string; end: string } {
    try {
      return JSON.parse(this.workingHours);
    } catch {
      return { start: '08:00', end: '18:00' };
    }
  }

  setWorkingHours(hours: { start: string; end: string }): void {
    this.workingHours = JSON.stringify(hours);
  }

  // Validation before insert
  @BeforeInsert()
  validateWorkingHours(): void {
    const hours = this.getWorkingHours();
    const startTime = hours.start.split(':');
    const endTime = hours.end.split(':');
    
    const startMinutes = parseInt(startTime[0]) * 60 + parseInt(startTime[1]);
    const endMinutes = parseInt(endTime[0]) * 60 + parseInt(endTime[1]);
    
    if (startMinutes >= endMinutes) {
      throw new Error('Working hours end time must be after start time');
    }
  }

  // Instance methods
  updateSettings(updates: Partial<CompanySettings>, userId: string): void {
    Object.assign(this, updates);
    this.updatedById = userId;
  }

  getPublicSettings(): any {
    return {
      companyName: this.companyName,
      address: this.address,
      phone: this.phone,
      email: this.email,
      logo: this.logo,
      workingHours: this.getWorkingHours(),
      requirePreApproval: this.requirePreApproval,
      enableQRCode: this.enableQRCode,
    };
  }

  isWithinWorkingHours(checkTime?: Date): boolean {
    const now = checkTime || new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const hours = this.getWorkingHours();
    
    return currentTime >= hours.start && currentTime <= hours.end;
  }
}