# Job Portal - Full Stack Application

A comprehensive job portal application built with React (Frontend) and Node.js + Express + PostgreSQL (Backend).

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 15+

### Development Setup

1. **Clone the repository**
```bash
git clone https://github.com/SEMESTER-5-TEAM/CloudComputing.git
cd CloudComputing
```

2. **Backend Setup**
```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
npm install
npm run dev
```

3. **Frontend Setup** (in a new terminal)
```bash
cd Frontend
npm install
npm run dev
```

4. **Database Setup**
```bash
psql -U postgres -c "CREATE DATABASE jobportal;"
psql -U postgres -d jobportal -f schema.sql
```

Visit `http://localhost:3000` to see the application.

## 📦 Build Phase 2 - Production Ready

**See [BUILD_PHASE_2.md](./BUILD_PHASE_2.md) for complete production deployment guide.**

### Quick Build

**Windows (PowerShell):**
```powershell
.\build.ps1
```

**Linux/Mac:**
```bash
chmod +x build.sh
./build.sh
```

## 🔒 Security Features

✅ Helmet.js security headers  
✅ Rate limiting on authentication  
✅ Input validation and sanitization  
✅ XSS protection  
✅ Strong password requirements  
✅ Secure CORS configuration  
✅ Environment variable validation  

## 📖 Documentation

- **[BUILD_PHASE_2.md](./BUILD_PHASE_2.md)** - Production deployment guide
- **[WARP.md](./WARP.md)** - Development commands reference
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Manual testing procedures
- **[SQL_DOCUMENTATION.md](./SQL_DOCUMENTATION.md)** - Database documentation

## 🔧 Environment Configuration

### Backend (.env)
```bash 
PORT=5000
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_HOST=localhost
DB_NAME=jobportal
DB_PORT=5432
JWT_SECRET=your_secret_key_here
```