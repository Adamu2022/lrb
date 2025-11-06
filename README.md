# Lecture Reminder System - Backend

This is the backend API for the Lecture Reminder System built with NestJS, PostgreSQL, and TypeORM.

## Features

- User management (Super Admin, Lecturer, Student)
- Course management
- Lecture schedule management
- Enrollment system
- Automated reminder system (Email, SMS, Push Notification, Google Calendar)
- Role-based access control
- JWT authentication

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL
- npm or yarn

## Installation

```bash
# Install dependencies
npm install

# Set up environment variables
# Copy .env.example to .env and update the values
```

## Database Setup

1. Create a PostgreSQL database
2. Update the database configuration in the .env file
3. Run the application (TypeORM will automatically create the tables)

## Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## API Endpoints

### Authentication
- POST /api/auth/login - User login

### Users
- POST /api/users - Create a user (Super Admin only)
- GET /api/users - Get all users
- GET /api/users/:id - Get a user by ID
- DELETE /api/users/:id - Delete a user (Super Admin only)

### Courses
- POST /api/courses - Create a course (Super Admin only)
- GET /api/courses - Get all courses
- GET /api/courses/:id - Get a course by ID
- GET /api/courses/code/:code - Get a course by code
- PUT /api/courses/:id - Update a course (Super Admin only)
- DELETE /api/courses/:id - Delete a course (Super Admin only)

### Schedules
- POST /api/schedules - Create a schedule (Lecturer only)
- GET /api/schedules - Get all schedules
- GET /api/schedules/:id - Get a schedule by ID
- PUT /api/schedules/:id - Update a schedule (Lecturer only)
- DELETE /api/schedules/:id - Delete a schedule (Lecturer only)
- GET /api/schedules/lecturer/:lecturerId - Get schedules by lecturer

### Enrollments
- POST /api/enrollments - Create an enrollment (Super Admin, Student)
- GET /api/enrollments - Get all enrollments (Super Admin only)
- GET /api/enrollments/:id - Get an enrollment by ID
- GET /api/enrollments/student/:studentId - Get enrollments by student
- GET /api/enrollments/course/:courseId - Get enrollments by course
- DELETE /api/enrollments/:id - Delete an enrollment (Super Admin only)

### Reminders
- POST /api/reminders - Create a reminder (Super Admin only)
- GET /api/reminders - Get all reminders (Super Admin only)
- GET /api/reminders/:id - Get a reminder by ID
- PUT /api/reminders/:id - Update a reminder (Super Admin only)
- DELETE /api/reminders/:id - Delete a reminder (Super Admin only)
- GET /api/reminders/user/:userId - Get reminders by user
- GET /api/reminders/schedule/:scheduleId - Get reminders by schedule

## Role-Based Access Control

- **Super Admin**: Full access to all features
- **Lecturer**: Can create, update, and delete schedules; view schedules and reminders
- **Student**: Can view schedules and reminders

## Automated Reminders

The system automatically sends reminders 1 hour before lectures via:
- Email
- SMS
- Push Notification
- Google Calendar

## Environment Variables

```
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=lecture_reminder

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=3600s

# Email Configuration
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your_email@example.com
EMAIL_PASSWORD=your_email_password

# SMS Configuration
SMS_API_KEY=your_sms_api_key

# Google Calendar Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URL=http://localhost:3000/auth/google/callback
```

## License

This project is licensed under the MIT License.