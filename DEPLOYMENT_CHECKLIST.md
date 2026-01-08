# 🔒 Security and Deployment Checklist

## Build Phase 2 - Pre-Deployment Verification

Use this checklist before deploying to production.

---

## ✅ Security Verification

### Environment Configuration
- [ ] `.env` file exists in backend directory
- [ ] `.env` file is listed in `.gitignore`
- [ ] `JWT_SECRET` is at least 32 characters long
- [ ] `JWT_SECRET` is cryptographically random (not a dictionary word)
- [ ] Database password is strong and unique
- [ ] `NODE_ENV` is set to `production`
- [ ] All required environment variables are set

**Verify with:**
```powershell
# Check .env exists
Test-Path backend\.env

# Generate secure JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### Dependencies Security
- [ ] Backend dependencies audited: `cd backend && npm audit`
- [ ] Frontend dependencies audited: `cd Frontend && npm audit`
- [ ] No critical vulnerabilities present
- [ ] All packages are up-to-date

**Run audit:**
```powershell
cd backend
npm audit --production
npm audit fix --production  # if needed

cd ..\Frontend
npm audit --production
npm audit fix --production  # if needed
```

---

### Backend Security Features
- [ ] Helmet.js is active (security headers)
- [ ] Rate limiting is configured
  - [ ] Auth endpoints: 5 requests/15min
  - [ ] General API: 100 requests/15min
- [ ] CORS is restricted to production domains
- [ ] Input validation middleware is active
- [ ] XSS protection is enabled
- [ ] Password requirements enforced (8+ chars, complexity)
- [ ] SQL injection protection (parameterized queries)

**Test rate limiting:**
```bash
# Should fail after 5 attempts within 15 minutes
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
```

---

### Frontend Security Features
- [ ] Source maps disabled in production build
- [ ] Console logs removed in production
- [ ] Code is minified
- [ ] Sensitive data not stored in localStorage
- [ ] API keys not hardcoded in frontend

**Verify build:**
```powershell
cd Frontend
$env:NODE_ENV="production"
npm run build

# Check dist folder
Test-Path .\dist\index.html
Test-Path .\dist\assets

# Verify no .map files in production
Get-ChildItem -Path .\dist -Recurse -Filter *.map
```

---

### Database Security
- [ ] Database user has minimal required permissions
- [ ] Database password is not default
- [ ] Database is not publicly accessible
- [ ] SSL/TLS enabled for database connections (production)
- [ ] Regular backups configured
- [ ] All migrations have been run

**Database checks:**
```sql
-- Check user permissions
SELECT * FROM pg_roles WHERE rolname = 'your_db_user';

-- Verify SSL is available
SHOW ssl;

-- Check tables exist
\dt
```

---

## 🏗️ Build Verification

### Backend Build
- [ ] All dependencies installed: `cd backend && npm ci`
- [ ] Server starts without errors
- [ ] Database connection successful
- [ ] Environment validation passes

**Test backend:**
```powershell
cd backend
npm install
npm start

# In another terminal, test the API
curl http://localhost:5000/
```

---

### Frontend Build
- [ ] All dependencies installed: `cd Frontend && npm ci`
- [ ] Lint passes: `npm run lint`
- [ ] Build completes successfully: `npm run build`
- [ ] `dist/` directory created
- [ ] All assets present in `dist/assets/`

**Test frontend:**
```powershell
cd Frontend
npm install
npm run lint
npm run build
npm run preview  # Test production build locally
```

---

### Build Script Execution
- [ ] Build script runs without errors (Windows: `.\build.ps1` or Linux: `./build.sh`)
- [ ] All steps complete successfully
- [ ] No critical warnings

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] Production domain configured
- [ ] SSL/TLS certificate obtained
- [ ] DNS records configured
- [ ] Server/hosting environment ready
- [ ] Database server accessible from application server
- [ ] Firewall rules configured
- [ ] Load balancer configured (if applicable)

---

### Database Deployment
- [ ] Production database created
- [ ] `schema.sql` executed
- [ ] All migrations executed in order:
  - [ ] `migration_jobseeker_jobs.sql`
  - [ ] `migration_interviews.sql`
  - [ ] `migration_multiple_resumes.sql`
  - [ ] `migration_remove_jobseeker_jobs.sql`
  - [ ] `migration_add_resume_id_to_applications.sql`
- [ ] Seed data loaded (if needed)
- [ ] Database backup created

**Run migrations:**
```bash
psql -U postgres -d jobportal -f schema.sql
psql -U postgres -d jobportal -f backend/migration_jobseeker_jobs.sql
psql -U postgres -d jobportal -f backend/migration_interviews.sql
# ... etc
```

---

### Backend Deployment
- [ ] Code deployed to server
- [ ] Production `.env` configured on server
- [ ] Dependencies installed: `npm ci --production`
- [ ] Server process manager configured (PM2, systemd)
- [ ] Server starts and runs without errors
- [ ] Health check endpoint responds
- [ ] Logs are accessible

**Deploy with PM2:**
```bash
cd backend
npm ci --production
pm2 start server.js --name jobportal-api
pm2 save
pm2 startup
```

---

### Frontend Deployment
- [ ] Production build created: `npm run build`
- [ ] `dist/` folder deployed to web server
- [ ] Static file server configured (Nginx, Apache, S3, etc.)
- [ ] Correct MIME types configured
- [ ] Gzip compression enabled
- [ ] Browser caching configured
- [ ] SPA fallback configured (all routes → index.html)

**Example Nginx config:**
```nginx
location / {
    root /var/www/jobportal;
    try_files $uri $uri/ /index.html;
    gzip on;
    gzip_types text/css application/javascript application/json;
}
```

---

### Reverse Proxy Configuration
- [ ] Reverse proxy configured (Nginx/Apache)
- [ ] SSL/TLS certificates installed
- [ ] HTTPS redirect configured (HTTP → HTTPS)
- [ ] API routes proxied to backend
- [ ] Static files served directly
- [ ] Security headers configured
- [ ] Rate limiting configured (optional, additional layer)

---

### SSL/TLS Configuration
- [ ] SSL certificate installed
- [ ] Certificate is valid and not expired
- [ ] HTTPS enforced (redirects from HTTP)
- [ ] HSTS header configured
- [ ] Certificate auto-renewal configured (Let's Encrypt)

**Test SSL:**
```bash
curl -I https://yourdomain.com
# Should return 200 OK with security headers
```

---

## 🧪 Post-Deployment Testing

### Functionality Tests
- [ ] Homepage loads correctly
- [ ] User registration works
  - [ ] Job seeker registration
  - [ ] Recruiter registration
  - [ ] Validation errors display correctly
- [ ] User login works
  - [ ] Correct credentials accepted
  - [ ] Incorrect credentials rejected
  - [ ] Rate limiting active (test 6+ failed attempts)
- [ ] Protected routes require authentication
- [ ] Role-based access control works
- [ ] Job posting works (recruiter)
- [ ] Job application works (job seeker)
- [ ] Resume upload/management works
- [ ] Profile updates work

---

### Security Tests
- [ ] Security headers present: `curl -I https://yourdomain.com`
  - [ ] `Strict-Transport-Security`
  - [ ] `X-Content-Type-Options`
  - [ ] `X-Frame-Options`
  - [ ] `X-XSS-Protection`
- [ ] CORS works correctly
  - [ ] Allowed origins can access API
  - [ ] Disallowed origins are blocked
- [ ] Rate limiting works
  - [ ] Auth endpoints limit requests
  - [ ] API endpoints limit requests
- [ ] Input validation works
  - [ ] Invalid emails rejected
  - [ ] Weak passwords rejected
  - [ ] SQL injection attempts blocked
  - [ ] XSS attempts sanitized

**Test security headers:**
```bash
curl -I https://yourdomain.com/api
# Check for security headers in response
```

---

### Performance Tests
- [ ] Page load time < 3 seconds
- [ ] API response time < 500ms (average)
- [ ] Database queries optimized
- [ ] Static assets cached
- [ ] Images optimized
- [ ] Code splitting effective

**Test with browser DevTools:**
- Network tab: Check load times
- Lighthouse: Run audit (aim for 90+ score)

---

## 📊 Monitoring Setup

### Required Monitoring
- [ ] Application logs configured
- [ ] Error tracking set up (Sentry, LogRocket, etc.)
- [ ] Uptime monitoring configured (UptimeRobot, Pingdom)
- [ ] Database monitoring active
- [ ] Server metrics tracked (CPU, memory, disk)
- [ ] SSL certificate expiry monitoring

---

### Logging
- [ ] Application logs accessible
- [ ] Error logs separate from access logs
- [ ] Log rotation configured
- [ ] Sensitive data not logged (passwords, tokens)

**PM2 Logs:**
```bash
pm2 logs jobportal-api
pm2 logs jobportal-api --err  # Error logs only
```

---

## 🔄 Backup and Recovery

### Backup Strategy
- [ ] Database backup configured (daily)
- [ ] Backup retention policy defined
- [ ] Backup restoration tested
- [ ] Configuration backups (nginx, .env)
- [ ] Code repository up to date

**Database backup:**
```bash
# Backup
pg_dump -U postgres jobportal > backup_$(date +%Y%m%d).sql

# Restore
psql -U postgres jobportal < backup_20260108.sql
```

---

## 📝 Documentation

### Required Documentation
- [ ] README.md updated with production info
- [ ] API documentation complete
- [ ] Deployment runbook created
- [ ] Rollback procedure documented
- [ ] Emergency contacts listed
- [ ] Credentials securely stored (password manager)

---

## ✅ Final Checklist

Before going live:
- [ ] All above checklists completed
- [ ] Stakeholders notified
- [ ] Support team briefed
- [ ] Monitoring confirmed working
- [ ] Backup tested
- [ ] Rollback plan ready
- [ ] Load testing completed (if needed)

---

## 🎉 Go Live!

Once all items are checked:
1. Switch DNS to production server
2. Monitor logs and metrics closely
3. Test critical user flows
4. Be ready for rollback if needed

---

## 📞 Emergency Contacts

**Production Issues:**
- Dev Team: [contact]
- Database Admin: [contact]
- Hosting Support: [contact]

**Rollback Command:**
```bash
pm2 stop jobportal-api
# Deploy previous version
pm2 start jobportal-api
```

---

**Last Updated**: January 8, 2026  
**Version**: Build Phase 2  
**Status**: Ready for Production Deployment
