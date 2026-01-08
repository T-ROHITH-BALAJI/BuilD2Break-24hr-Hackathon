import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import client from '../../api/client';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Calendar,
  MoreHorizontal,
  AlertCircle,
  CheckCircle,
  PauseCircle,
  RotateCcw,
  Download,
  Share2
} from 'lucide-react';

const Jobs = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [showJobModal, setShowJobModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [editJobData, setEditJobData] = useState({
    title: '',
    company: '',
    description: '',
    location: '',
    job_type: 'full-time',
    salary: '',
    requirements: '',
    benefits: '',
    deadline: ''
  });

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const res = await client.get('/api/recruiter/jobs/my');
        if (res.data?.success) {
          const mapped = res.data.jobs.map(j => ({
            id: j.job_id,
            title: j.title,
            company: j.company,
            location: j.location || 'Remote',
            type: j.job_type || 'full-time',
            salary: { min: Number(j.salary) || 0, max: Number(j.salary) || 0 },
            status: j.status || 'active',
            applications: Number(j.application_count) || 0,
            views: Number(j.views) || 0,
            postedDate: j.posted_at || j.created_at || null,
            deadline: j.deadline || null,
          }));
          setJobs(mapped);
          setFilteredJobs(mapped);
        } else {
          toast.error(res.data?.error || 'Failed to fetch jobs');
        }
      } catch (error) {
        toast.error('Failed to fetch jobs');
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  useEffect(() => {
    let filtered = jobs;

    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => job.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(job => job.type === typeFilter);
    }

    setFilteredJobs(filtered);
  }, [searchTerm, statusFilter, typeFilter, jobs]);

  const handleStatusChange = async (jobId, newStatus) => {
    try {
      await client.put(`/api/recruiter/jobs/${jobId}/status`, { status: newStatus });
      setJobs(prevJobs => prevJobs.map(job => job.id === jobId ? { ...job, status: newStatus } : job));
      setFilteredJobs(prevJobs => prevJobs.map(job => job.id === jobId ? { ...job, status: newStatus } : job));
      toast.success(`Job ${newStatus === 'active' ? 'activated' : newStatus}`);
    } catch (e) {
      toast.error('Failed to update job status');
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;
    try {
      await client.delete(`/api/recruiter/jobs/${jobId}`);
      setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
      setFilteredJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
      toast.success('Job deleted successfully');
    } catch (e) {
      toast.error('Failed to delete job');
    }
  };

  const handleViewJob = async (jobId) => {
    try {
      const res = await client.get(`/api/recruiter/jobs/${jobId}`);
      if (res.data?.success) {
        setSelectedJob(res.data.job);
        setShowJobModal(true);
      }
    } catch (error) {
      toast.error('Failed to load job details');
    }
  };

  const handleEditJob = (job) => {
    setSelectedJob(job);
    setEditJobData({
      title: job.title || '',
      company: job.company || '',
      description: job.description || '',
      location: job.location || '',
      job_type: job.type || 'full-time',
      salary: job.salary?.min || '',
      requirements: job.requirements || '',
      benefits: job.benefits || '',
      deadline: job.deadline ? new Date(job.deadline).toISOString().split('T')[0] : ''
    });
    setShowEditModal(true);
  };

  const handleUpdateJob = async () => {
    if (!selectedJob) return;

    try {
      await client.put(`/api/recruiter/jobs/${selectedJob.id}`, editJobData);
      toast.success('Job updated successfully');

      // Refresh jobs list
      const res = await client.get('/api/recruiter/jobs/my');
      if (res.data?.success) {
        const mapped = res.data.jobs.map(j => ({
          id: j.job_id,
          title: j.title,
          company: j.company,
          location: j.location || 'Remote',
          type: j.job_type || 'full-time',
          salary: { min: Number(j.salary) || 0, max: Number(j.salary) || 0 },
          status: j.status || 'active',
          applications: Number(j.application_count) || 0,
          views: Number(j.views) || 0,
          postedDate: j.posted_at || j.created_at || null,
          deadline: j.deadline || null,
        }));
        setJobs(mapped);
        setFilteredJobs(mapped);
      }

      setShowEditModal(false);
      setSelectedJob(null);
    } catch (error) {
      toast.error('Failed to update job');
    }
  };

  const handleBulkAction = (action) => {
    if (selectedJobs.length === 0) {
      toast.error('Please select jobs first');
      return;
    }

    switch (action) {
      case 'delete':
        if (window.confirm(`Are you sure you want to delete ${selectedJobs.length} job(s)?`)) {
          // Delete jobs from backend
          Promise.all(selectedJobs.map(jobId => client.delete(`/api/recruiter/jobs/${jobId}`)))
            .then(() => {
              setJobs(prevJobs => prevJobs.filter(job => !selectedJobs.includes(job.id)));
              setFilteredJobs(prevJobs => prevJobs.filter(job => !selectedJobs.includes(job.id)));
              setSelectedJobs([]);
              toast.success(`${selectedJobs.length} job(s) deleted`);
            })
            .catch(() => {
              toast.error('Failed to delete some jobs');
            });
        }
        break;
      case 'activate':
        // Update status to active for selected jobs
        Promise.all(selectedJobs.map(jobId => client.put(`/api/recruiter/jobs/${jobId}/status`, { status: 'active' })))
          .then(() => {
            setJobs(prevJobs =>
              prevJobs.map(job =>
                selectedJobs.includes(job.id) ? { ...job, status: 'active' } : job
              )
            );
            setFilteredJobs(prevJobs =>
              prevJobs.map(job =>
                selectedJobs.includes(job.id) ? { ...job, status: 'active' } : job
              )
            );
            setSelectedJobs([]);
            toast.success(`${selectedJobs.length} job(s) activated`);
          })
          .catch(() => {
            toast.error('Failed to activate some jobs');
          });
        break;
      case 'pause':
        // Update status to paused for selected jobs
        Promise.all(selectedJobs.map(jobId => client.put(`/api/recruiter/jobs/${jobId}/status`, { status: 'paused' })))
          .then(() => {
            setJobs(prevJobs =>
              prevJobs.map(job =>
                selectedJobs.includes(job.id) ? { ...job, status: 'paused' } : job
              )
            );
            setFilteredJobs(prevJobs =>
              prevJobs.map(job =>
                selectedJobs.includes(job.id) ? { ...job, status: 'paused' } : job
              )
            );
            setSelectedJobs([]);
            toast.success(`${selectedJobs.length} job(s) paused`);
          })
          .catch(() => {
            toast.error('Failed to pause some jobs');
          });
        break;
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      expired: 'bg-red-100 text-red-800',
      draft: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors.draft;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'paused':
        return <PauseCircle className="w-4 h-4" />;
      case 'expired':
        return <AlertCircle className="w-4 h-4" />;
      case 'draft':
        return <Edit className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RotateCcw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Listings</h1>
          <p className="text-gray-600">Manage all your job postings</p>
        </div>
        <button
          onClick={() => navigate('/recruiter/post-job')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          <Plus className="w-4 h-4 inline mr-2" />
          Post New Job
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Jobs</p>
              <p className="text-2xl font-bold text-green-600">
                {jobs.filter(job => job.status === 'active').length}
              </p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Applications</p>
              <p className="text-2xl font-bold text-blue-600">
                {jobs.reduce((sum, job) => sum + (Number(job.applications) || 0), 0)}
              </p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Views</p>
              <p className="text-2xl font-bold text-purple-600">
                {jobs.reduce((sum, job) => sum + (Number(job.views) || 0), 0)}
              </p>
            </div>
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <Eye className="w-4 h-4 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow border p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search jobs, companies, or locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="expired">Expired</option>
              <option value="draft">Draft</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedJobs.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-800">
                {selectedJobs.length} job(s) selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction('activate')}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  Activate
                </button>
                <button
                  onClick={() => handleBulkAction('pause')}
                  className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                >
                  Pause
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Jobs List */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedJobs.length === filteredJobs.length && filteredJobs.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedJobs(filteredJobs.map(job => job.id));
                      } else {
                        setSelectedJobs([]);
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applications
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Views
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Posted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredJobs.map((job) => (
                <tr
                  key={job.id}
                  className={`hover:bg-gray-50 ${selectedJobs.includes(job.id) ? 'bg-blue-50' : ''}`}
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedJobs.includes(job.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedJobs([...selectedJobs, job.id]);
                        } else {
                          setSelectedJobs(selectedJobs.filter(id => id !== job.id));
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{job.title}</div>
                      <div className="text-sm text-gray-500">{job.company}</div>
                      <div className="flex items-center mt-1 text-xs text-gray-500">
                        <MapPin className="w-3 h-3 mr-1" />
                        {job.location}
                        <Clock className="w-3 h-3 ml-2 mr-1" />
                        {job.type}
                        <DollarSign className="w-3 h-3 ml-2 mr-1" />
                        ${Number(job.salary.min).toLocaleString()} - ${Number(job.salary.max).toLocaleString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                      {getStatusIcon(job.status)}
                      <span className="ml-1 capitalize">{job.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{job.applications}</div>
                    <div className="text-xs text-gray-500">applications</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{job.views}</div>
                    <div className="text-xs text-gray-500">views</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {job.postedDate ? new Date(job.postedDate).toLocaleDateString() : '—'}
                    </div>
                    <div className="text-xs text-gray-500">
                      Deadline: {job.deadline ? new Date(job.deadline).toLocaleDateString() : '—'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewJob(job.id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditJob(job)}
                        className="text-green-600 hover:text-green-900"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleStatusChange(job.id, job.status === 'active' ? 'paused' : 'active')}
                        className="text-yellow-600 hover:text-yellow-900"
                        title={job.status === 'active' ? 'Pause' : 'Activate'}
                      >
                        {job.status === 'active' ? <PauseCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDeleteJob(job.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your search criteria'
                : 'Get started by posting your first job'}
            </p>
            {(!searchTerm && statusFilter === 'all' && typeFilter === 'all') && (
              <div className="mt-6">
                <button
                  onClick={() => navigate('/recruiter/post-job')}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Post New Job
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Job Details Modal */}
      {showJobModal && selectedJob && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/30 backdrop-blur-md border border-white/20 shadow-2xl rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Job Details</h3>
                <button
                  onClick={() => setShowJobModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">{selectedJob.title}</h4>
                  <p className="text-lg text-gray-700">{selectedJob.company}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center p-3 rounded-lg bg-white/40 border border-white/20">
                      <MapPin className="w-5 h-5 text-gray-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Location</p>
                        <p className="text-sm text-gray-700">{selectedJob.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center p-3 rounded-lg bg-white/40 border border-white/20">
                      <Clock className="w-5 h-5 text-gray-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Job Type</p>
                        <p className="text-sm text-gray-700 capitalize">{selectedJob.job_type}</p>
                      </div>
                    </div>
                    <div className="flex items-center p-3 rounded-lg bg-white/40 border border-white/20">
                      <DollarSign className="w-5 h-5 text-gray-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Salary</p>
                        <p className="text-sm text-gray-700">${Number(selectedJob.salary).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center p-3 rounded-lg bg-white/40 border border-white/20">
                      <CheckCircle className="w-5 h-5 text-gray-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Status</p>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedJob.status)}`}>
                          {getStatusIcon(selectedJob.status)}
                          <span className="ml-1 capitalize">{selectedJob.status}</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center p-3 rounded-lg bg-white/40 border border-white/20">
                      <Users className="w-5 h-5 text-gray-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Applications</p>
                        <p className="text-sm text-gray-700">{selectedJob.application_count}</p>
                      </div>
                    </div>
                    <div className="flex items-center p-3 rounded-lg bg-white/40 border border-white/20">
                      <Eye className="w-5 h-5 text-gray-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Views</p>
                        <p className="text-sm text-gray-700">{selectedJob.views}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedJob.description && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                    <div className="p-4 rounded-lg bg-white/40 border border-white/20">
                      <p className="text-gray-700 leading-relaxed">{selectedJob.description}</p>
                    </div>
                  </div>
                )}

                {selectedJob.requirements && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Requirements</h3>
                    <div className="p-4 rounded-lg bg-white/40 border border-white/20">
                      <p className="text-gray-700">{selectedJob.requirements}</p>
                    </div>
                  </div>
                )}

                {selectedJob.benefits && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Benefits</h3>
                    <div className="p-4 rounded-lg bg-white/40 border border-white/20">
                      <p className="text-gray-700">{selectedJob.benefits}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-white/20">
                  <div className="text-center p-3 rounded-lg bg-white/40 border border-white/20">
                    <p className="text-sm font-medium text-gray-900">Applications</p>
                    <p className="text-2xl font-bold text-blue-600">{selectedJob.application_count}</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-white/40 border border-white/20">
                    <p className="text-sm font-medium text-gray-900">Views</p>
                    <p className="text-2xl font-bold text-purple-600">{selectedJob.views}</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-white/40 border border-white/20">
                    <p className="text-sm font-medium text-gray-900">Posted</p>
                    <p className="text-sm text-gray-700">
                      {selectedJob.posted_at ? new Date(selectedJob.posted_at).toLocaleDateString() : '—'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-8 pt-6 border-t border-white/20">
                <button
                  onClick={() => setShowJobModal(false)}
                  className="px-6 py-2 bg-gradient-to-r from-gray-200 to-gray-100 text-gray-900 rounded-lg font-semibold shadow hover:scale-105 transition-transform"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Job Modal */}
      {showEditModal && selectedJob && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/30 backdrop-blur-md border border-white/20 shadow-2xl rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Edit Job</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Job Title</label>
                    <input
                      type="text"
                      value={editJobData.title}
                      onChange={(e) => setEditJobData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 bg-white/60 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white/80 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Company</label>
                    <input
                      type="text"
                      value={editJobData.company}
                      onChange={(e) => setEditJobData(prev => ({ ...prev, company: e.target.value }))}
                      className="w-full px-3 py-2 bg-white/60 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white/80 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Location</label>
                  <input
                    type="text"
                    value={editJobData.location}
                    onChange={(e) => setEditJobData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/60 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white/80 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Job Type</label>
                    <select
                      value={editJobData.job_type}
                      onChange={(e) => setEditJobData(prev => ({ ...prev, job_type: e.target.value }))}
                      className="w-full px-3 py-2 bg-white/60 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white/80 transition-all"
                    >
                      <option value="full-time">Full-time</option>
                      <option value="part-time">Part-time</option>
                      <option value="contract">Contract</option>
                      <option value="internship">Internship</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Salary</label>
                    <input
                      type="number"
                      value={editJobData.salary}
                      onChange={(e) => setEditJobData(prev => ({ ...prev, salary: e.target.value }))}
                      className="w-full px-3 py-2 bg-white/60 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white/80 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Description</label>
                  <textarea
                    value={editJobData.description}
                    onChange={(e) => setEditJobData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 bg-white/60 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white/80 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Requirements</label>
                  <textarea
                    value={editJobData.requirements}
                    onChange={(e) => setEditJobData(prev => ({ ...prev, requirements: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 bg-white/60 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white/80 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Benefits</label>
                  <textarea
                    value={editJobData.benefits}
                    onChange={(e) => setEditJobData(prev => ({ ...prev, benefits: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 bg-white/60 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white/80 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Application Deadline</label>
                  <input
                    type="date"
                    value={editJobData.deadline}
                    onChange={(e) => setEditJobData(prev => ({ ...prev, deadline: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/60 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white/80 transition-all"
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t border-white/20">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="px-6 py-2 bg-gradient-to-r from-gray-200 to-gray-100 text-gray-900 rounded-lg font-semibold shadow hover:scale-105 transition-transform"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateJob}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold shadow hover:scale-105 transition-transform"
                  >
                    Update Job
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Jobs;
