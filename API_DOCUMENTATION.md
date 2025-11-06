# Lecture Reminder System API Documentation

## Overview

This document provides comprehensive documentation for the Lecture Reminder System API. The API is built using NestJS and provides endpoints for user management, lecture scheduling, and reminder notifications.

## Base URL

```
http://localhost:3001/api
```

## Authentication

All API endpoints (except login) require authentication using JWT tokens. To authenticate, include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Login

**POST** `/auth/login`

Authenticate a user and receive a JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Users

### Create User (Super Admin only)

**POST** `/users`

Create a new user account.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "password": "password123",
  "role": "student"
}
```

**Response:**
```json
{
  "id": 1,
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "role": "student",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

### Get All Users

**GET** `/users`

Retrieve a list of all users.

**Response:**
```json
[
  {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "role": "student",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
]
```

### Get User by ID

**GET** `/users/{id}`

Retrieve a specific user by ID.

**Response:**
```json
{
  "id": 1,
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "role": "student",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

### Delete User (Super Admin only)

**DELETE** `/users/{id}`

Delete a user by ID.

**Response:**
```
200 OK
```

## Schedules

### Create Schedule (Lecturer only)

**POST** `/schedules`

Create a new lecture schedule.

**Request Body:**
```json
{
  "courseTitle": "Introduction to Computer Science",
  "courseCode": "CS101",
  "date": "2023-12-01",
  "time": "10:00",
  "venue": "Room 101",
  "lecturerId": 2
}
```

**Response:**
```json
{
  "id": 1,
  "courseTitle": "Introduction to Computer Science",
  "courseCode": "CS101",
  "date": "2023-12-01",
  "time": "10:00",
  "venue": "Room 101",
  "lecturer": {
    "id": 2,
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane.smith@example.com",
    "role": "lecturer"
  },
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

### Get All Schedules

**GET** `/schedules`

Retrieve a list of all schedules.

**Response:**
```json
[
  {
    "id": 1,
    "courseTitle": "Introduction to Computer Science",
    "courseCode": "CS101",
    "date": "2023-12-01",
    "time": "10:00",
    "venue": "Room 101",
    "lecturer": {
      "id": 2,
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane.smith@example.com",
      "role": "lecturer"
    },
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
]
```

### Get Schedule by ID

**GET** `/schedules/{id}`

Retrieve a specific schedule by ID.

**Response:**
```json
{
  "id": 1,
  "courseTitle": "Introduction to Computer Science",
  "courseCode": "CS101",
  "date": "2023-12-01",
  "time": "10:00",
  "venue": "Room 101",
  "lecturer": {
    "id": 2,
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane.smith@example.com",
    "role": "lecturer"
  },
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

### Update Schedule (Lecturer only)

**PUT** `/schedules/{id}`

Update a schedule by ID.

**Request Body:**
```json
{
  "courseTitle": "Introduction to Computer Science",
  "courseCode": "CS101",
  "date": "2023-12-01",
  "time": "11:00",
  "venue": "Room 202"
}
```

**Response:**
```json
{
  "id": 1,
  "courseTitle": "Introduction to Computer Science",
  "courseCode": "CS101",
  "date": "2023-12-01",
  "time": "11:00",
  "venue": "Room 202",
  "lecturer": {
    "id": 2,
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane.smith@example.com",
    "role": "lecturer"
  },
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

### Delete Schedule (Lecturer only)

**DELETE** `/schedules/{id}`

Delete a schedule by ID.

**Response:**
```
200 OK
```

### Get Schedules by Lecturer

**GET** `/schedules/lecturer/{lecturerId}`

Retrieve schedules for a specific lecturer.

**Response:**
```json
[
  {
    "id": 1,
    "courseTitle": "Introduction to Computer Science",
    "courseCode": "CS101",
    "date": "2023-12-01",
    "time": "10:00",
    "venue": "Room 101",
    "lecturer": {
      "id": 2,
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane.smith@example.com",
      "role": "lecturer"
    },
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
]
```

## Roles and Permissions

The system has three user roles with different permissions:

1. **Super Admin**
   - Create user accounts (lecturers and students)
   - Configure system settings
   - Manage all users
   - View all schedules

2. **Lecturer**
   - Create lecture schedules
   - Update schedules
   - Delete schedules
   - View schedules
   - Receive reminders

3. **Student**
   - View lecture schedules
   - Receive reminders

## Error Responses

The API uses standard HTTP status codes to indicate the success or failure of requests:

- `200 OK` - Successful GET, PUT, or DELETE request
- `201 Created` - Successful POST request
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., duplicate schedule)
- `500 Internal Server Error` - Server error

## Interactive Documentation

For interactive API documentation, visit:
```
http://localhost:3001/api/docs
```