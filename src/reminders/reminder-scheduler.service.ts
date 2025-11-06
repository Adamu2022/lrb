import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Schedule } from '../entities/schedule.entity';
import { Reminder } from '../entities/reminder.entity';
import { User } from '../entities/user.entity';
import { Enrollment } from '../entities/enrollment.entity';
import { NotificationsService } from './notifications.service';

@Injectable()
export class ReminderSchedulerService {
  private readonly logger = new Logger(ReminderSchedulerService.name);

  constructor(
    @InjectRepository(Schedule)
    private schedulesRepository: Repository<Schedule>,
    @InjectRepository(Reminder)
    private remindersRepository: Repository<Reminder>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Enrollment)
    private enrollmentsRepository: Repository<Enrollment>,
    private notificationsService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    this.logger.debug('Checking for upcoming lectures...');
    
    // Get current time and time 1 hour from now
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    
    // Find schedules that are happening in the next hour
    const schedules = await this.schedulesRepository
      .createQueryBuilder('schedule')
      .leftJoinAndSelect('schedule.lecturer', 'lecturer')
      .leftJoinAndSelect('schedule.course', 'course')
      .where('schedule.date = :date', { date: now.toISOString().split('T')[0] })
      .andWhere('schedule.time >= :startTime', { startTime: now.toTimeString().substring(0, 5) })
      .andWhere('schedule.time <= :endTime', { endTime: oneHourFromNow.toTimeString().substring(0, 5) })
      .getMany();
    
    for (const schedule of schedules) {
      // Send reminder to the lecturer
      const lecturer = schedule.lecturer;
      
      // Prepare payload for notifications
      const payload = {
        userName: lecturer.firstName,
        userEmail: lecturer.email,
        userPhone: lecturer.phone,
        courseTitle: schedule.course?.title || 'Unknown Course',
        courseCode: schedule.course?.code || 'Unknown Code',
        date: schedule.date,
        time: schedule.time,
        venue: schedule.venue,
        instructorName: `${lecturer.firstName} ${lecturer.lastName}`,
        courseId: schedule.course?.id,
        scheduleId: schedule.id,
      };
      
      // Get enabled channels for lecturer
      const lecturerChannels = this.getEnabledChannels(lecturer);
      
      // Send notifications to lecturer
      if (lecturerChannels.length > 0) {
        await this.notificationsService.sendNotification(
          lecturer.id,
          schedule.id,
          lecturerChannels,
          payload
        );
      }
      
      // Find enrolled students for this course
      let students: User[] = [];
      if (schedule.course) {
        const enrollments = await this.enrollmentsRepository.find({
          where: { course: { id: schedule.course.id } },
          relations: ['student'],
        });
        students = enrollments.map(enrollment => enrollment.student);
      }
      
      // Send reminders to students
      for (const student of students) {
        // Prepare payload for student notifications
        const studentPayload = {
          ...payload,
          userName: student.firstName,
          userEmail: student.email,
          userPhone: student.phone,
        };
        
        // Get enabled channels for student
        const studentChannels = this.getEnabledChannels(student);
        
        // Send notifications to student
        if (studentChannels.length > 0) {
          await this.notificationsService.sendNotification(
            student.id,
            schedule.id,
            studentChannels,
            studentPayload
          );
        }
      }
    }
  }

  private getEnabledChannels(user: User): string[] {
    const preferences = user.notificationPreferences || {
      emailEnabled: true,
      smsEnabled: true,
      pushEnabled: true,
      calendarEnabled: true
    };
    
    const channels = [];
    if (preferences.emailEnabled) channels.push('email');
    if (preferences.smsEnabled) channels.push('sms');
    if (preferences.pushEnabled) channels.push('push');
    if (preferences.calendarEnabled) channels.push('calendar');
    
    return channels;
  }
}