import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reminder } from '../entities/reminder.entity';
import { CreateReminderDto, UpdateReminderDto } from '../dtos/reminder.dto';
import { Schedule } from '../entities/schedule.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class RemindersService {
  constructor(
    @InjectRepository(Reminder)
    private remindersRepository: Repository<Reminder>,
    @InjectRepository(Schedule)
    private schedulesRepository: Repository<Schedule>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createReminderDto: CreateReminderDto): Promise<Reminder> {
    const reminder = new Reminder();
    reminder.channel = createReminderDto.channel;
    reminder.status = 'pending';
    
    // Get the schedule
    const schedule = await this.schedulesRepository.findOne({
      where: { id: createReminderDto.scheduleId },
    });
    
    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${createReminderDto.scheduleId} not found`);
    }
    
    // Get the user
    const user = await this.usersRepository.findOne({
      where: { id: createReminderDto.userId },
    });
    
    if (!user) {
      throw new NotFoundException(`User with ID ${createReminderDto.userId} not found`);
    }
    
    reminder.schedule = schedule;
    reminder.user = user;
    
    return this.remindersRepository.save(reminder);
  }

  async findAll(): Promise<Reminder[]> {
    return this.remindersRepository.find({ relations: ['schedule', 'user'] });
  }

  async findOne(id: number): Promise<Reminder> {
    const reminder = await this.remindersRepository.findOne({
      where: { id },
      relations: ['schedule', 'user'],
    });
    
    if (!reminder) {
      throw new NotFoundException(`Reminder with ID ${id} not found`);
    }
    
    return reminder;
  }

  async update(id: number, updateReminderDto: UpdateReminderDto): Promise<Reminder> {
    const reminder = await this.findOne(id);
    Object.assign(reminder, updateReminderDto);
    return this.remindersRepository.save(reminder);
  }

  async remove(id: number): Promise<void> {
    await this.remindersRepository.delete(id);
  }

  async findByUser(userId: number): Promise<Reminder[]> {
    return this.remindersRepository.find({
      where: { user: { id: userId } },
      relations: ['schedule', 'user'],
    });
  }

  async findBySchedule(scheduleId: number): Promise<Reminder[]> {
    return this.remindersRepository.find({
      where: { schedule: { id: scheduleId } },
      relations: ['schedule', 'user'],
    });
  }
}