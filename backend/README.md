# Job Portal Backend API

A comprehensive backend API for a job portal application built with Node.js, Express.js, and PostgreSQL.

## Features

### Authentication & Authorization
- User registration and login
- JWT-based authentication
- Role-based access control (Job Seeker, Recruiter, Admin)
- Password hashing with bcrypt

### Job Management
- Create, read, update, delete job postings
- Job search and filtering
- Job application tracking
- Interview scheduling

### Resume Management
- Create and manage resumes
- Add work experience, skills, and education
- Resume scoring and optimization

### Admin Features
- User management
- System logs and analytics
- Duplicate user detection
- Dashboard statistics

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Job Seeker Routes (`/api/jobseeker`)
- `GET /jobs` - Get all available jobs (with search/filter)
- `POST /jobs/:job_id/apply` - Apply for a job
- `GET /applications` - Get user's applications
- `POST /jobs/:job_id/save` - Save/unsave a job
- `GET /jobs/saved` - Get saved jobs
- `POST /resume` - Create/update resume
- `GET /resume` - Get user's resume
- `POST /resume/experience` - Add work experience
- `POST /resume/skills` - Add skills
- `POST /resume/education` - Add education
- `GET /interviews` - Get scheduled interviews

### Recruiter Routes (`/api/recruiter`)
- `POST /jobs` - Create a new job posting
- `GET /jobs/my` - Get recruiter's job postings
- `PUT /jobs/:id/status` - Update job status
- `DELETE /jobs/:id` - Delete a job
- `GET /jobs/:id/applicants` - Get applicants for a job
- `PUT /applications/:application_id/status` - Update application status
- `POST /interviews` - Schedule an interview

### Admin Routes (`/api/admin`)
- `GET /users` - Get all users (with pagination)
- `GET /users/:id` - Get user by ID
- `PUT /users/:id/status` - Update user status
- `DELETE /users/:id` - Delete user
- `GET /users/duplicates` - Get duplicate users
- `GET /jobs` - Get all jobs
- `DELETE /jobs/:id` - Delete any job
- `GET /applications` - Get all applications
- `GET /logs` - Get system logs
- `GET /dashboard/stats` - Get dashboard statistics

## Database Schema

The application uses PostgreSQL with the following main tables:
- `users` - User accounts
- `recruiters` - Recruiter profiles
- `job_seekers` - Job seeker profiles
- `jobs` - Job postings
- `applications` - Job applications
- `resumes` - Resume data
- `experiences` - Work experience entries
- `skills` - Skills data
- `education` - Education entries
- `interviews` - Interview scheduling
- `system_logs` - System activity logs

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your database credentials and JWT secret.

4. Set up PostgreSQL database:
   ```bash
   psql -U your_username -d postgres
   ```
   Then run the SQL commands from `schema.sql` to create the database and tables.

5. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=jobportal
DB_USER=your_username
DB_PASSWORD=your_password
JWT_SECRET=your_super_secret_jwt_key_here
PORT=5000
NODE_ENV=development
```

## Dependencies

- **express** - Web framework
- **cors** - Cross-origin resource sharing
- **bcrypt** - Password hashing
- **jsonwebtoken** - JWT authentication
- **pg** - PostgreSQL client
- **dotenv** - Environment variable management

## Development Dependencies

- **nodemon** - Development server with auto-restart

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- Role-based access control

## Error Handling

The API includes comprehensive error handling:
- Input validation errors
- Authentication errors
- Authorization errors
- Database errors
- Server errors

All errors return a consistent JSON format:
```json
{
  "success": false,
  "error": "Error message"
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

