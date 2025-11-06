import { IsInt } from 'class-validator';

export class CreateEnrollmentDto {
  @IsInt()
  studentId: number;

  @IsInt()
  courseId: number;
}