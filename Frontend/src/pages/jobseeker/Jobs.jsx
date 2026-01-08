import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  DollarSign,
  Clock,
  Briefcase,
  Filter,
  Bookmark,
  BookmarkCheck,
  Star,
  TrendingUp,
} from 'lucide-react';
import client from '../../api/client';
import toast from 'react-hot-toast';
import Avatar from '../../components/Avatar';

const Jobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [allJobs, setAllJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    searchTerm: '',
    location: '',
    jobType: '',
    salaryRange: '',
    experience: '',
  });

  const [showFilters, setShowFilters] = useState(false);
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [appliedJobs, setAppliedJobs] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [showResumePicker, setShowResumePicker] = useState(false);
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState(null);
  const [viewFilter, setViewFilter] = useState('all'); // all | saved | featured
  const [showApplied, setShowApplied] = useState(false); // debug/recruiter toggle
  const [hideSaved, setHideSaved] = useState(false); // user cleanliness toggle
  const pageSize = 5;

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      setError('');
      try {
        const params = {};
        if (filters.searchTerm) params.search = filters.searchTerm;
        if (filters.experience) params.experience = filters.experience;
        if (filters.location) params.location = filters.location;
        if (filters.jobType) params.job_type = filters.jobType;
        if (filters.salaryRange) params.salary_range = filters.salaryRange;
        
const res = await client.get('/api/jobseeker/jobs', { params });
        if (res.data?.success) {
          // Map backend jobs to UI shape
          const mapped = res.data.jobs.map((j) => {
            const match = calculateMatchScore(j);
            return ({
              id: j.job_id,
              title: j.title,
              company: j.company || j.jobseeker_name || 'Self-employed',
              location: j.location || 'Remote',
              salary: j.salary ? `$${Number(j.salary).toLocaleString()}` : '—',
              type: j.job_type || 'Full-time',
              posted: new Date(j.created_at).toLocaleDateString(),
              description: j.job_description || '',
              requirements: Array.isArray(j.skills_required) ? j.skills_required : [],
              benefits: j.benefits || [],
              saved: savedJobs.has(j.job_id),
              applied: appliedJobs.has(j.job_id),
              match,
              // logo field removed - will use Avatar component
              featured: j.featured ?? (match >= 90),
              applicationCount: j.application_count || 0,
              postedBy: j.jobseeker_name ? 'Job Seeker' : 'Recruiter',
            });
          });
          setAllJobs(mapped);
          setJobs(mapped);
          console.log('Total jobs loaded:', mapped.length);
          console.log('Jobs with applied flag:', mapped.filter(j => j.applied).length);
        } else {
          setError(res.data?.error || 'Failed to load jobs');
        }
      } catch (e) {
        setError('Failed to load jobs');
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [filters.searchTerm, filters.location, filters.jobType, filters.salaryRange, filters.experience]);

  // Fetch saved jobs and applications
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch saved jobs
        const savedRes = await client.get('/api/jobseeker/jobs/saved');
        let savedJobIds = new Set();
        if (savedRes.data?.success) {
          savedJobIds = new Set(savedRes.data.jobs.map(j => j.job_id));
          setSavedJobs(savedJobIds);
        }

        // Fetch applications
        const appsRes = await client.get('/api/jobseeker/applications');
        let appliedJobIds = new Set();
        if (appsRes.data?.success) {
          appliedJobIds = new Set(appsRes.data.applications.map(a => a.job_id));
          setAppliedJobs(appliedJobIds);
          console.log('Applied job IDs:', Array.from(appliedJobIds));
          console.log('Applications data:', appsRes.data.applications);
        }

        // Sync flags onto current lists so UI updates immediately
        setAllJobs(prev => prev.map(j => ({
          ...j,
          saved: savedJobIds.has(j.id),
          applied: appliedJobIds.has(j.id)
        })));
        setJobs(prev => prev.map(j => ({
          ...j,
          saved: savedJobIds.has(j.id),
          applied: appliedJobIds.has(j.id)
        })));
        console.log('Jobs after sync - applied count:', appliedJobIds.size);

        // Fetch user resumes for resume picker
        try {
          const resumesRes = await client.get('/api/jobseeker/resumes');
          if (resumesRes.data?.success) {
            const list = resumesRes.data.resumes || [];
            setResumes(list);
            const primary = list.find(r => r.is_primary) || list[0];
            setSelectedResumeId(primary?.resume_id || null);
          }
        } catch (e) {
          // ignore if 404 (no profile) or no resumes
        }
      } catch (e) {
        console.error('Error fetching user data:', e);
      }
    };
    fetchUserData();
  }, []);

  // Keep job flags in sync if sets change later
  useEffect(() => {
    setAllJobs(prev => prev.map(j => ({
      ...j,
      saved: savedJobs.has(j.id),
      applied: appliedJobs.has(j.id)
    })));
    setJobs(prev => prev.map(j => ({
      ...j,
      saved: savedJobs.has(j.id),
      applied: appliedJobs.has(j.id)
    })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedJobs, appliedJobs]);

  // Calculate match score based on skills and requirements
  const calculateMatchScore = (job) => {
    // Simple match calculation - in real app, this would be more sophisticated
    return Math.floor(Math.random() * 30) + 70; // 70-100% match
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Reset to page 1 when searching
    setCurrentPage(1);
    // Force re-filter by triggering state update
    setFilters(prev => ({ ...prev }));
  };

  // Real-time search as user types
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.searchTerm, filters.location, filters.jobType, filters.salaryRange, filters.experience]);

  const toggleSaveJob = async (jobId) => {
    try {
      const res = await client.post(`/api/jobseeker/jobs/${jobId}/save`);
      if (res.data?.success) {
        const newSavedJobs = new Set(savedJobs);
        if (res.data.saved) {
          newSavedJobs.add(jobId);
        } else {
          newSavedJobs.delete(jobId);
        }
        setSavedJobs(newSavedJobs);
        setJobs(jobs.map(job => job.id === jobId ? { ...job, saved: res.data.saved } : job));
        setAllJobs(allJobs.map(job => job.id === jobId ? { ...job, saved: res.data.saved } : job));
      }
    } catch (e) {
      console.error('Error saving job:', e);
    }
  };

  const applyToJob = async (jobId, resumeIdOverride) => {
    try {
      const payload = {};
      if (resumeIdOverride) payload.resume_id = resumeIdOverride;
      const res = await client.post(`/api/jobseeker/jobs/${jobId}/apply`, payload);
      if (res.data?.success) {
        const newAppliedJobs = new Set(appliedJobs);
        newAppliedJobs.add(jobId);
        setAppliedJobs(newAppliedJobs);
        setJobs(jobs.map(job => job.id === jobId ? { ...job, applied: true } : job));
        setAllJobs(allJobs.map(job => job.id === jobId ? { ...job, applied: true } : job));
        toast.success('Application submitted successfully!');
      }
    } catch (e) {
      console.error('Error applying to job:', e);
      toast.error(e.response?.data?.error || e.message || 'Failed to apply for job');
    }
  };

  const loadMoreJobs = () => {
    if (hasMore) {
      setCurrentPage((p) => p + 1);
      const nextPageSize = (currentPage + 1) * pageSize;
      const totalVisible = Math.min(nextPageSize, filteredJobs.length);
      toast.success(`Loading more jobs... Showing ${totalVisible} of ${filteredJobs.length} jobs`);
    } else {
      toast.info('No more jobs to load');
    }
  };

  const viewJobDetails = (jobId) => {
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      setSelectedJob(job);
      setShowJobModal(true);
    }
  };

  // Derived lists
  const filteredByBasics = (() => {
    let filtered = [...allJobs];
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(searchLower) ||
        job.company.toLowerCase().includes(searchLower) ||
        job.description.toLowerCase().includes(searchLower) ||
        job.requirements.some(req => req.toLowerCase().includes(searchLower))
      );
    }
    if (filters.location) {
      const locationLower = filters.location.toLowerCase();
      filtered = filtered.filter(job => 
        job.location.toLowerCase().includes(locationLower) ||
        job.company.toLowerCase().includes(locationLower)
      );
    }
    if (filters.jobType) {
      filtered = filtered.filter(job => job.type.toLowerCase() === filters.jobType.toLowerCase());
    }
    if (filters.salaryRange) {
      const [min, max] = filters.salaryRange.split('-').map(s => s.replace(/[^0-9]/g, ''));
      filtered = filtered.filter(job => {
        const salary = parseInt(job.salary.replace(/[^0-9]/g, ''));
        if (max) return salary >= parseInt(min) && salary <= parseInt(max);
        return salary >= parseInt(min);
      });
    }
    return filtered;
  })();

  const filteredJobs = (() => {
    let list = [...filteredByBasics];
    // Respect the Show Applied toggle
    if (!showApplied) {
      list = list.filter(j => !appliedJobs.has(j.id));
    }
    if (hideSaved) list = list.filter(j => !j.saved);
    // View-specific filters
    if (viewFilter === 'saved') return list.filter(j => j.saved);
    if (viewFilter === 'featured') return list.filter(j => j.featured);
    return list;
  })();

  const visibleJobs = filteredJobs.slice(0, currentPage * pageSize);
  const hasMore = visibleJobs.length < filteredJobs.length;


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">Loading jobs...</div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>
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
          className="text-center mb-8"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            🚀 Find Your Dream Job
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover amazing opportunities that match your skills and advance your career with top companies.
          </p>
        </motion.div>

        {/* Quick Stats */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {[
            { key: 'saved', label: 'Saved Jobs', value: filteredJobs.filter(j => j.saved).length, icon: Bookmark, color: 'pink', onClick: () => setViewFilter('saved') },
            { key: 'applied', label: 'Applied', value: appliedJobs.size, icon: TrendingUp, color: 'blue', onClick: () => navigate('/jobseeker/applications') },
            { key: 'featured', label: 'Featured', value: filteredJobs.filter(j => j.featured).length, icon: Star, color: 'green', onClick: () => setViewFilter('featured') },
          ].map((stat, index) => (
            <motion.button
              type="button"
              key={stat.key}
              onClick={stat.onClick}
              className={`card-glass text-center p-4 ${viewFilter === stat.key ? 'ring-2 ring-purple-400' : ''}`}
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
            </motion.button>
          ))}
        </motion.div>

        {/* Action Buttons */}
        <motion.div 
          className="flex flex-wrap justify-center gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <button
            onClick={() => setViewFilter('all')}
            className={`btn-glass px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${
              viewFilter === 'all'
                ? 'ring-2 ring-purple-400 bg-gradient-to-r from-purple-50 to-pink-50'
                : 'hover:shadow-lg hover:scale-105'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            All Jobs
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-glass px-6 py-3 rounded-xl font-medium hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>

          {/* Toggles */}
          <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/60 border border-purple-100 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showApplied}
              onChange={(e) => setShowApplied(e.target.checked)}
            />
            <span className="text-sm text-gray-700">Show Applied</span>
          </label>
          <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/60 border border-purple-100 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hideSaved}
              onChange={(e) => setHideSaved(e.target.checked)}
            />
            <span className="text-sm text-gray-700">Hide Saved</span>
          </label>
        </motion.div>

        {/* Search Bar */}
        <motion.div 
          className="card-glass"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-400" />
                <input
                  type="text"
                  placeholder="Job title, skills, or company"
                  value={filters.searchTerm}
                  onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                  className="input-glass w-full pl-10"
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-pink-400" />
                <input
                  type="text"
                  placeholder="Location (Remote, City, State)"
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  className="input-glass w-full pl-10"
                />
              </div>
              <button
                type="submit"
                className="btn-primary hover-glow flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                Search Jobs
              </button>
            </div>

            {/* Advanced Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div 
                  className="pt-6 border-t border-gray-200/50"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <select
                      value={filters.jobType}
                      onChange={(e) => setFilters({ ...filters, jobType: e.target.value })}
                      className="input-glass"
                    >
                      <option value="">All Job Types</option>
                      <option value="full-time">Full-time</option>
                      <option value="part-time">Part-time</option>
                      <option value="contract">Contract</option>
                      <option value="internship">Internship</option>
                    </select>
                    <select
                      value={filters.salaryRange}
                      onChange={(e) => setFilters({ ...filters, salaryRange: e.target.value })}
                      className="input-glass"
                    >
                      <option value="">All Salary Ranges</option>
                      <option value="0-50k">$0 - $50,000</option>
                      <option value="50k-100k">$50,000 - $100,000</option>
                      <option value="100k-150k">$100,000 - $150,000</option>
                      <option value="150k+">$150,000+</option>
                    </select>
                    <select
                      value={filters.experience}
                      onChange={(e) => setFilters({ ...filters, experience: e.target.value })}
                      className="input-glass"
                    >
                      <option value="">All Experience Levels</option>
                      <option value="entry">Entry Level (0-2 years)</option>
                      <option value="mid">Mid Level (3-5 years)</option>
                      <option value="senior">Senior Level (5+ years)</option>
                      <option value="executive">Executive Level</option>
                    </select>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </motion.div>

        {/* Job Results Header */}
        <motion.div 
          className="flex items-center justify-between"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {viewFilter === 'saved' ? 'Your Saved Jobs' : viewFilter === 'featured' ? 'Featured Jobs' : 'Available Positions'}
            </h2>
            <p className="text-gray-600">
              {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
              {viewFilter === 'saved' && ' in your saved list'}
            </p>
          </div>
          <select className="input-glass min-w-[180px]">
            <option>Sort by Relevance</option>
            <option>Sort by Date</option>
            <option>Sort by Salary</option>
            <option>Sort by Match Score</option>
          </select>
        </motion.div>

        {/* Job Cards */}
        <div className="grid grid-cols-1 gap-6">
          {visibleJobs.map((job, index) => (
            <motion.div
              key={job.id}
              className="card-glass hover:shadow-xl group cursor-pointer relative overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.2 + index * 0.1 }}
              whileHover={{ y: -5, scale: 1.01 }}
            >
              {/* Featured Badge moved inline to avoid overlay */}

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4 flex-1">
                    <Avatar 
                      name={job.company} 
                      size="xl" 
                      className="shadow-lg"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors duration-200">
                            {job.title}
                          </h3>
                          <p className="text-lg font-medium text-gray-700">{job.company}</p>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            Posted by {job.postedBy}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border border-purple-200">
                            <Star className="w-3 h-3 mr-1 text-purple-500" />
                            {job.match}% match
                          </span>
                          {job.featured && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">
                              <Star className="w-3 h-3 mr-1" /> Featured
                            </span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSaveJob(job.id);
                            }}
                            className="p-2 hover:bg-white/40 rounded-lg transition-colors duration-200"
                            title={job.saved ? "Unsave" : "Save"}
                          >
                            {job.saved ? (
                              <BookmarkCheck className="w-5 h-5 text-purple-600" />
                            ) : (
                              <Bookmark className="w-5 h-5 text-gray-400 hover:text-purple-600" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-purple-400" />
                          {job.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-green-400" />
                          {job.salary}
                        </span>
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4 text-blue-400" />
                          {job.type}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-pink-400" />
                          {job.posted}
                        </span>
                      </div>

                      <p className="text-gray-700 mb-4 leading-relaxed">
                        {job.description}
                      </p>

                      {/* Skills & Requirements */}
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Required Skills:</h4>
                        <div className="flex flex-wrap gap-2">
                          {job.requirements.slice(0, 6).map((req, reqIndex) => (
                            <motion.span
                              key={reqIndex}
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border border-purple-200 hover:shadow-md transition-all duration-200"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.2, delay: reqIndex * 0.05 }}
                              whileHover={{ scale: 1.05 }}
                            >
                              {req}
                            </motion.span>
                          ))}
                          {job.requirements.length > 6 && (
                            <span className="text-xs text-gray-500 px-2 py-1">
                              +{job.requirements.length - 6} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Benefits */}
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Benefits:</h4>
                        <div className="flex flex-wrap gap-2">
                          {job.benefits.slice(0, 4).map((benefit, benefitIndex) => (
                            <span
                              key={benefitIndex}
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200"
                            >
                              {benefit}
                            </span>
                          ))}
                          {job.benefits.length > 4 && (
                            <span className="text-xs text-gray-500 px-2 py-1">
                              +{job.benefits.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>

        {/* Action Buttons */}
                      <div className="flex items-center justify-between">
                        <div className="flex space-x-4">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              viewJobDetails(job.id);
                            }}
                            className="text-purple-600 hover:text-purple-700 font-medium text-sm transition-colors duration-200 flex items-center gap-1"
                          >
                            <Search className="w-4 h-4" />
                            View Details
                          </button>
                        </div>
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedJob(job);
                            setShowResumePicker(true);
                          }}
                          disabled={appliedJobs.has(job.id)}
                          className={`px-6 py-2 rounded-xl font-semibold text-sm transition-all duration-200 ${
                            appliedJobs.has(job.id)
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'btn-primary hover-glow'
                          }`}
                          whileHover={appliedJobs.has(job.id) ? {} : { scale: 1.05 }}
                          whileTap={appliedJobs.has(job.id) ? {} : { scale: 0.95 }}
                        >
                          {appliedJobs.has(job.id) ? '✅ Applied' : 'Apply Now'}
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Load More Button */}
        {hasMore && (
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.8 }}
        >
          <button
              onClick={loadMoreJobs}
            className="btn-primary hover-glow px-8 py-3 text-lg font-semibold"
          >
            🔄 Load More Jobs
          </button>
        </motion.div>
        )}
      </div>

      {/* Job Details Modal */}
      {showJobModal && selectedJob && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/30 backdrop-blur-md border border-white/20 shadow-2xl rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">{selectedJob.title}</h2>
                  <p className="text-xl text-gray-700 mb-4">{selectedJob.company}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {selectedJob.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      {selectedJob.salary}
                    </span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      {selectedJob.type}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {selectedJob.posted}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowJobModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Job Description</h3>
                  <p className="text-gray-700 leading-relaxed">{selectedJob.description}</p>
                </div>

                {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Required Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedJob.requirements.map((req, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-purple-100/80 text-purple-800 rounded-full text-sm font-medium border border-purple-200/50"
                        >
                          {req}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedJob.benefits && selectedJob.benefits.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Benefits</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedJob.benefits.map((benefit, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-green-100/80 text-green-800 rounded-full text-sm font-medium border border-green-200/50"
                        >
                          {benefit}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/20">
                <div className="flex gap-3">
                  <button
                    onClick={() => toggleSaveJob(selectedJob.id)}
                    className={`px-6 py-2 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 ${
                      selectedJob.saved
                        ? 'bg-purple-100/80 text-purple-700 hover:bg-purple-200/80 border border-purple-200/50'
                        : 'bg-gray-200/80 text-gray-700 hover:bg-gray-300/80 border border-white/20'
                    }`}
                  >
                    {selectedJob.saved ? (
                      <BookmarkCheck className="w-4 h-4" />
                    ) : (
                      <Bookmark className="w-4 h-4" />
                    )}
                    {selectedJob.saved ? 'Saved' : 'Save for Later'}
                  </button>
                </div>
                <button
                  onClick={() => {
                    setShowJobModal(false);
                    setShowResumePicker(true);
                    setSelectedJob(selectedJob);
                  }}
                  disabled={appliedJobs.has(selectedJob.id)}
                  className={`px-8 py-3 rounded-xl font-semibold transition-all duration-200 ${
                    appliedJobs.has(selectedJob.id)
                      ? 'bg-gray-100/80 text-gray-400 cursor-not-allowed border border-white/20'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                  }`}
                >
                  {appliedJobs.has(selectedJob.id) ? '✅ Applied' : 'Apply Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resume Picker Modal */}
      {showResumePicker && selectedJob && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/90 backdrop-blur-md border border-white/30 shadow-2xl rounded-2xl max-w-lg w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Choose a resume</h3>
                <button onClick={() => setShowResumePicker(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
              </div>
              {resumes.length === 0 ? (
                <div className="text-gray-600 text-sm">No resumes found. Please upload or build a resume first.</div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {resumes.map(r => (
                    <label key={r.resume_id} className={`flex items-center justify-between p-3 rounded-xl border ${selectedResumeId === r.resume_id ? 'border-purple-400 bg-purple-50' : 'border-gray-200'}`}>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{r.title || r.file_name || 'Untitled Resume'}</span>
                        <span className="text-xs text-gray-500">{r.type} {r.is_primary ? '(Primary)' : ''}</span>
                      </div>
                      <input
                        type="radio"
                        name="resume"
                        checked={selectedResumeId === r.resume_id}
                        onChange={() => setSelectedResumeId(r.resume_id)}
                      />
                    </label>
                  ))}
                </div>
              )}
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowResumePicker(false)} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700">Cancel</button>
                <button
                  disabled={!selectedResumeId}
                  onClick={async () => {
                    if (!selectedResumeId) return;
                    await applyToJob(selectedJob.id, selectedResumeId);
                    setShowResumePicker(false);
                  }}
                  className={`px-5 py-2 rounded-lg ${selectedResumeId ? 'btn-primary hover-glow' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                >
                  Submit Application
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Jobs;