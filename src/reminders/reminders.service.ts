import { Injectable, Logger } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ReminderLog } from '../entities/reminder-log.entity';

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    @InjectRepository(ReminderLog)
    private readonly reminderLogRepo: Repository<ReminderLog>,
  ) {}

  /**
   * Sends a reminder to a student for a lecture and records it in ReminderLog
   */
  async remindStudent(student: any, lecture: any, reminderType = 'lecture_30min') {
    const message = `Hello ${student.name}, your lecture "${lecture.title}" starts at ${new Date(lecture.startTime).toLocaleString()}. Please be on time.`;
    const subject = `Lecture Reminder: ${lecture.title}`;

    try {
      await this.notificationsService.sendReminder(
        { email: student.email, phoneNumber: student.phone },
        subject,
        message,
      );

      // record that reminder was sent
      const log = this.reminderLogRepo.create({
        lectureId: lecture.id,
        studentId: student.id,
        reminderType,
      });
      await this.reminderLogRepo.save(log);

      this.logger.log(`📩 Reminder sent to ${student.name} for "${lecture.title}"`);
    } catch (error: any) {
      this.logger.error(`❌ Failed to send reminder to ${student.name}: ${error?.message ?? error}`);
    }
  }

  /**
   * Check whether a reminder of this type was already sent for that lecture & student
   */
  async alreadySent(lectureId: number, studentId: number, reminderType = 'lecture_30min') {
    const count = await this.reminderLogRepo.count({
      where: { lectureId, studentId, reminderType },
    });
    return count > 0;
  }
}