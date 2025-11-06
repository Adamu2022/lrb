import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from '../dtos/enrollment.dto';
import { Enrollment } from '../entities/enrollment.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('enrollments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  @Roles('super_admin', 'lecturer', 'student')
  create(@Body() createEnrollmentDto: CreateEnrollmentDto): Promise<Enrollment> {
    return this.enrollmentsService.create(createEnrollmentDto);
  }

  @Get()
  @Roles('super_admin', 'lecturer')
  findAll(): Promise<Enrollment[]> {
    return this.enrollmentsService.findAll();
  }

  @Get(':id')
  @Roles('super_admin', 'lecturer', 'student')
  findOne(@Param('id') id: string): Promise<Enrollment> {
    return this.enrollmentsService.findOne(+id);
  }

  @Get('student/:studentId')
  @Roles('super_admin', 'lecturer', 'student')
  findByStudent(@Param('studentId') studentId: string): Promise<Enrollment[]> {
    return this.enrollmentsService.findByStudent(+studentId);
  }

  @Get('course/:courseId')
  @Roles('super_admin', 'lecturer', 'student')
  findByCourse(@Param('courseId') courseId: string): Promise<Enrollment[]> {
    return this.enrollmentsService.findByCourse(+courseId);
  }

  @Delete(':id')
  @Roles('super_admin', 'lecturer')
  remove(@Param('id') id: string): Promise<void> {
    return this.enrollmentsService.remove(+id);
  }
}