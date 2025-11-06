import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Schedule } from './schedule.entity';
import { Enrollment } from './enrollment.entity';
import { Reminder } from './reminder.entity';

export type UserRole = 'super_admin' | 'lecturer' | 'student';

// Interface for notification preferences
export interface NotificationPreferences {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  calendarEnabled: boolean;
}

@Entity('user')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'fname', length: 50 })
  firstName: string;

  @Column({ name: 'lname', length: 50 })
  lastName: string;

  @Column({ unique: true, length: 100 })
  email: string;

  @Column({ nullable: true, length: 20 })
  phone: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: ['super_admin', 'lecturer', 'student'],
  })
  role: UserRole;

  // Notification preferences field
  @Column({ type: 'jsonb', nullable: true })
  notificationPreferences: NotificationPreferences;

  @OneToMany(() => Schedule, (schedule) => schedule.lecturer)
  schedules: Schedule[];

  @OneToMany(() => Enrollment, (enrollment) => enrollment.student)
  enrollments: Enrollment[];

  @OneToMany(() => Reminder, (reminder) => reminder.user)
  reminders: Reminder[];
}