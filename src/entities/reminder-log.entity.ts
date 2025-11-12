import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
@Entity()
export class ReminderLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  lectureId: number;

  @Column()
  studentId: number;

  @Column()
  reminderType: string; // e.g. 'lecture_30min'

  @CreateDateColumn()
  sentAt: Date;
}