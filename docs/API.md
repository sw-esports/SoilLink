# SoilLink2 API Documentation

## Overview
SoilLink2 is a comprehensive soil analysis and management platform built with Node.js, Express, and MongoDB.

## Base URL
```
Development: http://localhost:3000
Production: https://your-domain.com
```

## Authentication
The API uses session-based authentication with secure JWT tokens.

### Login
**POST** `/auth/login`

Login to the application.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Response:**
- **302 Redirect** to `/dashboard` on success
- **302 Redirect** to `/auth/login` with error message on failure

**Example:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Password123!"}'
```

### Register
**POST** `/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123!",
  "confirmPassword": "Password123!"
}
```

**Validation Rules:**
- `name`: 2-50 characters, letters and spaces only
- `email`: Valid email format, max 255 characters
- `password`: 8-128 characters, must contain uppercase, lowercase, number, and special character
- `confirmPassword`: Must match password

**Response:**
- **302 Redirect** to `/dashboard` on success
- **302 Redirect** to `/auth/register` with error message on failure

### Logout
**POST** `/auth/logout`

Logout the current user.

**Response:**
- **302 Redirect** to `/` (homepage)

## Dashboard Routes
All dashboard routes require authentication. Unauthenticated users are redirected to `/auth/login`.

### Dashboard Home
**GET** `/dashboard`

Get the main dashboard view with user analytics and overview.

**Response:**
- **200** Dashboard HTML page with user data

### User Profile
**GET** `/dashboard/profile`

Get the user profile page.

**Response:**
- **200** Profile HTML page

**POST** `/dashboard/profile`

Update user profile information.

**Request Body:**
```json
{
  "name": "Updated Name"
}
```

**Response:**
- **302 Redirect** to `/dashboard/profile` with success/error message

### Soil Analysis
**GET** `/dashboard/soil-analysis`

Get the soil analysis interface.

**Response:**
- **200** Soil analysis HTML page

### Reports
**GET** `/dashboard/reports`

Get the reports dashboard.

**Response:**
- **200** Reports HTML page

## Health Check Endpoints

### Health Status
**GET** `/api/health/health`

Check application health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-05-24T10:00:00.000Z",
  "uptime": 3600,
  "environment": "development"
}
```

### Readiness Check
**GET** `/api/health/ready`

Check if application is ready to serve requests.

**Response:**
```json
{
  "ready": true,
  "checks": {
    "database": "connected",
    "cache": "operational"
  }
}
```

### Metrics
**GET** `/api/health/metrics`

Get application performance metrics.

**Response:**
```json
{
  "requests": {
    "total": 1250,
    "active": 3,
    "averageResponseTime": 156
  },
  "system": {
    "memory": {
      "heapUsed": "45MB",
      "systemUsage": "67%"
    },
    "cpu": "23%",
    "uptime": "3600s"
  },
  "database": {
    "totalQueries": 450,
    "averageTime": "89ms",
    "connections": 5
  }
}
```

## Public Routes

### Home Page
**GET** `/`

Get the application homepage.

**Response:**
- **200** Homepage HTML

### About Page
**GET** `/about`

Get the about page.

**Response:**
- **200** About page HTML

### Contact Page
**GET** `/contact`

Get the contact page.

**Response:**
- **200** Contact page HTML

**POST** `/contact`

Submit a contact form.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Inquiry",
  "message": "Your message here"
}
```

**Response:**
- **302 Redirect** to `/contact` with success/error message

## Error Responses

### 400 Bad Request
Invalid request data or validation errors.

### 401 Unauthorized
Authentication required.

### 403 Forbidden
Access denied.

### 404 Not Found
Resource not found.

### 429 Too Many Requests
Rate limit exceeded.

**Rate Limits:**
- General requests: 100 per 15 minutes per IP
- Authentication requests: 5 per 15 minutes per IP

### 500 Internal Server Error
Server error occurred.

## Data Models

### User
```json
{
  "_id": "ObjectId",
  "name": "string (required, 2-50 chars)",
  "email": "string (required, unique, valid email)",
  "password": "string (required, hashed)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

## Security Features

### Rate Limiting
- General API: 100 requests per 15 minutes
- Authentication endpoints: 5 requests per 15 minutes

### Input Validation
- XSS protection with HTML sanitization
- SQL injection prevention
- Request size limits (10MB max)

### Security Headers
- Helmet.js for security headers
- Content Security Policy (CSP)
- HSTS (HTTP Strict Transport Security)

### Session Security
- Secure session configuration
- Session timeout (30 minutes)
- Activity tracking
- Suspicious activity detection

## Development

### Environment Variables
```bash
PORT=3000
MONGODB_URI=mongodb://localhost:27017/soillink2
JWT_SECRET=your_strong_jwt_secret_here
NODE_ENV=development
SESSION_SECRET=your_session_secret_here
```

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Starting the Application
```bash
# Development mode
npm run dev

# Production mode
npm run prod

# Regular start
npm start
```

## Logging

The application uses Winston for structured logging with different log levels:

- **Error**: Application errors and exceptions
- **Warn**: Warning messages and slow requests
- **Info**: General application information
- **Debug**: Detailed debugging information

Log files are stored in the `logs/` directory:
- `combined.log`: All log levels
- `error.log`: Error level only

## Performance Monitoring

The application includes comprehensive performance monitoring:

- Request/response time tracking
- Memory and CPU usage monitoring
- Database query performance
- Error rate tracking
- Health check endpoints

## Caching

Implemented caching strategy:
- User data caching (2 hours TTL)
- Session caching (30 minutes TTL)
- API response caching (10 minutes TTL)
- Dashboard data caching (30 minutes TTL)
