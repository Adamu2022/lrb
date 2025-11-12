import { Injectable, Logger } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ReminderLog } from '../entities/reminder-log.entity';
import { Reminder } from '../entities/reminder.entity';
import { User } from '../entities/user.entity';
import { Schedule } from '../entities/schedule.entity';

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    @InjectRepository(ReminderLog)
    private readonly reminderLogRepo: Repository<ReminderLog>,
    @InjectRepository(Reminder)
    private readonly reminderRepo: Repository<Reminder>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Schedule)
    private readonly scheduleRepo: Repository<Schedule>,
  ) {}

  /**
   * Sends a reminder to a student for a lecture and records it in ReminderLog
   */
  async remindStudent(
    student: any,
    lecture: any,
    reminderType = 'lecture_30min',
  ) {
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

      this.logger.log(
        `📩 Reminder sent to ${student.name} for "${lecture.title}"`,
      );
    } catch (error: any) {
      this.logger.error(
        `❌ Failed to send reminder to ${student.name}: ${error?.message ?? error}`,
      );
    }
  }

  /**
   * Check whether a reminder of this type was already sent for that lecture & student
   */
  async alreadySent(
    lectureId: number,
    studentId: number,
    reminderType = 'lecture_30min',
  ) {
    const count = await this.reminderLogRepo.count({
      where: { lectureId, studentId, reminderType },
    });
    return count > 0;
  }

  // Add missing methods that the controller expects
  async create(createReminderDto: any): Promise<any> {
    // First, get the related entities
    const user = await this.userRepo.findOne({
      where: { id: createReminderDto.userId },
    });
    const schedule = await this.scheduleRepo.findOne({
      where: { id: createReminderDto.scheduleId },
    });

    if (!user || !schedule) {
      throw new Error('User or Schedule not found');
    }

    const reminder = this.reminderRepo.create({
      ...createReminderDto,
      user,
      schedule,
      status: 'pending',
    });

    return this.reminderRepo.save(reminder);
  }

  async findAll() {
    return this.reminderRepo.find();
  }

  async findOne(id: number) {
    return this.reminderRepo.findOne({ where: { id } });
  }

  async update(id: number, updateReminderDto: any): Promise<Reminder | null> {
    await this.reminderRepo.update(id, updateReminderDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<Reminder | null> {
    const reminder = await this.findOne(id);
    if (reminder) {
      await this.reminderRepo.remove(reminder);
      return reminder;
    }
    return null;
  }

  async findByUser(userId: number) {
    return this.reminderRepo.find({ where: { user: { id: userId } } });
  }

  async findBySchedule(scheduleId: number) {
    return this.reminderRepo.find({ where: { schedule: { id: scheduleId } } });
  }
}
