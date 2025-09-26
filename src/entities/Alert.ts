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
import { AlertType, AlertSeverity } from '../types';
import { User } from './User';

@Entity('alerts')
@Index(['userId', 'createdAt'])
@Index(['type', 'createdAt'])
@Index(['severity', 'createdAt'])
@Index(['isRead', 'createdAt'])
@Index(['actionRequired', 'createdAt'])
export class Alert {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'varchar',
    enum: AlertType,
  })
  type!: AlertType;

  @Column({
    type: 'varchar',
    enum: AlertSeverity,
  })
  severity!: AlertSeverity;

  @Column({ length: 200 })
  title!: string;

  @Column({ length: 1000 })
  message!: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ nullable: true })
  userId?: string;

  @Column({ default: false })
  isRead!: boolean;

  @Column({ default: false })
  actionRequired!: boolean;

  @Column({ type: 'text', nullable: true })
  metadata?: string; // JSON string for flexible data

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Instance methods
  markAsRead(): void {
    this.isRead = true;
  }

  markAsUnread(): void {
    this.isRead = false;
  }

  // Getter for parsed metadata
  get parsedMetadata(): any {
    if (!this.metadata) return null;
    try {
      return JSON.parse(this.metadata);
    } catch {
      return null;
    }
  }

  // Setter for metadata
  setMetadata(data: any): void {
    if (data) {
      this.metadata = JSON.stringify(data);
    } else {
      delete this.metadata;
    }
  }
}