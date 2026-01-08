import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import client from '../../api/client';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  FileText,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  MapPin,
  DollarSign,
  Bell,
  BookOpen
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    appliedJobs: 0,
    interviewsScheduled: 0,
    profileViews: 0,
    resumeScore: 85,
  });
  const [profileViewCount, setProfileViewCount] = useState(0);

  const [recentApplications, setRecentApplications] = useState([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState([]);

  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobModal, setShowJobModal] = useState(false);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'interview':
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'applied':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'interview':
        return 'Interview Scheduled';
      case 'applied':
        return 'Application Submitted';
      case 'accepted':
        return 'Offer Received';
      case 'rejected':
        return 'Not Selected';
      default:
        return 'Unknown';
    }
  };

  useEffect(() => {
    let timer;
    const loadData = async () => {
      setLoading(true);
      try {
        const [appsRes, interviewsRes, jobsRes, resumeRes, statsRes] = await Promise.all([
          client.get('/api/jobseeker/applications'),
          client.get('/api/jobseeker/interviews'),
          client.get('/api/jobseeker/jobs'),
          client.get('/api/jobseeker/resume'),
          client.get('/api/jobseeker/stats')
        ]);

        // Load applications
        if (appsRes.data?.success) {
          const mapped = appsRes.data.applications.map(a => ({
            id: a.application_id,
            jobTitle: a.title,
            company: a.company,
            status: a.status || 'applied',
            appliedDate: new Date(a.applied_timestamp).toLocaleDateString(),
            salary: a.salary ? `$${Number(a.salary).toLocaleString()}` : '—',
            location: a.location || 'Remote'
          }));
          setRecentApplications(mapped);
        }

        // Load interviews
        if (interviewsRes.data?.success) {
          const mappedInt = interviewsRes.data.interviews.map(i => ({
            id: i.interview_id,
            jobTitle: i.job_title,
            company: i.company,
            date: i.schedule ? new Date(i.schedule).toLocaleDateString() : '',
            time: i.schedule ? new Date(i.schedule).toLocaleTimeString() : '',
            type: 'Interview'
          }));
          setUpcomingInterviews(mappedInt);
        }

        // Load recommended jobs (first 4 jobs)
        if (jobsRes.data?.success) {
const mappedJobs = jobsRes.data.jobs.slice(0, 4).map(j => ({
            id: j.job_id,
            title: j.title,
            company: j.company || '—',
            salary: j.salary ? `$${Number(j.salary).toLocaleString()}` : '—',
            location: j.location || 'Remote',
            description: j.job_description || ''
          }));
          setRecommendedJobs(mappedJobs);
        }

        // Resume score - calculate from actual resume data
        if (resumeRes.data?.success && resumeRes.data.resume) {
          const resume = resumeRes.data.resume;
          // Calculate completeness score based on resume data
          let completenessScore = 0;
          if (resume.statement_profile) completenessScore += 25;
          if (resume.experiences && resume.experiences.length > 0) completenessScore += 30;
          if (resume.education && resume.education.length > 0) completenessScore += 25;
          if (resume.skills && resume.skills.length > 0) completenessScore += 20;
          
          // Use stored score if exists, otherwise use calculated
          const finalScore = resume.scores ? Math.round(resume.scores) : completenessScore;
          setStats(prev => ({
            ...prev,
            resumeScore: finalScore || 0
          }));
        } else {
          // No resume = 0% score
          setStats(prev => ({
            ...prev,
            resumeScore: 0
          }));
        }

        // Live stats snapshot
        if (statsRes.data?.success) {
          setStats(prev => ({ ...prev, ...statsRes.data.stats }));
        }
      } catch (e) {
        console.error('Error loading dashboard data:', e);
      } finally {
        setLoading(false);
      }
    };
    const start = async () => {
      await loadData();
      timer = setInterval(loadData, 30000);
      const onFocus = () => loadData();
      window.addEventListener('focus', onFocus);
    };
    start();
    return () => {
      if (timer) clearInterval(timer);
      window.removeEventListener('focus', () => {});
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold mb-2 animate-fadeIn">Welcome back, {user?.name}! 🚀</h1>
            <p className="text-purple-100 mt-2 text-lg">
              Ready to find your next opportunity? Let's make today count!
            </p>
          </div>
          <div className="hidden md:block animate-slideInRight">
            <div className="relative">
              <div className="absolute inset-0 bg-white/10 rounded-full blur-xl"></div>
              <BookOpen className="relative w-20 h-20 text-white/80 animate-float" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="group bg-white/80 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 animate-slideInUp">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg transform group-hover:rotate-12 transition-transform duration-300">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Jobs Applied</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{stats.appliedJobs}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center">
              <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full animate-pulseGlow" style={{width: `${Math.min(100, Math.round((stats.appliedJobs / 10) * 100))}%`}}></div>
            </div>
          </div>
        </div>

        <div className="group bg-white/80 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 animate-slideInUp" style={{animationDelay: '0.1s'}}>
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg transform group-hover:rotate-12 transition-transform duration-300">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Interviews</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{stats.interviewsScheduled}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center">
              <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full animate-pulseGlow" style={{width: `${stats.appliedJobs ? Math.min(100, Math.round((stats.interviewsScheduled / stats.appliedJobs) * 100)) : (stats.interviewsScheduled ? 100 : 0)}%`}}></div>
            </div>
          </div>
        </div>

        <div className="group bg-white/80 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 animate-slideInUp" style={{animationDelay: '0.2s'}}>
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl shadow-lg transform group-hover:rotate-12 transition-transform duration-300">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Resume Score</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">{stats.resumeScore}%</p>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-yellow-500 to-orange-600 h-2 rounded-full animate-pulseGlow" style={{width: `${stats.resumeScore}%`}}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Applications */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Applications</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentApplications.map((application) => (
                <div key={application.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {getStatusIcon(application.status)}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{application.jobTitle}</h4>
                      <p className="text-sm text-gray-500">{application.company}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="flex items-center text-xs text-gray-500">
                          <DollarSign className="w-3 h-3 mr-1" />
                          {application.salary}
                        </span>
                        <span className="flex items-center text-xs text-gray-500">
                          <MapPin className="w-3 h-3 mr-1" />
                          {application.location}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {getStatusText(application.status)}
                    </p>
                    <p className="text-xs text-gray-500">{application.appliedDate}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming Interviews */}
        <div className="bg-white rounded-lg shadow border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Upcoming Interviews</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {upcomingInterviews.map((interview) => (
                <div key={interview.id} className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900">{interview.jobTitle}</h4>
                  <p className="text-sm text-gray-500">{interview.company}</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-gray-600">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      {interview.date} at {interview.time}
                    </p>
                    <p className="text-xs text-gray-600">{interview.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Jobs */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recommended Jobs</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendedJobs.map((job) => (
              <div key={job.id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{job.title}</h4>
                    <p className="text-sm text-gray-500">{job.company}</p>
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-gray-600">
                        <DollarSign className="w-3 h-3 inline mr-1" />
                        {job.salary}
                      </p>
                      <p className="text-xs text-gray-600">
                        <MapPin className="w-3 h-3 inline mr-1" />
                        {job.location}
                      </p>
                    </div>
                  </div>
                  <div className="ml-4">
{typeof job.match === 'number' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {job.match}% match
                      </span>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setSelectedJob(job);
                    setShowJobModal(true);
                  }}
                  className="mt-3 w-full bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Recommended Job Details Modal */}
      {showJobModal && selectedJob && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/30 backdrop-blur-md border border-white/20 shadow-2xl rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedJob.title}</h2>
                  <p className="text-lg text-gray-700 mb-4">{selectedJob.company}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {selectedJob.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      {selectedJob.salary}
                    </span>
                    {typeof selectedJob.match === 'number' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                        {selectedJob.match}% match
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => setShowJobModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
              </div>

              <div className="space-y-6">
                {selectedJob.description && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Job Description</h3>
                    <p className="text-gray-700 leading-relaxed">{selectedJob.description}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/20">
                <button
                  onClick={() => {
                    setShowJobModal(false);
                    navigate('/jobseeker/jobs');
                  }}
                  className="px-6 py-2 rounded-xl font-semibold bg-gray-200/80 text-gray-700 hover:bg-gray-300/80 backdrop-blur-sm border border-white/20"
                >
                  Open in Find Jobs
                </button>
                <button
                  onClick={() => setShowJobModal(false)}
                  className="px-8 py-2 rounded-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
  </div>
  );
};

export default Dashboard;
