import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Reminder } from './reminder.entity';
import { Course } from './course.entity';

@Entity('schedule')
export class Schedule extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'course_title', length: 100 })
  courseTitle: string;

  @Column({ name: 'course_code', length: 20 })
  courseCode: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'time' })
  time: string;

  @Column({ length: 100 })
  venue: string;

  @ManyToOne(() => User, (user) => user.schedules)
  lecturer: User;

  @ManyToOne(() => Course, { nullable: true })
  course: Course;

  @OneToMany(() => Reminder, (reminder) => reminder.schedule)
  reminders: Reminder[];
}