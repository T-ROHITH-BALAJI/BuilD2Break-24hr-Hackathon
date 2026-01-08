# Job Portal - Full Stack Application

A comprehensive job portal application built with React (Frontend) and Node.js + Express + PostgreSQL (Backend).

## �️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router |
| **Backend** | Node.js 18, Express.js, JWT Authentication |
| **Database** | PostgreSQL 15+ / **Supabase** (Cloud PostgreSQL) |
| **Deployment** | Docker, Docker Compose, GitHub Actions CI/CD |
| **Cloud** | Azure Static Web Apps, Supabase |

## 🗄️ Database - Supabase

This project uses **[Supabase](https://supabase.com)** as the cloud database solution in production:

- **PostgreSQL Database**: Fully managed PostgreSQL with automatic backups
- **Real-time subscriptions**: For live updates (optional)
- **Row Level Security**: Built-in security policies
- **Auto-generated APIs**: REST and GraphQL endpoints

### Setting up Supabase

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **Settings > Database** to get your connection details
4. Run the schema migration in the SQL Editor:
   ```sql
   -- Copy contents of schema.sql and run in Supabase SQL Editor
   ```
5. Copy your credentials to `.env`:
   ```bash
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_DB_HOST=db.your-project-id.supabase.co
   SUPABASE_DB_PASSWORD=your-db-password
   ```

## 🐳 Docker Deployment

### Quick Start with Docker

```bash
# Clone the repository
git clone https://github.com/T-ROHITH-BALAJI/BuilD2Break-24hr-Hackathon.git
cd BuilD2Break-24hr-Hackathon

# Copy environment file
cp .env.example .env
# Edit .env with your configuration

# Start with local PostgreSQL
docker-compose up -d

# OR Start with Supabase (production)
docker-compose -f docker-compose.supabase.yml up -d
```

### Docker Commands

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (reset database)
docker-compose down -v
```

Visit `http://localhost` (Frontend) and `http://localhost:5000` (Backend API)

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 15+ (or use Supabase)
- Docker (optional)

### Development Setup

1. **Clone the repository**
```bash
git clone https://github.com/T-ROHITH-BALAJI/BuilD2Break-24hr-Hackathon.git
cd BuilD2Break-24hr-Hackathon
```

2. **Backend Setup**
```bash
cd backend
cp .env.example .env
# Edit .env with your configuration (use Supabase credentials for production)
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