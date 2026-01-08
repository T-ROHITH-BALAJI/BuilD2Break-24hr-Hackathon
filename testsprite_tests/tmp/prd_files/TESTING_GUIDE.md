# Job Portal Testing Guide

## 🚀 Quick Start - Demo Accounts

I've created a mock authentication system so you can test all features without a backend. Here are the demo accounts:

### 📋 Demo Credentials

#### 👤 **Job Seeker Account**
- **Email:** `jobseeker@test.com`
- **Password:** `password123`
- **Features to test:**
  - Dashboard with job statistics
  - Resume builder and management
  - ATS resume scanner
  - Job search and applications
  - Interview scheduling
  - Application tracking

#### 💼 **Recruiter Account**
- **Email:** `recruiter@test.com`
- **Password:** `password123`
- **Features to test:**
  - Recruiter dashboard
  - Post new jobs
  - Manage job listings
  - View and manage applicants
  - Schedule interviews
  - Send emails to candidates

#### 🛡️ **Admin Account**
- **Email:** `admin@test.com`
- **Password:** `password123`
- **Features to test:**
  - Admin dashboard with system overview
  - User management (view, edit, suspend users)
  - Recruiter management and verification
  - System logs and activity monitoring
  - Duplicate user detection and management

## 🎯 How to Test

### Method 1: Click Demo Credentials (Easiest)
1. Go to the login page
2. Click on any of the blue demo credential boxes
3. Credentials will be auto-filled
4. Click "Sign In"

### Method 2: Manual Entry
1. Go to login page
2. Enter email and password manually
3. Click "Sign In"

### Method 3: Test Registration
1. Go to register page
2. Fill out the form with new details
3. Submit registration
4. You'll be redirected to login with success message
5. Login with your new credentials

## 🔧 Features Working

### ✅ Authentication System
- Login with demo accounts
- Registration (creates new accounts in memory)
- 2FA simulation (accepts any 6-digit code)
- Role-based redirects
- Protected routes

### ✅ UI Components
- Responsive design (desktop + mobile)
- Tailwind CSS styling
- Loading states
- Toast notifications
- Modal dialogs
- Forms with validation

### ✅ Navigation
- Role-based sidebar navigation
- Profile dropdown
- Search functionality
- Notifications panel

### ✅ Pages Implemented
- **Auth:** Login, Register, 2FA
- **Job Seeker:** Dashboard, Resume, ATS Scanner, Jobs, Meetings, Applications
- **Recruiter:** Dashboard, Post Job, Jobs, Applicants, Schedule, Email
- **Admin:** Dashboard, Users, Recruiters, Logs, Duplicates

## 🧪 Test Scenarios

### 1. Complete Job Seeker Flow
1. Login as job seeker
2. Check dashboard statistics
3. Upload/edit resume
4. Scan resume with ATS
5. Browse and apply for jobs
6. Check application status

### 2. Complete Recruiter Flow
1. Login as recruiter  
2. View recruiter dashboard
3. Post a new job
4. Manage existing jobs
5. Review applications
6. Schedule interviews

### 3. Complete Admin Flow
1. Login as admin
2. View system dashboard
3. Manage users (activate/suspend)
4. Review recruiters
5. Check system logs
6. Handle duplicate accounts

## 📱 Responsive Testing
- Test on desktop (1920x1080)
- Test on tablet (768px)
- Test on mobile (375px)
- Check sidebar collapse/expand
- Verify modal responsiveness

## 🔍 What to Look For
- Smooth navigation between pages
- Proper role-based access control
- Responsive design on all screen sizes
- Working forms and validations
- Toast notifications for actions
- Loading states during operations
- Consistent styling and layout

## 💡 Notes
- All data is stored in memory (resets on page refresh)
- Mock API delays simulate real backend response times
- Registration adds new users to the in-memory database
- 2FA accepts any 6-digit code for testing
- No real emails are sent (simulated)

Happy testing! 🎉
