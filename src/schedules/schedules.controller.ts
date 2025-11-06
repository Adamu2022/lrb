import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto, UpdateScheduleDto } from '../dtos/schedule.dto';
import { Schedule } from '../entities/schedule.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Schedules')
@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('lecturer')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new schedule (Lecturer only)' })
  @ApiResponse({ status: 201, description: 'Schedule created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'Conflict - Schedule already exists' })
  @ApiBody({ type: CreateScheduleDto })
  create(@Body() createScheduleDto: CreateScheduleDto): Promise<Schedule> {
    return this.schedulesService.create(createScheduleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all schedules (Public)' })
  @ApiResponse({ status: 200, description: 'Schedules retrieved successfully' })
  findAll(): Promise<Schedule[]> {
    return this.schedulesService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'lecturer', 'student')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a schedule by ID' })
  @ApiResponse({ status: 200, description: 'Schedule retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  @ApiParam({ name: 'id', description: 'Schedule ID' })
  findOne(@Param('id') id: string): Promise<Schedule> {
    return this.schedulesService.findOne(+id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('lecturer')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a schedule by ID (Lecturer only)' })
  @ApiResponse({ status: 200, description: 'Schedule updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  @ApiResponse({ status: 409, description: 'Conflict - Schedule already exists' })
  @ApiParam({ name: 'id', description: 'Schedule ID' })
  @ApiBody({ type: UpdateScheduleDto })
  update(
    @Param('id') id: string,
    @Body() updateScheduleDto: UpdateScheduleDto,
  ): Promise<Schedule> {
    return this.schedulesService.update(+id, updateScheduleDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('lecturer')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a schedule by ID (Lecturer only)' })
  @ApiResponse({ status: 200, description: 'Schedule deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  @ApiParam({ name: 'id', description: 'Schedule ID' })
  remove(@Param('id') id: string): Promise<void> {
    return this.schedulesService.remove(+id);
  }

  @Get('lecturer/:lecturerId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'lecturer', 'student')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get schedules by lecturer ID' })
  @ApiResponse({ status: 200, description: 'Schedules retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Lecturer not found' })
  @ApiParam({ name: 'lecturerId', description: 'Lecturer ID' })
  findByLecturer(@Param('lecturerId') lecturerId: string): Promise<Schedule[]> {
    return this.schedulesService.findByLecturer(+lecturerId);
  }
}