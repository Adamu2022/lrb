import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { RemindersService } from './reminders.service';
import { CreateReminderDto, UpdateReminderDto } from '../dtos/reminder.dto';
import { Reminder } from '../entities/reminder.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('reminders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Post()
  @Roles('super_admin')
  create(@Body() createReminderDto: CreateReminderDto): Promise<Reminder> {
    return this.remindersService.create(createReminderDto);
  }

  @Get()
  @Roles('super_admin')
  findAll(): Promise<Reminder[]> {
    return this.remindersService.findAll();
  }

  @Get(':id')
  @Roles('super_admin', 'lecturer', 'student')
  findOne(@Param('id') id: string): Promise<Reminder> {
    return this.remindersService.findOne(+id);
  }

  @Put(':id')
  @Roles('super_admin')
  update(
    @Param('id') id: string,
    @Body() updateReminderDto: UpdateReminderDto,
  ): Promise<Reminder> {
    return this.remindersService.update(+id, updateReminderDto);
  }

  @Delete(':id')
  @Roles('super_admin')
  remove(@Param('id') id: string): Promise<void> {
    return this.remindersService.remove(+id);
  }

  @Get('user/:userId')
  @Roles('super_admin', 'lecturer', 'student')
  findByUser(@Param('userId') userId: string): Promise<Reminder[]> {
    return this.remindersService.findByUser(+userId);
  }

  @Get('schedule/:scheduleId')
  @Roles('super_admin', 'lecturer', 'student')
  findBySchedule(@Param('scheduleId') scheduleId: string): Promise<Reminder[]> {
    return this.remindersService.findBySchedule(+scheduleId);
  }
}