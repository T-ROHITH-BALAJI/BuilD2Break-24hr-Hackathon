import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Building2,
  TrendingUp,
} from 'lucide-react';

const Jobs = () => {
  const [jobs, setJobs] = useState([
    {
      id: 1,
      title: 'Senior Frontend Developer',
      company: 'TechCorp Inc.',
      location: 'San Francisco, CA',
      salary: '$120,000 - $150,000',
      type: 'Full-time',
      posted: '2 days ago',
      description: 'We are looking for a Senior Frontend Developer to join our dynamic team and build cutting-edge web applications that serve millions of users worldwide.',
      requirements: ['React', 'TypeScript', 'Node.js', 'GraphQL', 'AWS', 'Docker'],
      benefits: ['Health Insurance', 'Remote Work', '401k', 'Stock Options', 'Learning Budget'],
      saved: false,
      applied: false,
      match: 95,
      logo: '/api/placeholder/40/40',
      featured: true,
    },
    {
      id: 2,
      title: 'Full Stack Engineer',
      company: 'StartupXYZ',
      location: 'Remote',
      salary: '$90,000 - $120,000',
      type: 'Full-time',
      posted: '1 week ago',
      description: 'Join our fast-growing startup as a Full Stack Engineer and help us revolutionize the industry with innovative solutions.',
      requirements: ['JavaScript', 'Python', 'AWS', 'Docker', 'MongoDB', 'Redis'],
      benefits: ['Flexible Hours', 'Learning Budget', 'Remote Work', 'Equity Package'],
      saved: true,
      applied: false,
      match: 88,
      logo: '/api/placeholder/40/40',
      featured: false,
    },
    {
      id: 3,
      title: 'React Developer',
      company: 'Digital Solutions',
      location: 'New York, NY',
      salary: '$75,000 - $95,000',
      type: 'Contract',
      posted: '3 days ago',
      description: 'We need a skilled React Developer for a 6-month contract to build modern, responsive user interfaces.',
      requirements: ['React', 'Redux', 'CSS3', 'REST APIs', 'Git', 'Jest'],
      benefits: ['Competitive Rate', 'Flexible Schedule', 'Modern Tech Stack'],
      saved: false,
      applied: true,
      match: 82,
      logo: '/api/placeholder/40/40',
      featured: false,
    },
    {
      id: 4,
      title: 'UI/UX Designer & Developer',
      company: 'Creative Agency',
      location: 'Los Angeles, CA',
      salary: '$80,000 - $110,000',
      type: 'Full-time',
      posted: '5 days ago',
      description: 'Looking for a creative professional who can both design beautiful interfaces and implement them with modern web technologies.',
      requirements: ['Figma', 'React', 'Tailwind CSS', 'JavaScript', 'HTML5', 'CSS3'],
      benefits: ['Creative Environment', 'Design Tools Budget', 'Health Insurance', 'PTO'],
      saved: false,
      applied: false,
      match: 76,
      logo: '/api/placeholder/40/40',
      featured: true,
    },
  ]);

  const [filters, setFilters] = useState({
    searchTerm: '',
    location: '',
    jobType: '',
    salaryRange: '',
    experience: '',
  });

  const [showFilters, setShowFilters] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [showApplied, setShowApplied] = useState(false);
  const [hideSaved, setHideSaved] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    console.log('Searching with filters:', filters);
  };

  const toggleSaveJob = (jobId) => {
    setJobs(jobs.map(job =>
      job.id === jobId ? { ...job, saved: !job.saved } : job
    ));
  };

  const applyToJob = (jobId) => {
    setJobs(jobs.map(job =>
      job.id === jobId ? { ...job, applied: true } : job
    ));
  };

  const filteredJobs = (() => {
    let list = [...jobs];
    if (savedOnly) list = list.filter(j => j.saved);
    if (!showApplied) list = list.filter(j => !j.applied);
    if (hideSaved) list = list.filter(j => !j.saved);
    return list;
  })();

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
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {[
            { label: 'Total Jobs', value: filteredJobs.length, icon: Briefcase, color: 'purple' },
            { label: 'Saved Jobs', value: filteredJobs.filter(j => j.saved).length, icon: Bookmark, color: 'pink' },
            { label: 'Applied', value: jobs.filter(j => j.applied).length, icon: TrendingUp, color: 'blue' },
            { label: 'Featured', value: filteredJobs.filter(j => j.featured).length, icon: Star, color: 'green' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              className="card-glass text-center p-4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 * index }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                <stat.icon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </motion.div>
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
            onClick={() => setSavedOnly(!savedOnly)}
            className={`btn-glass px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${
              savedOnly
                ? 'ring-2 ring-purple-400 bg-gradient-to-r from-purple-50 to-pink-50'
                : 'hover:shadow-lg hover:scale-105'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            {savedOnly ? 'Show All Jobs' : 'Saved Jobs Only'}
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
              {savedOnly ? 'Your Saved Jobs' : 'Available Positions'}
            </h2>
            <p className="text-gray-600">
              {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
              {savedOnly && ' in your saved list'}
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
          {filteredJobs.map((job, index) => (
            <motion.div
              key={job.id}
              className="card-glass hover:shadow-xl group cursor-pointer relative overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.2 + index * 0.1 }}
              whileHover={{ y: -5, scale: 1.01 }}
            >
              {/* Featured Badge */}
              {job.featured && (
                <div className="absolute top-4 right-4 z-10">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
                    <Star className="w-3 h-3 mr-1" />
                    Featured
                  </span>
                </div>
              )}

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
                          <p className="text-lg font-medium text-gray-700">{job.company}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border border-purple-200">
                            <Star className="w-3 h-3 mr-1 text-purple-500" />
                            {job.match}% match
                          </span>
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
                          <button className="text-purple-600 hover:text-purple-700 font-medium text-sm transition-colors duration-200 flex items-center gap-1">
                            <Search className="w-4 h-4" />
                            View Details
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSaveJob(job.id);
                            }}
                            className="text-gray-500 hover:text-purple-600 font-medium text-sm transition-colors duration-200 flex items-center gap-1"
                          >
                            <Bookmark className="w-4 h-4" />
                            {job.saved ? "Unsave" : "Save for Later"}
                          </button>
                        </div>
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            applyToJob(job.id);
                          }}
                          disabled={job.applied}
                          className={`px-6 py-2 rounded-xl font-semibold text-sm transition-all duration-200 ${
                            job.applied
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'btn-primary hover-glow'
                          }`}
                          whileHover={job.applied ? {} : { scale: 1.05 }}
                          whileTap={job.applied ? {} : { scale: 0.95 }}
                        >
                          {job.applied ? '✅ Applied' : 'Apply Now'}
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
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.8 }}
        >
          <button
            className="btn-primary hover-glow px-8 py-3 text-lg font-semibold"
          >
            🔄 Load More Jobs
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Jobs;
