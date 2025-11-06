import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Schedule } from './schedule.entity';

export type ReminderChannel = 'sms' | 'email' | 'push' | 'calendar';
export type ReminderStatus = 'pending' | 'sent' | 'failed';

@Entity('reminder')
export class Reminder extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: ['sms', 'email', 'push', 'calendar'],
  })
  channel: ReminderChannel;

  @Column({
    type: 'enum',
    enum: ['pending', 'sent', 'failed'],
  })
  status: ReminderStatus;

  @Column({ name: 'sent_at', nullable: true, type: 'timestamp' })
  sentAt: Date;

  @ManyToOne(() => Schedule, (schedule) => schedule.reminders)
  schedule: Schedule;

  @ManyToOne(() => User, (user) => user.reminders)
  user: User;
}