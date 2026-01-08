import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  Building2,
  MapPin,
  DollarSign,
  Clock,
  Briefcase,
  Search,
  Filter,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  TrendingUp,
  FileText,
  MessageSquare
} from 'lucide-react';
import client from '../../api/client';
import toast from 'react-hot-toast';
import Avatar from '../../components/Avatar';

const MyJobs = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
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
        toast.success('Applications loaded successfully');
      }
    } catch (e) {
      console.error('Error loading applications:', e);
      toast.error('Failed to load applications');
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
    const matchesSearch = !searchTerm || 
      app.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.company?.toLowerCase().includes(searchTerm.toLowerCase());
    
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

  const handleViewDetails = (application) => {
    setSelectedApplication(application);
    setShowDetailsModal(true);
  };

  const tabs = [
    { id: 'all', label: 'All Applications', count: stats.total, icon: <Briefcase className="w-4 h-4" /> },
    { id: 'pending', label: 'Pending', count: stats.pending, icon: <Clock className="w-4 h-4" /> },
    { id: 'interview', label: 'Interview', count: stats.interview, icon: <Calendar className="w-4 h-4" /> },
    { id: 'accepted', label: 'Accepted', count: stats.accepted, icon: <CheckCircle className="w-4 h-4" /> },
    { id: 'rejected', label: 'Rejected', count: stats.rejected, icon: <XCircle className="w-4 h-4" /> }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your applications...</p>
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
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            My Job Applications
          </h1>
          <p className="text-gray-600 text-lg">Track and manage all your job applications in one place</p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {tabs.map((tab, index) => (
            <motion.div
              key={tab.id}
              whileHover={{ scale: 1.05, y: -5 }}
              className={`cursor-pointer p-4 rounded-xl shadow-lg transition-all duration-300 ${
                activeTab === tab.id 
                  ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white' 
                  : 'bg-white/80 backdrop-blur-md hover:shadow-xl'
              }`}
              onClick={() => setActiveTab(tab.id)}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
            >
              <div className="flex items-center justify-between mb-2">
                {tab.icon}
                <span className={`text-2xl font-bold ${activeTab === tab.id ? 'text-white' : 'text-gray-900'}`}>
                  {tab.count}
                </span>
              </div>
              <p className={`text-sm font-medium ${activeTab === tab.id ? 'text-white/90' : 'text-gray-600'}`}>
                {tab.label}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Search Bar */}
        <motion.div 
          className="flex items-center gap-4 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-400" />
            <input
              type="text"
              placeholder="Search by job title or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/80 backdrop-blur-md border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>
          <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export
          </button>
        </motion.div>

        {/* Applications List */}
        <div className="grid grid-cols-1 gap-6">
          {filteredApplications.map((application, index) => (
            <motion.div
              key={application.application_id}
              className="bg-white/80 backdrop-blur-md rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4 flex-1">
                    <Avatar 
                      name={application.company} 
                      size="xl" 
                      className="shadow-lg"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 hover:text-purple-600 transition-colors">
                            {application.title}
                          </h3>
                          <p className="text-lg font-medium text-gray-700">{application.company}</p>
                        </div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(application.status)}`}>
                          {getStatusIcon(application.status)}
                          <span className="ml-2">{getStatusText(application.status)}</span>
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-gray-600">
                        {application.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-purple-400" />
                            {application.location}
                          </span>
                        )}
                        {application.salary && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4 text-green-400" />
                            {application.salary}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-blue-400" />
                          Applied on {application.appliedDate || new Date(application.applied_timestamp).toLocaleDateString()}
                        </span>
                      </div>

                      {application.job_description && (
                        <p className="text-gray-700 line-clamp-2 mb-4">
                          {application.job_description}
                        </p>
                      )}

                      {/* Progress Indicator */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                          <span>Application Progress</span>
                          <span>{application.status === 'rejected' ? 'Process Ended' : 'In Progress'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className={`flex-1 h-2 rounded-full ${
                            ['applied', 'under_review', 'interview', 'accepted', 'offer'].includes(application.status) 
                              ? 'bg-purple-500' : 'bg-gray-200'
                          }`}></div>
                          <div className={`flex-1 h-2 rounded-full ${
                            ['under_review', 'interview', 'accepted', 'offer'].includes(application.status) 
                              ? 'bg-purple-500' : 'bg-gray-200'
                          }`}></div>
                          <div className={`flex-1 h-2 rounded-full ${
                            ['interview', 'accepted', 'offer'].includes(application.status) 
                              ? 'bg-purple-500' : 'bg-gray-200'
                          }`}></div>
                          <div className={`flex-1 h-2 rounded-full ${
                            ['accepted', 'offer'].includes(application.status) 
                              ? 'bg-green-500' : application.status === 'rejected' ? 'bg-red-500' : 'bg-gray-200'
                          }`}></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex space-x-4">
                          <button 
                            onClick={() => handleViewDetails(application)}
                            className="text-purple-600 hover:text-purple-700 font-medium text-sm transition-colors duration-200 flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </button>
                          {application.status === 'interview' && (
                            <button className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors duration-200 flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Interview Details
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          {application.recruiter_name && (
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-4 h-4" />
                              {application.recruiter_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredApplications.length === 0 && (
          <motion.div 
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.0 }}
          >
            <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No applications found</h3>
            <p className="text-gray-500">
              {applications.length === 0 
                ? "You haven't applied to any jobs yet. Start exploring opportunities!"
                : "No applications match your current filter. Try selecting a different tab."
              }
            </p>
          </motion.div>
        )}
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedApplication && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              className="bg-white/30 backdrop-blur-md border border-white/20 shadow-2xl rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Application Details</h2>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedApplication.title}</h3>
                    <p className="text-gray-600">{selectedApplication.company}</p>
                  </div>
                  
                  <div className="border-t border-white/20 pt-4">
                    <p className="text-sm text-gray-600 mb-2">Status</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedApplication.status)}`}>
                      {getStatusIcon(selectedApplication.status)}
                      <span className="ml-2">{getStatusText(selectedApplication.status)}</span>
                    </span>
                  </div>
                  
                  <div className="border-t border-white/20 pt-4">
                    <p className="text-sm text-gray-600 mb-2">Job Description</p>
                    <p className="text-gray-700">{selectedApplication.job_description || 'No description available'}</p>
                  </div>
                  
                  <div className="border-t border-white/20 pt-4">
                    <p className="text-sm text-gray-600 mb-2">Application Timeline</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">Applied on {new Date(selectedApplication.applied_timestamp).toLocaleDateString()}</span>
                      </div>
                      {selectedApplication.status === 'interview' && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-500" />
                          <span className="text-sm">Interview scheduled</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MyJobs;