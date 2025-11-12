import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
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

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleLectureReminders() {
    this.logger.log('⏰ Checking for upcoming lectures to remind students...');

    const now = new Date();
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);

    try {
      const upcomingLectures = await this.schedulesRepository
        .createQueryBuilder('schedule')
        .leftJoinAndSelect('schedule.lecturer', 'lecturer')
        .leftJoinAndSelect('schedule.course', 'course')
        .where('schedule.date = :date', {
          date: now.toISOString().split('T')[0],
        })
        .andWhere('schedule.time >= :startTime', {
          startTime: now.toTimeString().substring(0, 5),
        })
        .andWhere('schedule.time <= :endTime', {
          endTime: thirtyMinutesFromNow.toTimeString().substring(0, 5),
        })
        .getMany();

      if (!upcomingLectures || upcomingLectures.length === 0) {
        this.logger.log('ℹ️ No upcoming lectures found.');
        return;
      }

      for (const schedule of upcomingLectures) {
        // Send reminder to the lecturer
        const lecturer = schedule.lecturer;

        if (lecturer) {
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
        }

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

      this.logger.log('✅ Lecture reminder check complete.');
    } catch (error: any) {
      this.logger.error(
        `❌ Error checking for lecture reminders: ${error?.message ?? error}`,
      );
    }
  }
}
