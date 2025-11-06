import { Controller, Get, Post, Body, Param, Delete, UseGuards, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from '../dtos/user.dto';
import { User, NotificationPreferences } from '../entities/user.entity';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// DTO for notification preferences
class NotificationPreferencesDto {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  calendarEnabled: boolean;
}

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new user (Super Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiBody({ type: CreateUserDto })
  create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles('super_admin', 'lecturer', 'student')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles('super_admin', 'lecturer', 'student')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'id', description: 'User ID' })
  findOne(@Param('id') id: string): Promise<User> {
    return this.usersService.findOne(+id);
  }

  @Delete(':id')
  @Roles('super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a user by ID (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'id', description: 'User ID' })
  remove(@Param('id') id: string): Promise<void> {
    return this.usersService.remove(+id);
  }

  // Add endpoints for notification preferences
  @Patch(':id/notification-preferences')
  @Roles('super_admin', 'lecturer', 'student')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update notification preferences for a user' })
  @ApiResponse({ status: 200, description: 'Notification preferences updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({ type: NotificationPreferencesDto })
  async updateNotificationPreferences(
    @Param('id') id: string,
    @Body() notificationPreferencesDto: NotificationPreferencesDto,
  ): Promise<User> {
    return this.usersService.updateNotificationPreferences(+id, notificationPreferencesDto);
  }

  @Get(':id/notification-preferences')
  @Roles('super_admin', 'lecturer', 'student')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get notification preferences for a user' })
  @ApiResponse({ status: 200, description: 'Notification preferences retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'id', description: 'User ID' })
  async getNotificationPreferences(@Param('id') id: string): Promise<NotificationPreferences> {
    return this.usersService.getNotificationPreferences(+id);
  }
}