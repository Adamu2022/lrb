import { IsString, IsInt, IsDateString, IsOptional, MinLength } from 'class-validator';

export class CreateScheduleDto {
  @IsString()
  @MinLength(1)
  courseTitle: string;

  @IsString()
  @MinLength(1)
  courseCode: string;

  @IsDateString()
  date: string;

  @IsString()
  time: string;

  @IsString()
  @MinLength(1)
  venue: string;

  @IsInt()
  lecturerId: number;

  @IsInt()
  @IsOptional()
  courseId?: number;
}

export class UpdateScheduleDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  courseTitle?: string;

  @IsString()
  @IsOptional()
  @MinLength(1)
  courseCode?: string;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  time?: string;

  @IsString()
  @IsOptional()
  @MinLength(1)
  venue?: string;

  @IsInt()
  @IsOptional()
  courseId?: number;
}