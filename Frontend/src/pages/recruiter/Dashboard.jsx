import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';
import {
  Briefcase,
  Users,
  Eye,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  MapPin,
  DollarSign,
  Star,
  Filter
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    newApplications: 0,
    scheduledInterviews: 0,
    hiredCandidates: 0,
  });

  const [recentJobs, setRecentJobs] = useState([]);

  const [recentApplications, setRecentApplications] = useState([]);

  const [upcomingInterviews, setUpcomingInterviews] = useState([]);

  const getStatusConfig = (status) => {
    switch (status) {
      case 'new':
        return { color: 'bg-blue-100 text-blue-800', text: 'New' };
      case 'reviewed':
        return { color: 'bg-yellow-100 text-yellow-800', text: 'Reviewed' };
      case 'interview':
        return { color: 'bg-purple-100 text-purple-800', text: 'Interview' };
      case 'hired':
        return { color: 'bg-green-100 text-green-800', text: 'Hired' };
      case 'rejected':
        return { color: 'bg-red-100 text-red-800', text: 'Rejected' };
      default:
        return { color: 'bg-gray-100 text-gray-800', text: 'Unknown' };
    }
  };

  const getJobStatusConfig = (status) => {
    switch (status) {
      case 'active':
        return { color: 'bg-green-100 text-green-800', text: 'Active' };
      case 'closed':
        return { color: 'bg-red-100 text-red-800', text: 'Closed' };
      case 'draft':
        return { color: 'bg-gray-100 text-gray-800', text: 'Draft' };
      default:
        return { color: 'bg-gray-100 text-gray-800', text: 'Unknown' };
    }
  };

useEffect(() => {
    const loadData = async () => {
      try {
        // Jobs
        const res = await client.get('/api/recruiter/jobs/my');
        if (res.data?.success) {
          const mapped = res.data.jobs.map(j => ({
            id: j.job_id,
            title: j.title,
            location: j.company || '—',
            salary: j.salary ? `$${Number(j.salary).toLocaleString()}` : '—',
            postedDate: j.posted_at ? new Date(j.posted_at).toLocaleDateString() : '',
            applications: Number(j.application_count || 0),
            status: j.status || 'active',
            type: j.job_type || 'Full-time',
          }));
          setRecentJobs(mapped.slice(0, 5));
        }

        // Upcoming interviews
        const intRes = await client.get('/api/recruiter/interviews');
        if (intRes.data?.success) {
          const mappedInt = intRes.data.interviews.map(i => ({
            id: i.interview_id,
            candidateName: i.seeker_name || i.seeker_email || 'Candidate',
            jobTitle: i.job_title || '—',
            date: i.schedule ? new Date(i.schedule).toLocaleDateString() : '',
            time: i.schedule ? new Date(i.schedule).toLocaleTimeString() : '',
            type: i.type || 'Interview'
          }));
          setUpcomingInterviews(mappedInt);
        }

        // Recent applications across all jobs
        const appsRes = await client.get('/api/recruiter/applications/recent');
        if (appsRes.data?.success) {
          const mappedApps = appsRes.data.applications.map(a => ({
            id: a.application_id,
            candidateName: a.seeker_name || 'Candidate',
            jobTitle: a.job_title || '—',
            status: a.status || 'applied',
            appliedDate: a.applied_timestamp ? new Date(a.applied_timestamp).toLocaleDateString() : (a.created_at ? new Date(a.created_at).toLocaleDateString() : ''),
            // Optional fields
            experience: a.experience || null,
            match: typeof a.match === 'number' ? Math.round(a.match) : null,
          }));
          setRecentApplications(mappedApps.slice(0, 5));
        }

        // Load live stats snapshot
        const statsRes = await client.get('/api/recruiter/stats');
        if (statsRes.data?.success) setStats(s => ({ ...s, ...statsRes.data.stats }));
      } catch (e) {}
    };
    let timer;
    const start = async () => {
      await loadData();
      timer = setInterval(loadData, 30000);
      window.addEventListener('focus', loadData);
    };
    start();
    return () => {
      if (timer) clearInterval(timer);
      window.removeEventListener('focus', loadData);
    };
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="relative bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-2xl p-8 text-white overflow-hidden animate-gradient-shift shadow-2xl backdrop-blur-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-sm"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/4 left-1/4 w-8 h-8 bg-white/10 rounded-full animate-float"></div>
          <div className="absolute top-3/4 right-1/4 w-6 h-6 bg-white/5 rounded-full animate-float" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 right-1/3 w-4 h-4 bg-white/10 rounded-full animate-float" style={{animationDelay: '1s'}}></div>
        </div>
        <div className="relative flex items-center justify-between">
          <div className="animate-slideInLeft">
            <h1 className="text-3xl font-bold mb-2 animate-fadeIn">Welcome back, {user?.name}! 👋</h1>
            <p className="text-purple-100 mt-2 text-lg">
              Ready to find great talent? Manage your job postings and review applications.
            </p>
          </div>
          <div className="hidden md:block animate-slideInRight">
            <div className="relative">
              <div className="absolute inset-0 bg-white/10 rounded-full blur-xl"></div>
              <Briefcase className="relative w-20 h-20 text-white/80 animate-float" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="group bg-white/80 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 animate-slideInUp">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg transform group-hover:rotate-12 transition-transform duration-300">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Jobs</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{stats.activeJobs}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center">
              <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full animate-pulseGlow" style={{width: `${stats.totalJobs ? Math.min(100, Math.round((stats.activeJobs / stats.totalJobs) * 100)) : 0}%`}}></div>
            </div>
          </div>
        </div>

        <div className="group bg-white/80 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 animate-slideInUp" style={{animationDelay: '0.1s'}}>
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg transform group-hover:rotate-12 transition-transform duration-300">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">New Applications</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{stats.newApplications}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center">
              <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full animate-pulseGlow" style={{width: `${stats.totalApplications ? Math.min(100, Math.round((stats.newApplications / stats.totalApplications) * 100)) : (stats.newApplications ? 100 : 0)}%`}}></div>
            </div>
          </div>
        </div>

        <div className="group bg-white/80 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 animate-slideInUp" style={{animationDelay: '0.2s'}}>
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg transform group-hover:rotate-12 transition-transform duration-300">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Interviews</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">{stats.scheduledInterviews}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center">
              <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full animate-pulseGlow" style={{width: `${stats.totalApplications ? Math.min(100, Math.round((stats.scheduledInterviews / stats.totalApplications) * 100)) : (stats.scheduledInterviews ? 100 : 0)}%`}}></div>
            </div>
          </div>
        </div>

        <div className="group bg-white/80 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 animate-slideInUp" style={{animationDelay: '0.3s'}}>
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl shadow-lg transform group-hover:rotate-12 transition-transform duration-300">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Hired</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">{stats.hiredCandidates}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center">
              <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-yellow-500 to-orange-600 h-2 rounded-full animate-pulseGlow" style={{width: `${stats.totalApplications ? Math.min(100, Math.round((stats.hiredCandidates / stats.totalApplications) * 100)) : (stats.hiredCandidates ? 100 : 0)}%`}}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Jobs */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/30 animate-slideInUp" style={{animationDelay: '0.4s'}}>
          <div className="p-6 border-b border-gradient-to-r from-purple-100 to-blue-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Recent Job Postings 💼</h3>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigate('/recruiter/jobs')}
                  className="group px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 text-gray-700 rounded-lg hover:bg-white/30 hover:border-white/40 text-sm font-medium transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Load More
                </button>
                <button
                  onClick={() => navigate('/recruiter/post-job')}
                  className="group px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 text-sm font-medium transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl">
                  <Plus className="w-4 h-4 inline mr-1 group-hover:rotate-180 transition-transform duration-300" />
                  Post New Job
                </button>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentJobs.map((job, index) => {
                const statusConfig = getJobStatusConfig(job.status);
                return (
                  <div key={job.id} className="group flex items-center justify-between p-5 border border-gray-200/50 rounded-xl bg-gradient-to-r from-white/50 to-gray-50/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1" style={{animationDelay: `${0.5 + index * 0.1}s`}}>
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg transform group-hover:rotate-12 transition-transform duration-300">
                          <Briefcase className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 group-hover:text-purple-600 transition-colors duration-300">{job.title}</h4>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="flex items-center text-xs text-gray-500">
                            <MapPin className="w-3 h-3 mr-1" />
                            {job.location}
                          </span>
                          <span className="flex items-center text-xs text-gray-500">
                            <DollarSign className="w-3 h-3 mr-1" />
                            {job.salary}
                          </span>
                          <span className="flex items-center text-xs text-gray-500">
                            <Users className="w-3 h-3 mr-1" />
                            {job.applications} applications
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium shadow-sm ${statusConfig.color}`}>
                        {statusConfig.text}
                      </span>
                      <button className="text-gray-400 hover:text-purple-600 transform hover:scale-110 transition-all duration-300">
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Upcoming Interviews */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/30 animate-slideInUp" style={{animationDelay: '0.6s'}}>
          <div className="p-6 border-b border-gradient-to-r from-purple-100 to-blue-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Upcoming Interviews 📅</h3>
              <button
                onClick={() => navigate('/recruiter/schedule')}
                className="group px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 text-gray-700 rounded-lg hover:bg-white/30 hover:border-white/40 text-sm font-medium transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Load More
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {upcomingInterviews.map((interview, index) => (
                <div key={interview.id} className="group p-4 border border-gray-200/50 rounded-xl bg-gradient-to-r from-white/50 to-gray-50/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 animate-slideInRight" style={{animationDelay: `${0.7 + index * 0.1}s`}}>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-blue-500 rounded-full animate-pulseGlow"></div>
                    <h4 className="text-sm font-semibold text-gray-900 group-hover:text-purple-600 transition-colors duration-300">{interview.candidateName}</h4>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 ml-6">{interview.jobTitle}</p>
                  <div className="mt-3 ml-6 space-y-1">
                    <p className="text-xs text-gray-600 flex items-center">
                      <Calendar className="w-3 h-3 mr-2 text-purple-500" />
                      {interview.date} at {interview.time}
                    </p>
                    <div className="text-xs text-gray-600 flex items-center">
                      <div className="w-3 h-3 mr-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"></div>
                      {interview.type}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Applications */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/30 animate-slideInUp" style={{animationDelay: '0.8s'}}>
        <div className="p-6 border-b border-gradient-to-r from-purple-100 to-blue-100">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Recent Applications 📋</h3>
            <button
              onClick={() => navigate('/recruiter/applicants')}
              className="group px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 text-gray-700 rounded-lg hover:bg-white/30 hover:border-white/40 text-sm font-medium transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Load More
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {recentApplications.map((application, index) => {
              const statusConfig = getStatusConfig(application.status);
              return (
                <div key={application.id} className="group flex items-center justify-between p-5 border border-gray-200/50 rounded-xl bg-gradient-to-r from-white/50 to-gray-50/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 animate-slideInUp" style={{animationDelay: `${0.9 + index * 0.1}s`}}>
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 group-hover:text-purple-600 transition-colors duration-300">{application.candidateName}</h4>
                      <p className="text-sm text-gray-600">Applied for {application.jobTitle}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        {application.experience && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {application.experience} experience
                          </span>
                        )}
                        {typeof application.match === 'number' && (
                          <span className="flex items-center text-xs text-gray-500 bg-yellow-50 px-2 py-1 rounded-full">
                            <Star className="w-3 h-3 mr-1 text-yellow-400" />
                            {application.match}% match
                          </span>
                        )}
                        <span className="text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded-full">
                          Applied {application.appliedDate}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium shadow-sm ${statusConfig.color}`}>
                      {statusConfig.text}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
