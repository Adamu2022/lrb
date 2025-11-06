import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { BaseEntity } from './base.entity';

export type NotificationStatus = 'pending' | 'sent' | 'failed';

@Entity('notifications_log')
export class NotificationLog extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'schedule_id', nullable: true })
  scheduleId: number;

  @Column({ type: 'varchar', length: 20 })
  channel: string;

  @Column({ type: 'varchar', length: 20 })
  status: NotificationStatus;

  @Column({ name: 'provider_response', type: 'text', nullable: true })
  providerResponse: string;

  @Column()
  attempts: number;

  @Column({ name: 'last_attempt_at', nullable: true })
  lastAttemptAt: Date;

  @CreateDateColumn({ name: 'created_at' })
declare  createdAt: Date;
}