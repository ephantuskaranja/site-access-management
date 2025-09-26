import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { AccessAction } from '../types';
import { User } from './User';
import { Visitor } from './Visitor';

@Entity('access_logs')
@Index(['timestamp'])
@Index(['visitorId', 'timestamp'])
@Index(['guardId', 'timestamp'])
@Index(['action', 'timestamp'])
@Index(['location', 'timestamp'])
export class AccessLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Visitor, { nullable: true })
  @JoinColumn({ name: 'visitorId' })
  visitor?: Visitor;

  @Column({ nullable: true })
  visitorId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'employeeId' })
  employee?: User;

  @Column({ nullable: true })
  employeeId?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'guardId' })
  guard!: User;

  @Column()
  guardId!: string;

  @Column({
    type: 'varchar',
    enum: AccessAction,
  })
  action!: AccessAction;

  @Column({ length: 100, default: 'Main Gate' })
  location!: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  timestamp!: Date;

  @Column({ nullable: true, length: 500 })
  notes?: string;

  @Column({ nullable: true, length: 45 })
  ipAddress?: string;

  @Column({ nullable: true, length: 500 })
  userAgent?: string;

  @CreateDateColumn()
  createdAt!: Date;
}