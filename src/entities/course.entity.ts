import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Enrollment } from './enrollment.entity';

@Entity('course')
export class Course extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'course_title', length: 100 })
  title: string;

  @Column({ name: 'course_code', unique: true, length: 20 })
  code: string;

  @OneToMany(() => Enrollment, (enrollment) => enrollment.course)
  enrollments: Enrollment[];
}