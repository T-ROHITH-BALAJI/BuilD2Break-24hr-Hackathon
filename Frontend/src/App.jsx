import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

// Auth Components
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import TwoFA from './pages/auth/TwoFA';
import AdminLogin from './pages/auth/AdminLogin';

// Job Seeker Components
import JobSeekerDashboard from './pages/jobseeker/Dashboard';
import Resume from './pages/jobseeker/Resume';
import ATS from './pages/jobseeker/ATS';
import Jobs from './pages/jobseeker/Jobs';
import MyJobs from './pages/jobseeker/MyJobs';
import Meetings from './pages/jobseeker/Meetings';
import Applications from './pages/jobseeker/Applications';

// Recruiter Components
import RecruiterDashboard from './pages/recruiter/Dashboard';
import PostJob from './pages/recruiter/PostJob';
import RecruiterJobs from './pages/recruiter/Jobs';
import Applicants from './pages/recruiter/Applicants';
import Schedule from './pages/recruiter/Schedule';
import Email from './pages/recruiter/Email';

// Admin Components
import AdminDashboard from './pages/admin/Dashboard';
import Users from './pages/admin/Users';
import Recruiters from './pages/admin/Recruiters';
import Logs from './pages/admin/Logs';
import Duplicates from './pages/admin/Duplicates';

// Common Components
import Profile from './pages/Profile';
import Settings from './pages/Settings';

// Layout Components
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

function App() {
  return (
    <AuthProvider>
      <Router 
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <div className="App">
          <Toaster position="top-right" />
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/2fa" element={<TwoFA />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            
            {/* Job Seeker Routes */}
            <Route path="/jobseeker" element={
              <ProtectedRoute allowedRoles={['jobseeker']}>
                <Layout userType="jobseeker" />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<JobSeekerDashboard />} />
              <Route path="resume" element={<Resume />} />
              <Route path="ats" element={<ATS />} />
              <Route path="jobs" element={<Jobs />} />
              <Route path="my-jobs" element={<MyJobs />} />
              <Route path="meetings" element={<Meetings />} />
              <Route path="applications" element={<Applications />} />
              <Route path="profile" element={<Profile />} />
            </Route>
            
            {/* Recruiter Routes */}
            <Route path="/recruiter" element={
              <ProtectedRoute allowedRoles={['recruiter']}>
                <Layout userType="recruiter" />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<RecruiterDashboard />} />
              <Route path="post-job" element={<PostJob />} />
              <Route path="jobs" element={<RecruiterJobs />} />
              <Route path="applicants" element={<Applicants />} />
              <Route path="applicants/:jobId" element={<Applicants />} />
              <Route path="schedule" element={<Schedule />} />
              <Route path="schedule/:appId" element={<Schedule />} />
              <Route path="email" element={<Email />} />
              <Route path="email/:appId" element={<Email />} />
              <Route path="profile" element={<Profile />} />
            </Route>
            
            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout userType="admin" />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<Users />} />
              <Route path="recruiters" element={<Recruiters />} />
              <Route path="logs" element={<Logs />} />
              <Route path="duplicates" element={<Duplicates />} />
              <Route path="profile" element={<Profile />} />
            </Route>
            
            {/* Default Route */}
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
