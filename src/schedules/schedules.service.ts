import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Schedule } from '../entities/schedule.entity';
import { CreateScheduleDto, UpdateScheduleDto } from '../dtos/schedule.dto';
import { User } from '../entities/user.entity';
import { Course } from '../entities/course.entity';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(Schedule)
    private schedulesRepository: Repository<Schedule>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Course)
    private coursesRepository: Repository<Course>,
  ) {}

  async create(createScheduleDto: CreateScheduleDto): Promise<Schedule> {
    // Validate required fields
    if (!createScheduleDto.courseTitle || !createScheduleDto.courseCode || 
        !createScheduleDto.date || !createScheduleDto.time || !createScheduleDto.venue) {
      throw new BadRequestException('Course title, course code, date, time, and venue are required');
    }
    
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(createScheduleDto.date)) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }
    
    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(createScheduleDto.time)) {
      throw new BadRequestException('Invalid time format. Use HH:MM');
    }
    
    // Validate lecturer ID
    if (!createScheduleDto.lecturerId || createScheduleDto.lecturerId <= 0) {
      throw new BadRequestException('Valid lecturer ID is required');
    }
    
    // Get the lecturer
    const lecturer = await this.usersRepository.findOne({
      where: { id: createScheduleDto.lecturerId },
    });
    
    if (!lecturer) {
      throw new NotFoundException(`Lecturer with ID ${createScheduleDto.lecturerId} not found`);
    }
    
    // Check if a schedule already exists for this lecturer at the same time
    const existingSchedule = await this.schedulesRepository.findOne({
      where: {
        lecturer: { id: createScheduleDto.lecturerId },
        date: createScheduleDto.date,
        time: createScheduleDto.time,
      },
    });
    
    if (existingSchedule) {
      throw new ConflictException('A schedule already exists for this lecturer at the same time');
    }
    
    const schedule = new Schedule();
    schedule.courseTitle = createScheduleDto.courseTitle;
    schedule.courseCode = createScheduleDto.courseCode;
    schedule.date = createScheduleDto.date;
    schedule.time = createScheduleDto.time;
    schedule.venue = createScheduleDto.venue;
    schedule.lecturer = lecturer;
    
    // If course ID is provided, link the schedule to the course
    if (createScheduleDto.courseId) {
      const course = await this.coursesRepository.findOne({
        where: { id: createScheduleDto.courseId },
      });
      
      if (course) {
        schedule.course = course;
      }
    }
    
    try {
      return await this.schedulesRepository.save(schedule);
    } catch (error) {
      throw new BadRequestException('Failed to create schedule: ' + error.message);
    }
  }

  async findAll(): Promise<Schedule[]> {
    try {
      return await this.schedulesRepository.find({ relations: ['lecturer', 'course'] });
    } catch (error) {
      throw new BadRequestException('Failed to fetch schedules: ' + error.message);
    }
  }

  async findOne(id: number): Promise<Schedule> {
    if (!id || id <= 0) {
      throw new BadRequestException('Invalid schedule ID');
    }
    
    try {
      const schedule = await this.schedulesRepository.findOne({
        where: { id },
        relations: ['lecturer', 'course'],
      });
      
      if (!schedule) {
        throw new NotFoundException(`Schedule with ID ${id} not found`);
      }
      
      return schedule;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch schedule: ' + error.message);
    }
  }

  async update(id: number, updateScheduleDto: UpdateScheduleDto): Promise<Schedule> {
    if (!id || id <= 0) {
      throw new BadRequestException('Invalid schedule ID');
    }
    
    // Validate time format if provided
    if (updateScheduleDto.time) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(updateScheduleDto.time)) {
        throw new BadRequestException('Invalid time format. Use HH:MM');
      }
    }
    
    // Validate date format if provided
    if (updateScheduleDto.date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(updateScheduleDto.date)) {
        throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
      }
    }
    
    try {
      const schedule = await this.findOne(id);
      
      Object.assign(schedule, updateScheduleDto);
      
      // If course ID is provided, link the schedule to the course
      if (updateScheduleDto.courseId !== undefined) {
        if (updateScheduleDto.courseId === null) {
          // Remove course association by setting it to undefined
          schedule.course = undefined as any;
        } else if (updateScheduleDto.courseId > 0) {
          // Link to new course
          const course = await this.coursesRepository.findOne({
            where: { id: updateScheduleDto.courseId },
          });
          
          if (course) {
            schedule.course = course;
          }
        }
      }
      
      return await this.schedulesRepository.save(schedule);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to update schedule: ' + error.message);
    }
  }

  async remove(id: number): Promise<void> {
    if (!id || id <= 0) {
      throw new BadRequestException('Invalid schedule ID');
    }
    
    try {
      const result = await this.schedulesRepository.delete(id);
      if (result.affected === 0) {
        throw new NotFoundException(`Schedule with ID ${id} not found`);
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete schedule: ' + error.message);
    }
  }

  async findByLecturer(lecturerId: number): Promise<Schedule[]> {
    if (!lecturerId || lecturerId <= 0) {
      throw new BadRequestException('Invalid lecturer ID');
    }
    
    try {
      return await this.schedulesRepository.find({
        where: { lecturer: { id: lecturerId } },
        relations: ['lecturer', 'course'],
      });
    } catch (error) {
      throw new BadRequestException('Failed to fetch schedules: ' + error.message);
    }
  }
}