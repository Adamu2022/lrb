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
      .andWhere('schedule.time >= :startTime', {
        startTime: now.toTimeString().substring(0, 5),
      })
      .andWhere('schedule.time <= :endTime', {
        endTime: oneHourFromNow.toTimeString().substring(0, 5),
      })
      .getMany();

    for (const schedule of schedules) {
      // Send reminder to the lecturer
      const lecturer = schedule.lecturer;

      // Prepare message content
      const message = `Hello ${lecturer.firstName},

This is a reminder for your lecture:
Course: ${schedule.course?.title || 'Unknown Course'} (${schedule.course?.code || 'Unknown Code'})
Date: ${schedule.date}
Time: ${schedule.time}
Venue: ${schedule.venue}

Best regards,
Lecture Reminder System`;
      const subject = `Lecture Reminder: ${schedule.course?.title || 'Unknown Course'}`;

      // Send notifications to lecturer
      await this.notificationsService.sendReminder(
        {
          email: lecturer.email,
          phoneNumber: lecturer.phone,
        },
        subject,
        message,
      );

      // Find enrolled students for this course
      let students: User[] = [];
      if (schedule.course) {
        const enrollments = await this.enrollmentsRepository.find({
          where: { course: { id: schedule.course.id } },
          relations: ['student'],
        });
        students = enrollments.map((enrollment) => enrollment.student);
      }

      // Send reminders to students
      for (const student of students) {
        // Prepare message content for students
        const studentMessage = `Hello ${student.firstName},

This is a reminder for your upcoming lecture:
Course: ${schedule.course?.title || 'Unknown Course'} (${schedule.course?.code || 'Unknown Code'})
Date: ${schedule.date}
Time: ${schedule.time}
Venue: ${schedule.venue}

Best regards,
Lecture Reminder System`;
        const studentSubject = `Lecture Reminder: ${schedule.course?.title || 'Unknown Course'}`;

        // Send notifications to student
        await this.notificationsService.sendReminder(
          {
            email: student.email,
            phoneNumber: student.phone,
          },
          studentSubject,
          studentMessage,
        );
      }
    }
  }

  private getEnabledChannels(user: User): string[] {
    // Always include SMS channel by default, regardless of user preferences
    const channels: string[] = ['sms'];
    
    const preferences = user.notificationPreferences || {
      emailEnabled: true,
      smsEnabled: true,
      pushEnabled: true,
      calendarEnabled: true,
    };

    if (preferences.emailEnabled) channels.push('email');
    if (preferences.pushEnabled) channels.push('push');
    if (preferences.calendarEnabled) channels.push('calendar');

    return channels;
  }
}