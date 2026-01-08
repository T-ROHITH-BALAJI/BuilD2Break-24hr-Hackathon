# View Tracking System Setup Guide

This guide explains how to implement the comprehensive view tracking system I've created for your job portal application.

## 🚀 Quick Start

### 1. Database Setup

First, run the database migration to add view tracking tables:

```bash
# Connect to your PostgreSQL database and run:
psql -U your_username -d your_database -f backend/migrations/005_add_view_tracking.sql
```

### 2. Backend Integration

Add the views routes to your main Express app:

```javascript
// In your main app.js or server.js file
import viewsRoutes from './routes/viewsRoutes.js';

// Add the routes
app.use('/api/views', viewsRoutes);
```

### 3. Frontend Integration

Import and use the view tracking components:

```javascript
// In any component where you want to show view counts
import ViewCounter from '../components/ViewCounter';
import { useAutoViewTracking } from '../hooks/useViewTracking';

// Simple usage
<ViewCounter entityType="job" entityId={123} />

// Auto-tracking usage
const JobCard = ({ job }) => {
  useAutoViewTracking('job', job.id);
  
  return (
    <div>
      <h3>{job.title}</h3>
      <ViewCounter entityType="job" entityId={job.id} />
    </div>
  );
};
```

## 📊 Features Overview

### Simple Counter
- **File**: `Frontend/src/components/ViewCounter.jsx`
- **Purpose**: Display basic view counts
- **Usage**: `<ViewCounter entityType="job" entityId={123} />`

### Analytics Dashboard
- **File**: `Frontend/src/components/AnalyticsDashboard.jsx`
- **Purpose**: Comprehensive analytics with charts and trends
- **Usage**: `<AnalyticsDashboard />`

### Hooks
- **File**: `Frontend/src/hooks/useViewTracking.js`
- **Hooks**:
  - `useViewTracking()` - Core tracking functionality
  - `useAutoViewTracking()` - Automatic view recording
  - `useViewCount()` - Display view counts

## 🔧 Implementation Steps

### Step 1: Database Migration
```sql
-- The migration file creates:
-- 1. views table for tracking all views
-- 2. view_statistics materialized view for performance
-- 3. Automatic triggers to update view counts
-- 4. Indexes for optimal query performance
```

### Step 2: Backend API Endpoints

The system provides these endpoints:

```
POST   /api/views/record                    - Record a view
GET    /api/views/count/:type/:id          - Get simple view count
GET    /api/views/stats/:type/:id          - Get detailed statistics
GET    /api/views/trending                 - Get trending content
GET    /api/views/dashboard               - Analytics dashboard data
POST   /api/views/refresh-stats          - Refresh materialized view
```

### Step 3: Frontend Components

#### Basic View Counter
```jsx
import ViewCounter from './components/ViewCounter';

// Simple counter with eye icon
<ViewCounter 
  entityType="job" 
  entityId={job.id}
  showIcon={true}
  className="text-sm"
/>
```

#### Enhanced Counter with Trending
```jsx
import { EnhancedViewCounter } from './components/ViewCounter';

<EnhancedViewCounter 
  entityType="job" 
  entityId={job.id}
  showTrending={true}
/>
```

#### Auto-tracking Views
```jsx
import { useAutoViewTracking } from './hooks/useViewTracking';

const JobDetail = ({ job }) => {
  // Automatically record view after 2 seconds
  useAutoViewTracking('job', job.id, { delay: 2000 });
  
  return <div>Job details...</div>;
};
```

## 🎯 How Unique Daily Views Work

### Current Simple Implementation
The current system tracks:
- **Total Views**: All view records
- **Unique Users**: Distinct logged-in users
- **Unique Sessions**: Distinct browser sessions (anonymous + logged-in)
- **Daily Stats**: Views grouped by date

### For True Unique Daily Views
The system uses this logic:
```sql
-- Daily unique views by combining user ID and session ID
SELECT 
  DATE(view_timestamp) as date,
  COUNT(DISTINCT COALESCE(viewer_user_id::text, session_id)) as unique_daily_views
FROM views 
WHERE viewed_entity_type = 'job' 
AND viewed_entity_id = 123
GROUP BY DATE(view_timestamp)
ORDER BY date DESC;
```

### Session Management
- Each visitor gets a unique `session_id` stored in localStorage
- Logged-in users are tracked by `user_id`
- Unique daily views = unique combination of `user_id` OR `session_id` per day

## 🔒 Privacy & Performance

### Privacy Features
- Anonymous view tracking (no personal data required)
- IP addresses stored for spam prevention only
- Session IDs are random, not personally identifiable

### Performance Optimizations
- **Materialized View**: Pre-calculated statistics for fast queries
- **Database Triggers**: Auto-update view counts
- **Indexes**: Optimized for common query patterns
- **Rate Limiting**: Prevents spam (5-minute cooldown per view)

### Anti-Spam Measures
- Same user can't increment views for 5 minutes
- Session-based tracking prevents multiple counts
- User agent and IP tracking for abuse detection

## 📈 Analytics Dashboard Features

### Overview Stats
- Total views across all content
- Unique users and sessions
- Active days with views
- Growth trends

### Entity Breakdown
- Views by content type (jobs, profiles, etc.)
- Percentage distribution
- Trending content identification

### Time-based Analytics
- Daily view trends
- Hourly patterns
- Custom time period filtering

## 🛠️ Customization Options

### Adding New Entity Types
1. Update the database constraint:
```sql
ALTER TABLE views DROP CONSTRAINT views_viewed_entity_type_check;
ALTER TABLE views ADD CONSTRAINT views_viewed_entity_type_check 
CHECK (viewed_entity_type IN ('job', 'profile', 'company', 'your_new_type'));
```

2. Update the backend validation in `viewsController.js`

### Custom View Counter Styles
```jsx
// Custom styling
<ViewCounter 
  entityType="job" 
  entityId={job.id}
  className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
  showIcon={false}
/>
```

## 📊 Example Queries

### Most Viewed Jobs This Week
```sql
SELECT j.title, j.company, COUNT(v.view_id) as view_count
FROM jobs j
JOIN views v ON j.job_id = v.viewed_entity_id 
WHERE v.viewed_entity_type = 'job'
AND v.view_timestamp >= NOW() - INTERVAL '7 days'
GROUP BY j.job_id, j.title, j.company
ORDER BY view_count DESC
LIMIT 10;
```

### Daily Unique Views for a Job
```sql
SELECT 
  DATE(view_timestamp) as date,
  COUNT(DISTINCT COALESCE(viewer_user_id::text, session_id)) as unique_views,
  COUNT(*) as total_views
FROM views 
WHERE viewed_entity_type = 'job' 
AND viewed_entity_id = 123
AND view_timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE(view_timestamp)
ORDER BY date DESC;
```

## 🚀 Deployment Notes

### Production Considerations
1. **Materialized View Refresh**: Set up a cron job to refresh statistics
```bash
# Add to crontab - refresh every hour
0 * * * * psql -d your_db -c "SELECT refresh_view_statistics();"
```

2. **Index Monitoring**: Monitor query performance and add indexes as needed

3. **Data Retention**: Consider archiving old view records
```sql
-- Archive views older than 1 year
DELETE FROM views WHERE view_timestamp < NOW() - INTERVAL '1 year';
```

## 🎉 Testing

### Test the System
1. **Record Views**: Make POST requests to `/api/views/record`
2. **Check Counts**: GET requests to `/api/views/count/:type/:id`
3. **View Analytics**: Access the dashboard at `/api/views/dashboard`

### Sample Test Data
```javascript
// Record test views
await fetch('/api/views/record', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    entityType: 'job',
    entityId: 123
  })
});
```

## 🎯 Next Steps

1. **Run the migration** to set up the database tables
2. **Add the routes** to your Express server
3. **Import components** where you want to show view counts
4. **Set up auto-tracking** on key pages (job details, profiles)
5. **Add the analytics dashboard** to your admin panel
6. **Test the system** with sample data

The system is designed to be:
- ✅ **Simple to implement**
- ✅ **Scalable for high traffic**
- ✅ **Privacy-friendly**
- ✅ **Feature-rich analytics**

Happy tracking! 🚀📊