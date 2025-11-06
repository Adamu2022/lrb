import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enrollment } from '../entities/enrollment.entity';
import { CreateEnrollmentDto } from '../dtos/enrollment.dto';
import { User } from '../entities/user.entity';
import { Course } from '../entities/course.entity';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(Enrollment)
    private enrollmentsRepository: Repository<Enrollment>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Course)
    private coursesRepository: Repository<Course>,
  ) {}

  async create(createEnrollmentDto: CreateEnrollmentDto): Promise<Enrollment> {
    const enrollment = new Enrollment();
    
    // Get the student
    const student = await this.usersRepository.findOne({
      where: { id: createEnrollmentDto.studentId, role: 'student' },
    });
    
    if (!student) {
      throw new NotFoundException(`Student with ID ${createEnrollmentDto.studentId} not found`);
    }
    
    // Get the course
    const course = await this.coursesRepository.findOne({
      where: { id: createEnrollmentDto.courseId },
    });
    
    if (!course) {
      throw new NotFoundException(`Course with ID ${createEnrollmentDto.courseId} not found`);
    }
    
    enrollment.student = student;
    enrollment.course = course;
    
    return this.enrollmentsRepository.save(enrollment);
  }

  async findAll(): Promise<Enrollment[]> {
    return this.enrollmentsRepository.find({ relations: ['student', 'course'] });
  }

  async findOne(id: number): Promise<Enrollment> {
    const enrollment = await this.enrollmentsRepository.findOne({
      where: { id },
      relations: ['student', 'course'],
    });
    
    if (!enrollment) {
      throw new NotFoundException(`Enrollment with ID ${id} not found`);
    }
    
    return enrollment;
  }

  async findByStudent(studentId: number): Promise<Enrollment[]> {
    return this.enrollmentsRepository.find({
      where: { student: { id: studentId } },
      relations: ['student', 'course'],
    });
  }

  async findByCourse(courseId: number): Promise<Enrollment[]> {
    return this.enrollmentsRepository.find({
      where: { course: { id: courseId } },
      relations: ['student', 'course'],
    });
  }

  async remove(id: number): Promise<void> {
    await this.enrollmentsRepository.delete(id);
  }
}