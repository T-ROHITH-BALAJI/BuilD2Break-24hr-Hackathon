import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import {
  Search,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  MessageSquare,
  Download,
  MapPin,
  DollarSign,
  Building,
  X
} from 'lucide-react';

// Glassmorphism utility classes
const glass = "bg-white/30 backdrop-blur-md border border-white/20 shadow-lg";

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    status: '',
    company: '',
    dateRange: '',
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load applications from backend
  useEffect(() => {
    const loadApplications = async () => {
      setLoading(true);
      try {
        const res = await client.get('/api/jobseeker/applications');
        if (res.data?.success) {
          const mapped = res.data.applications.map(a => {
            // Normalize status - treat null, undefined, empty string as 'applied'
            const normalizedStatus = (a.status && a.status.trim()) ? a.status.trim().toLowerCase() : 'applied';
            return {
              id: a.application_id,
              jobTitle: a.title,
              company: a.company,
              location: a.location || 'Remote',
              salary: a.salary ? `$${Number(a.salary).toLocaleString()}` : '—',
              appliedDate: new Date(a.applied_timestamp).toLocaleDateString(),
              status: normalizedStatus,
              stage: getStageFromStatus(normalizedStatus),
              nextAction: getNextActionFromStatus(normalizedStatus),
              recruiterName: a.recruiter_name || 'Not assigned',
              notes: a.notes || 'No notes available',
              logo: '/api/placeholder/40/40',
            };
          });
          setApplications(mapped);
        }
      } catch (e) {
        console.error('Error loading applications:', e);
      } finally {
        setLoading(false);
      }
    };
    loadApplications();
  }, []);

  const getStageFromStatus = (status) => {
    switch (status) {
      case 'applied': return 'Application Submitted';
      case 'shortlisted': return 'Shortlisted';
      case 'under_review': return 'Application Review';
      case 'interview': return 'Interview Scheduled';
      case 'offer': return 'Offer Extended';
      case 'rejected': return 'Application Review';
      default: return 'Application Submitted';
    }
  };

  const getNextActionFromStatus = (status) => {
    switch (status) {
      case 'applied': return 'Waiting for initial screening';
      case 'shortlisted': return 'You have been shortlisted!';
      case 'under_review': return 'Application under review';
      case 'interview': return 'Interview scheduled';
      case 'offer': return 'Respond to offer';
      case 'rejected': return 'Application not selected';
      default: return 'Waiting for update';
    }
  };

  // Unique, elegant status colors (not blue)
  const getStatusConfig = (status) => {
    switch (status) {
      case 'applied':
        return {
          color: 'bg-gradient-to-r from-fuchsia-100 to-pink-100 text-fuchsia-700',
          icon: <Clock className="w-4 h-4" />,
          text: 'Applied'
        };
      case 'shortlisted':
        return {
          color: 'bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700',
          icon: <CheckCircle className="w-4 h-4" />,
          text: 'Shortlisted'
        };
      case 'under_review':
        return {
          color: 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700',
          icon: <AlertCircle className="w-4 h-4" />,
          text: 'Under Review'
        };
      case 'interview':
        return {
          color: 'bg-gradient-to-r from-cyan-100 to-teal-100 text-cyan-700',
          icon: <Calendar className="w-4 h-4" />,
          text: 'Interview'
        };
      case 'offer':
        return {
          color: 'bg-gradient-to-r from-lime-100 to-emerald-100 text-emerald-700',
          icon: <CheckCircle className="w-4 h-4" />,
          text: 'Offer Received'
        };
      case 'rejected':
        return {
          color: 'bg-gradient-to-r from-rose-100 to-red-100 text-rose-700',
          icon: <XCircle className="w-4 h-4" />,
          text: 'Not Selected'
        };
      default:
        return {
          color: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700',
          icon: <Clock className="w-4 h-4" />,
          text: 'Unknown'
        };
    }
  };

  const getStatusCounts = () => {
    return {
      total: applications.length,
      applied: applications.filter(app => app.status === 'applied' || app.status === 'shortlisted').length,
      under_review: applications.filter(app => app.status === 'under_review').length,
      interview: applications.filter(app => app.status === 'interview').length,
      offer: applications.filter(app => app.status === 'offer').length,
      rejected: applications.filter(app => app.status === 'rejected').length,
    };
  };

  const statusCounts = getStatusCounts();

  const filteredApplications = applications.filter(app => {
    const searchValue = searchTerm || '';
    const matchesSearch = searchValue === '' ||
                         app.jobTitle.toLowerCase().includes(searchValue.toLowerCase()) ||
                         app.company.toLowerCase().includes(searchValue.toLowerCase());
    // Handle filter matching - include shortlisted in both 'applied' and 'under_review' filters
    let matchesStatus = filters.status === '';
    if (!matchesStatus) {
      if (filters.status === 'applied') {
        matchesStatus = app.status === 'applied' || app.status === 'shortlisted';
      } else if (filters.status === 'under_review') {
        matchesStatus = app.status === 'under_review' || app.status === 'shortlisted';
      } else {
        matchesStatus = app.status === filters.status;
      }
    }
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        minHeight: '100vh'
      }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your applications...</p>
        </div>
      </div>
    );
  }

  // Animated gradient background for the whole page
  return (
    <div className="min-h-screen py-10 px-2 md:px-8" style={{
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      minHeight: '100vh'
    }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight drop-shadow-lg">My Applications</h1>
          <p className="text-gray-700 font-medium">Track and manage your job applications</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        {[
          { label: 'Total', value: statusCounts.total, color: 'from-gray-100 to-gray-200 text-gray-900' },
          { label: 'Applied', value: statusCounts.applied, color: 'from-fuchsia-100 to-pink-100 text-fuchsia-700' },
          { label: 'Review', value: statusCounts.under_review, color: 'from-amber-100 to-orange-100 text-amber-700' },
          { label: 'Interview', value: statusCounts.interview, color: 'from-cyan-100 to-teal-100 text-cyan-700' },
          { label: 'Offers', value: statusCounts.offer, color: 'from-lime-100 to-emerald-100 text-emerald-700' },
          { label: 'Rejected', value: statusCounts.rejected, color: 'from-rose-100 to-red-100 text-rose-700' },
        ].map((stat, idx) => (
          <div
            key={stat.label}
            className={`rounded-xl p-4 border border-white/30 shadow-lg ${glass} bg-gradient-to-br ${stat.color} transition-all duration-300 hover:scale-105`}
            style={{ animation: `fadeInUp 0.5s ${idx * 0.08 + 0.1}s both` }}
          >
            <div className="text-center">
              <p className="text-2xl font-extrabold">{stat.value}</p>
              <p className="text-sm font-medium">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className={`${glass} p-6 rounded-xl mb-8 border border-white/30 shadow-lg`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs or companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 w-full p-3 border-none rounded-lg bg-white/60 focus:ring-2 focus:ring-fuchsia-400 focus:bg-white/80 transition"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="p-3 border-none rounded-lg bg-white/60 focus:ring-2 focus:ring-fuchsia-400 focus:bg-white/80 transition"
          >
            <option value="">All Statuses</option>
            <option value="applied">Applied</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="under_review">Under Review</option>
            <option value="interview">Interview</option>
            <option value="offer">Offer Received</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={filters.dateRange}
            onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
            className="p-3 border-none rounded-lg bg-white/60 focus:ring-2 focus:ring-fuchsia-400 focus:bg-white/80 transition"
          >
            <option value="">All Time</option>
            <option value="last_week">Last Week</option>
            <option value="last_month">Last Month</option>
            <option value="last_3_months">Last 3 Months</option>
          </select>
          {/* Removed More Filters button */}
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-6">
        {filteredApplications.map((application, idx) => {
          const statusConfig = getStatusConfig(application.status);

          return (
            <div
              key={application.id}
              className={`${glass} rounded-2xl border border-white/30 shadow-xl hover:shadow-2xl transition-shadow duration-300 group relative overflow-hidden`}
              style={{
                animation: `fadeInUp 0.6s ${idx * 0.08 + 0.2}s both`
              }}
            >
              {/* Subtle animated gradient overlay */}
              <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: 'linear-gradient(120deg, rgba(255,255,255,0.15) 0%, rgba(236,72,153,0.08) 100%)'
                }}
              />
              <div className="p-6 relative z-10">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <img
                      src={application.logo}
                      alt={`${application.company} logo`}
                      className="w-14 h-14 rounded-xl border border-white/40 bg-white/40 shadow"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{application.jobTitle}</h3>
                          <p className="text-gray-700 font-medium">{application.company}</p>
                        </div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow ${statusConfig.color} bg-opacity-80`}>
                          {statusConfig.icon}
                          <span className="ml-1">{statusConfig.text}</span>
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                        <span className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {application.location}
                        </span>
                        <span className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1" />
                          {application.salary}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          Applied {application.appliedDate}
                        </span>
                      </div>

                      <div className="mt-4 p-4 rounded-xl bg-white/40 border border-white/20 shadow-inner grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Current Stage</p>
                          <p className="text-sm text-gray-700">{application.stage}</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Next Action</p>
                          <p className="text-sm text-gray-700">{application.nextAction}</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Recruiter</p>
                          <p className="text-sm text-gray-700">{application.recruiterName}</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Notes</p>
                          <p className="text-sm text-gray-700">{application.notes}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex space-x-2">
                          <button
                            className="text-fuchsia-700 hover:text-fuchsia-900 font-semibold text-sm transition-transform hover:scale-105"
                            onClick={() => {
                              setSelectedApplication(application);
                              setIsModalOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4 inline mr-1" />
                            View Details
                          </button>
                          <button className="text-cyan-700 hover:text-cyan-900 font-semibold text-sm transition-transform hover:scale-105">
                            <MessageSquare className="w-4 h-4 inline mr-1" />
                            Message Recruiter
                          </button>
                        </div>
                        <div className="flex space-x-2">
                          {application.status === 'offer' && (
                            <>
                              <button className="px-4 py-2 bg-gradient-to-r from-emerald-400 to-lime-400 text-white rounded-lg font-semibold text-sm shadow hover:scale-105 transition-transform">
                                Accept Offer
                              </button>
                              <button className="px-4 py-2 bg-gradient-to-r from-gray-200 to-gray-100 text-gray-900 rounded-lg font-semibold text-sm shadow hover:scale-105 transition-transform">
                                Negotiate
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredApplications.length === 0 && (
        <div className={`${glass} text-center py-16 rounded-2xl border border-white/30 shadow-xl mt-10`}>
          <Building className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-bounce" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No applications found</h3>
          <p className="text-gray-700 mb-6">
            {(searchTerm && searchTerm.trim() !== '') || filters.status
              ? 'Try adjusting your search criteria or filters'
              : 'Start applying to jobs to see your applications here'
            }
          </p>
          <button className="px-5 py-2.5 bg-gradient-to-r from-fuchsia-400 to-pink-400 text-white rounded-xl font-semibold shadow hover:scale-105 transition-transform">
            Browse Jobs
          </button>
        </div>
      )}

      {/* Application Details Modal */}
      {isModalOpen && selectedApplication && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`${glass} w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/30 shadow-2xl`}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/20">
              <div className="flex items-center space-x-4">
                <img
                  src={selectedApplication.logo}
                  alt={`${selectedApplication.company} logo`}
                  className="w-12 h-12 rounded-xl border border-white/40 bg-white/40 shadow"
                />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedApplication.jobTitle}</h2>
                  <p className="text-gray-700 font-medium">{selectedApplication.company}</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Status Badge */}
              <div className="flex justify-center">
                {(() => {
                  const statusConfig = getStatusConfig(selectedApplication.status);
                  return (
                    <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold shadow ${statusConfig.color} bg-opacity-90`}>
                      {statusConfig.icon}
                      <span className="ml-2">{statusConfig.text}</span>
                    </span>
                  );
                })()}
              </div>

              {/* Application Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Application Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center p-3 rounded-lg bg-white/40 border border-white/20">
                        <MapPin className="w-5 h-5 text-gray-600 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Location</p>
                          <p className="text-sm text-gray-700">{selectedApplication.location}</p>
                        </div>
                      </div>
                      <div className="flex items-center p-3 rounded-lg bg-white/40 border border-white/20">
                        <DollarSign className="w-5 h-5 text-gray-600 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Salary</p>
                          <p className="text-sm text-gray-700">{selectedApplication.salary}</p>
                        </div>
                      </div>
                      <div className="flex items-center p-3 rounded-lg bg-white/40 border border-white/20">
                        <Calendar className="w-5 h-5 text-gray-600 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Applied Date</p>
                          <p className="text-sm text-gray-700">{selectedApplication.appliedDate}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Application Status</h3>
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-white/40 border border-white/20">
                        <p className="text-sm font-medium text-gray-900">Current Stage</p>
                        <p className="text-sm text-gray-700">{selectedApplication.stage}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-white/40 border border-white/20">
                        <p className="text-sm font-medium text-gray-900">Next Action</p>
                        <p className="text-sm text-gray-700">{selectedApplication.nextAction}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-white/40 border border-white/20">
                        <p className="text-sm font-medium text-gray-900">Recruiter</p>
                        <p className="text-sm text-gray-700">{selectedApplication.recruiterName}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes</h3>
                <div className="p-4 rounded-lg bg-white/40 border border-white/20 min-h-[80px]">
                  <p className="text-sm text-gray-700">{selectedApplication.notes}</p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end p-6 border-t border-white/20">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 bg-gradient-to-r from-gray-200 to-gray-100 text-gray-900 rounded-lg font-semibold shadow hover:scale-105 transition-transform"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px);}
          to { opacity: 1; transform: none;}
        }
      `}</style>
    </div>
  );
};

export default Applications;