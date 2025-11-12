import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Schedule } from '../entities/schedule.entity';
import { User } from '../entities/user.entity';
import { Course } from '../entities/course.entity';
import { CreateScheduleDto } from '../dtos/schedule.dto';

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
    const lecturer = await this.usersRepository.findOne({
      where: { id: createScheduleDto.lecturerId },
    });
    if (!lecturer) {
      throw new NotFoundException(`Lecturer with ID ${createScheduleDto.lecturerId} not found`);
    }

    const course = await this.coursesRepository.findOne({
      where: { id: createScheduleDto.courseId },
    });
    
    // Create schedule object with proper structure
    const scheduleData: Partial<Schedule> = {
      ...createScheduleDto,
      lecturer,
      courseTitle: course?.title || createScheduleDto.courseTitle,
      courseCode: course?.code || createScheduleDto.courseCode,
    };

    // Only add course if it exists
    if (course) {
      scheduleData.course = course;
    }

    const schedule = this.schedulesRepository.create(scheduleData);
    return this.schedulesRepository.save(schedule);
  }

  async findAll(): Promise<Schedule[]> {
    return this.schedulesRepository.find({
      relations: ['lecturer', 'course'],
    });
  }

  async findOne(id: number): Promise<Schedule> {
    const schedule = await this.schedulesRepository.findOne({
      where: { id },
      relations: ['lecturer', 'course'],
    });
    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }
    return schedule;
  }

  async update(id: number, updateScheduleDto: Partial<CreateScheduleDto>): Promise<Schedule> {
    const schedule = await this.findOne(id);
    
    if (updateScheduleDto.lecturerId) {
      const lecturer = await this.usersRepository.findOne({
        where: { id: updateScheduleDto.lecturerId },
      });
      if (lecturer) {
        schedule.lecturer = lecturer;
      }
    }

    if (updateScheduleDto.courseId) {
      const course = await this.coursesRepository.findOne({
        where: { id: updateScheduleDto.courseId },
      });
      if (course) {
        schedule.course = course;
        schedule.courseTitle = course.title;
        schedule.courseCode = course.code;
      }
    }

    Object.assign(schedule, updateScheduleDto);
    return this.schedulesRepository.save(schedule);
  }

  async remove(id: number): Promise<void> {
    await this.schedulesRepository.delete(id);
  }

  async findByLecturer(lecturerId: number): Promise<Schedule[]> {
    return this.schedulesRepository.find({
      where: { lecturer: { id: lecturerId } },
      relations: ['lecturer', 'course'],
    });
  }
}