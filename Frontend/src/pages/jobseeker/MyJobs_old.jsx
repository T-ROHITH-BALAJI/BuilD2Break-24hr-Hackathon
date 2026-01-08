import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  Building2,
  MapPin,
  DollarSign,
  Clock,
  Users,
  Briefcase,
  Search,
  Filter,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download
} from 'lucide-react';
import client from '../../api/client';
import toast from 'react-hot-toast';

const MyJobs = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    searchTerm: '',
    status: 'all'
  });

  const [activeTab, setActiveTab] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    interview: 0,
    rejected: 0,
    accepted: 0
  });

  useEffect(() => {
    fetchMyApplications();
  }, []);

  const fetchMyApplications = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await client.get('/api/jobseeker/applications');
      if (res.data?.success) {
        const apps = res.data.applications;
        setApplications(apps);
        
        // Calculate stats
        setStats({
          total: apps.length,
          pending: apps.filter(a => a.status === 'applied' || a.status === 'under_review').length,
          interview: apps.filter(a => a.status === 'interview').length,
          rejected: apps.filter(a => a.status === 'rejected').length,
          accepted: apps.filter(a => a.status === 'accepted' || a.status === 'offer').length
        });
      } else {
        setError(res.data?.error || 'Failed to load applications');
      }
    } catch (e) {
      setError('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'applied':
      case 'under_review':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'interview':
        return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'accepted':
      case 'offer':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'applied':
        return 'Applied';
      case 'under_review':
        return 'Under Review';
      case 'interview':
        return 'Interview Scheduled';
      case 'rejected':
        return 'Not Selected';
      case 'accepted':
        return 'Accepted';
      case 'offer':
        return 'Offer Received';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'applied':
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'interview':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'accepted':
      case 'offer':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = !filters.searchTerm || 
      app.title?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      app.company?.toLowerCase().includes(filters.searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (activeTab === 'pending') {
      matchesStatus = app.status === 'applied' || app.status === 'under_review';
    } else if (activeTab === 'interview') {
      matchesStatus = app.status === 'interview';
    } else if (activeTab === 'rejected') {
      matchesStatus = app.status === 'rejected';
    } else if (activeTab === 'accepted') {
      matchesStatus = app.status === 'accepted' || app.status === 'offer';
    }
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            🚀 My Jobs
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Manage your job postings, track applications, and control job visibility.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {[
            { label: 'Total Jobs', value: jobs.length, icon: Briefcase, color: 'purple' },
            { label: 'Active Jobs', value: jobs.filter(j => j.status === 'active').length, icon: Play, color: 'green' },
            { label: 'Paused Jobs', value: jobs.filter(j => j.status === 'paused').length, icon: Pause, color: 'yellow' },
            { label: 'Total Applications', value: jobs.reduce((sum, j) => sum + (j.application_count || 0), 0), icon: Users, color: 'blue' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              className="card-glass text-center p-4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 * index }}
              whileHover={{ scale: 1.05 }}
            >
              <div className={`w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-${stat.color}-100 to-${stat.color}-200 flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Action Bar */}
        <motion.div 
          className="flex flex-wrap justify-between items-center gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary hover-glow flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Post New Job
            </button>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-400" />
              <input
                type="text"
                placeholder="Search jobs..."
                value={filters.searchTerm}
                onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                className="input-glass pl-10"
              />
            </div>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="input-glass"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </select>
          </div>
        </motion.div>

        {/* Jobs List */}
        <div className="grid grid-cols-1 gap-6">
          {filteredJobs.map((job, index) => (
            <motion.div
              key={job.job_id}
              className="card-glass hover:shadow-xl group relative overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
              whileHover={{ y: -5, scale: 1.01 }}
            >
              {/* Status Badge */}
              <div className="absolute top-4 right-4 z-10">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  job.status === 'active' 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                }`}>
                  {job.status === 'active' ? (
                    <>
                      <Play className="w-3 h-3 mr-1" />
                      Active
                    </>
                  ) : (
                    <>
                      <Pause className="w-3 h-3 mr-1" />
                      Paused
                    </>
                  )}
                </span>
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4 flex-1">
                    <motion.div
                      className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center shadow-lg"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Building2 className="w-8 h-8 text-purple-600" />
                    </motion.div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors duration-200">
                            {job.title}
                          </h3>
                          <p className="text-lg font-medium text-gray-700">{job.company || 'Self-employed'}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                            <Users className="w-3 h-3 mr-1" />
                            {job.application_count || 0} applications
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-gray-600">
                        {job.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-purple-400" />
                            {job.location}
                          </span>
                        )}
                        {job.salary && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4 text-green-400" />
                            ${Number(job.salary).toLocaleString()}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4 text-blue-400" />
                          {job.job_type || 'Full-time'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-pink-400" />
                          {new Date(job.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-gray-700 mb-4 leading-relaxed">
                        {job.job_description}
                      </p>

                      {/* Skills */}
                      {job.skills_required && job.skills_required.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">Required Skills:</h4>
                          <div className="flex flex-wrap gap-2">
                            {job.skills_required.slice(0, 6).map((skill, skillIndex) => (
                              <span
                                key={skillIndex}
                                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border border-purple-200"
                              >
                                {skill}
                              </span>
                            ))}
                            {job.skills_required.length > 6 && (
                              <span className="text-xs text-gray-500 px-2 py-1">
                                +{job.skills_required.length - 6} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200/50">
                  <div className="flex space-x-4">
                    <button 
                      onClick={() => openEditModal(job)}
                      className="text-purple-600 hover:text-purple-700 font-medium text-sm transition-colors duration-200 flex items-center gap-1"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleStatus(job.job_id, job.status)}
                      className={`font-medium text-sm transition-colors duration-200 flex items-center gap-1 ${
                        job.status === 'active' 
                          ? 'text-yellow-600 hover:text-yellow-700' 
                          : 'text-green-600 hover:text-green-700'
                      }`}
                    >
                      {job.status === 'active' ? (
                        <>
                          <Pause className="w-4 h-4" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Resume
                        </>
                      )}
                    </button>
                  </div>
                  <button
                    onClick={() => handleDeleteJob(job.job_id)}
                    className="text-red-600 hover:text-red-700 font-medium text-sm transition-colors duration-200 flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredJobs.length === 0 && (
          <motion.div 
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.0 }}
          >
            <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No jobs found</h3>
            <p className="text-gray-500 mb-6">
              {jobs.length === 0 
                ? "You haven't posted any jobs yet. Create your first job posting!"
                : "No jobs match your current filters. Try adjusting your search criteria."
              }
            </p>
            {jobs.length === 0 && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary hover-glow"
              >
                <Plus className="w-4 h-4 mr-2" />
                Post Your First Job
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* Create Job Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div 
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Post New Job</h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleCreateJob} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Job Title *</label>
                      <input
                        type="text"
                        required
                        value={newJob.title}
                        onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                        className="input-glass w-full"
                        placeholder="e.g., Software Developer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                      <input
                        type="text"
                        value={newJob.company}
                        onChange={(e) => setNewJob({ ...newJob, company: e.target.value })}
                        className="input-glass w-full"
                        placeholder="e.g., Tech Corp"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Job Description *</label>
                    <textarea
                      required
                      rows={4}
                      value={newJob.job_description}
                      onChange={(e) => setNewJob({ ...newJob, job_description: e.target.value })}
                      className="input-glass w-full"
                      placeholder="Describe the role, responsibilities, and what you're looking for..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Salary</label>
                      <input
                        type="number"
                        value={newJob.salary}
                        onChange={(e) => setNewJob({ ...newJob, salary: e.target.value })}
                        className="input-glass w-full"
                        placeholder="e.g., 75000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Min Experience (years)</label>
                      <input
                        type="number"
                        value={newJob.min_experience}
                        onChange={(e) => setNewJob({ ...newJob, min_experience: e.target.value })}
                        className="input-glass w-full"
                        placeholder="e.g., 2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
                      <select
                        value={newJob.job_type}
                        onChange={(e) => setNewJob({ ...newJob, job_type: e.target.value })}
                        className="input-glass w-full"
                      >
                        <option value="full-time">Full-time</option>
                        <option value="part-time">Part-time</option>
                        <option value="contract">Contract</option>
                        <option value="internship">Internship</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <input
                      type="text"
                      value={newJob.location}
                      onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                      className="input-glass w-full"
                      placeholder="e.g., New York, NY or Remote"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Required Skills</label>
                    <input
                      type="text"
                      value={newJob.skills_required}
                      onChange={(e) => setNewJob({ ...newJob, skills_required: e.target.value })}
                      className="input-glass w-full"
                      placeholder="e.g., JavaScript, React, Node.js, Communication"
                    />
                    <p className="text-xs text-gray-500 mt-1">Separate skills with commas</p>
                  </div>

                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary hover-glow"
                    >
                      Post Job
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Job Modal */}
      <AnimatePresence>
        {showEditModal && editingJob && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div 
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Edit Job</h2>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleUpdateJob} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Job Title *</label>
                      <input
                        type="text"
                        required
                        value={editingJob.title}
                        onChange={(e) => setEditingJob({ ...editingJob, title: e.target.value })}
                        className="input-glass w-full"
                        placeholder="e.g., Software Developer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                      <input
                        type="text"
                        value={editingJob.company}
                        onChange={(e) => setEditingJob({ ...editingJob, company: e.target.value })}
                        className="input-glass w-full"
                        placeholder="e.g., Tech Corp"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Job Description *</label>
                    <textarea
                      required
                      rows={4}
                      value={editingJob.job_description}
                      onChange={(e) => setEditingJob({ ...editingJob, job_description: e.target.value })}
                      className="input-glass w-full"
                      placeholder="Describe the role, responsibilities, and what you're looking for..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Salary</label>
                      <input
                        type="number"
                        value={editingJob.salary}
                        onChange={(e) => setEditingJob({ ...editingJob, salary: e.target.value })}
                        className="input-glass w-full"
                        placeholder="e.g., 75000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Min Experience (years)</label>
                      <input
                        type="number"
                        value={editingJob.min_experience}
                        onChange={(e) => setEditingJob({ ...editingJob, min_experience: e.target.value })}
                        className="input-glass w-full"
                        placeholder="e.g., 2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
                      <select
                        value={editingJob.job_type}
                        onChange={(e) => setEditingJob({ ...editingJob, job_type: e.target.value })}
                        className="input-glass w-full"
                      >
                        <option value="full-time">Full-time</option>
                        <option value="part-time">Part-time</option>
                        <option value="contract">Contract</option>
                        <option value="internship">Internship</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <input
                      type="text"
                      value={editingJob.location}
                      onChange={(e) => setEditingJob({ ...editingJob, location: e.target.value })}
                      className="input-glass w-full"
                      placeholder="e.g., New York, NY or Remote"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Required Skills</label>
                    <input
                      type="text"
                      value={editingJob.skills_required}
                      onChange={(e) => setEditingJob({ ...editingJob, skills_required: e.target.value })}
                      className="input-glass w-full"
                      placeholder="e.g., JavaScript, React, Node.js, Communication"
                    />
                    <p className="text-xs text-gray-500 mt-1">Separate skills with commas</p>
                  </div>

                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary hover-glow"
                    >
                      Update Job
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MyJobs;
