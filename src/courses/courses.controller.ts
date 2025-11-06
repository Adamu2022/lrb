import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from '../dtos/course.dto';
import { Course } from '../entities/course.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @Roles('super_admin', 'lecturer')
  create(@Body() createCourseDto: CreateCourseDto): Promise<Course> {
    return this.coursesService.create(createCourseDto);
  }

  @Get()
  @Roles('super_admin', 'lecturer', 'student')
  findAll(): Promise<Course[]> {
    return this.coursesService.findAll();
  }

  @Get(':id')
  @Roles('super_admin', 'lecturer', 'student')
  findOne(@Param('id') id: string): Promise<Course> {
    return this.coursesService.findOne(+id);
  }

  @Get('code/:code')
  @Roles('super_admin', 'lecturer', 'student')
  findByCode(@Param('code') code: string): Promise<Course> {
    return this.coursesService.findByCode(code);
  }

  @Put(':id')
  @Roles('super_admin', 'lecturer')
  update(
    @Param('id') id: string,
    @Body() updateCourseDto: Partial<CreateCourseDto>,
  ): Promise<Course> {
    return this.coursesService.update(+id, updateCourseDto);
  }

  @Delete(':id')
  @Roles('super_admin', 'lecturer')
  remove(@Param('id') id: string): Promise<void> {
    return this.coursesService.remove(+id);
  }
}