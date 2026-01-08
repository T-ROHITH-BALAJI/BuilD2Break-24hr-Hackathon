import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Users,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Shield,
  ShieldOff,
  Download,
  Upload,
  UserPlus,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  Briefcase,
  CheckCircle,
  RotateCcw,
  MoreHorizontal,
  Star,
  TrendingUp,
  Award
} from 'lucide-react';

const AdminRecruiters = () => {
  const [loading, setLoading] = useState(true);
  const [recruiters, setRecruiters] = useState([]);
  const [filteredRecruiters, setFilteredRecruiters] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [selectedRecruiters, setSelectedRecruiters] = useState([]);
  const [showRecruiterModal, setShowRecruiterModal] = useState(false);
  const [selectedRecruiter, setSelectedRecruiter] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });

  // Fetch recruiters from API
  const fetchRecruiters = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      params.append('role', 'recruiter');
      if (searchTerm) params.append('search', searchTerm);
      params.append('page', pagination.page);
      params.append('limit', pagination.limit);
      
      const response = await fetch(`/api/admin/users?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch recruiters');
      
      const data = await response.json();
      if (data.success) {
        // Transform data to match expected format
        const transformedRecruiters = data.users.map(user => ({
          id: user.user_id,
          name: user.name || 'Unknown',
          email: user.email,
          phone: user.phone || 'Not provided',
          location: user.location || 'Not specified',
          company: user.company || 'Not specified',
          position: user.designation || 'Recruiter',
          status: 'active',
          verified: true,
          avatar: null,
          joinDate: user.created_at,
          lastActive: user.updated_at || user.created_at,
          jobsPosted: 0,
          activeJobs: 0,
          totalApplications: 0,
          hiredCandidates: 0,
          rating: 0,
          companySize: 'Unknown',
          industry: 'Unknown',
          website: '',
          verifiedEmail: true,
          verifiedPhone: false,
          verifiedCompany: false
        }));
        setRecruiters(transformedRecruiters);
        setFilteredRecruiters(transformedRecruiters);
        setPagination(data.pagination || { page: 1, limit: 20, total: transformedRecruiters.length, pages: 1 });
        toast.success(`Loaded ${transformedRecruiters.length} recruiters`);
      }
    } catch (error) {
      console.error('Error fetching recruiters:', error);
      toast.error('Failed to fetch recruiters');
      setRecruiters([]);
      setFilteredRecruiters([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecruiters();
  }, [pagination.page]);

  useEffect(() => {
    // Client-side filtering
    let filtered = recruiters;

    if (searchTerm) {
      filtered = filtered.filter(recruiter =>
        recruiter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recruiter.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (recruiter.company && recruiter.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (recruiter.location && recruiter.location.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(recruiter => recruiter.status === statusFilter);
    }

    if (verificationFilter !== 'all') {
      if (verificationFilter === 'verified') {
        filtered = filtered.filter(recruiter => recruiter.verified);
      } else if (verificationFilter === 'unverified') {
        filtered = filtered.filter(recruiter => !recruiter.verified);
      }
    }

    setFilteredRecruiters(filtered);
  }, [searchTerm, statusFilter, verificationFilter, recruiters]);

  const handleStatusChange = async (recruiterId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${recruiterId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        setRecruiters(prevRecruiters =>
          prevRecruiters.map(recruiter =>
            recruiter.id === recruiterId ? { ...recruiter, status: newStatus } : recruiter
          )
        );
        toast.success(`Recruiter ${newStatus}`);
      }
    } catch (error) {
      toast.error('Failed to update recruiter status');
    }
  };

  const handleVerificationChange = (recruiterId, verified) => {
    setRecruiters(prevRecruiters =>
      prevRecruiters.map(recruiter =>
        recruiter.id === recruiterId ? { ...recruiter, verified } : recruiter
      )
    );
    toast.success(`Recruiter ${verified ? 'verified' : 'unverified'}`);
  };

  const handleDeleteRecruiter = async (recruiterId) => {
    if (window.confirm('Are you sure you want to delete this recruiter?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/admin/users/${recruiterId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          setRecruiters(prevRecruiters => prevRecruiters.filter(recruiter => recruiter.id !== recruiterId));
          toast.success('Recruiter deleted successfully');
        } else {
          throw new Error('Failed to delete');
        }
      } catch (error) {
        toast.error('Failed to delete recruiter');
      }
    }
  };

  const handleViewDetails = (recruiter) => {
    setSelectedRecruiter(recruiter);
    setShowRecruiterModal(true);
  };

  const handleBulkAction = (action) => {
    if (selectedRecruiters.length === 0) {
      toast.error('Please select recruiters first');
      return;
    }

    switch (action) {
      case 'activate':
        setRecruiters(prevRecruiters =>
          prevRecruiters.map(recruiter =>
            selectedRecruiters.includes(recruiter.id) ? { ...recruiter, status: 'active' } : recruiter
          )
        );
        setSelectedRecruiters([]);
        toast.success(`${selectedRecruiters.length} recruiter(s) activated`);
        break;
      case 'suspend':
        setRecruiters(prevRecruiters =>
          prevRecruiters.map(recruiter =>
            selectedRecruiters.includes(recruiter.id) ? { ...recruiter, status: 'suspended' } : recruiter
          )
        );
        setSelectedRecruiters([]);
        toast.success(`${selectedRecruiters.length} recruiter(s) suspended`);
        break;
      case 'verify':
        setRecruiters(prevRecruiters =>
          prevRecruiters.map(recruiter =>
            selectedRecruiters.includes(recruiter.id) ? { ...recruiter, verified: true } : recruiter
          )
        );
        setSelectedRecruiters([]);
        toast.success(`${selectedRecruiters.length} recruiter(s) verified`);
        break;
      case 'delete':
        if (window.confirm(`Are you sure you want to delete ${selectedRecruiters.length} recruiter(s)?`)) {
          setRecruiters(prevRecruiters => prevRecruiters.filter(recruiter => !selectedRecruiters.includes(recruiter.id)));
          setSelectedRecruiters([]);
          toast.success(`${selectedRecruiters.length} recruiter(s) deleted`);
        }
        break;
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      suspended: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      inactive: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors.inactive;
  };

  const getRatingStars = (rating) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">{rating.toFixed(1)}</span>
      </div>
    );
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
          <h1 className="text-2xl font-bold text-gray-900">Recruiter Management</h1>
          <p className="text-gray-600">Manage recruiters and their activities</p>
        </div>
        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">
            <Download className="w-4 h-4 inline mr-2" />
            Export
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
            <UserPlus className="w-4 h-4 inline mr-2" />
            Add Recruiter
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Recruiters</p>
              <p className="text-2xl font-bold text-gray-900">{recruiters.length}</p>
            </div>
            <Users className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">
                {recruiters.filter(r => r.status === 'active').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Verified</p>
              <p className="text-2xl font-bold text-blue-600">
                {recruiters.filter(r => r.verified).length}
              </p>
            </div>
            <Shield className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Jobs</p>
              <p className="text-2xl font-bold text-purple-600">
                {recruiters.reduce((sum, r) => sum + r.jobsPosted, 0)}
              </p>
            </div>
            <Briefcase className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Rating</p>
              <p className="text-2xl font-bold text-yellow-600">
                {(recruiters.filter(r => r.rating > 0).reduce((sum, r) => sum + r.rating, 0) / 
                  recruiters.filter(r => r.rating > 0).length || 0).toFixed(1)}
              </p>
            </div>
            <Star className="w-8 h-8 text-yellow-400" />
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
                placeholder="Search recruiters by name, email, or company..."
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
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>

            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Verification</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedRecruiters.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-800">
                {selectedRecruiters.length} recruiter(s) selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction('activate')}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  Activate
                </button>
                <button
                  onClick={() => handleBulkAction('suspend')}
                  className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                >
                  Suspend
                </button>
                <button
                  onClick={() => handleBulkAction('verify')}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Verify
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

      {/* Recruiters Table */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRecruiters.length === filteredRecruiters.length && filteredRecruiters.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRecruiters(filteredRecruiters.map(recruiter => recruiter.id));
                      } else {
                        setSelectedRecruiters([]);
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recruiter
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecruiters.map((recruiter) => (
                <tr
                  key={recruiter.id}
                  className={`hover:bg-gray-50 ${selectedRecruiters.includes(recruiter.id) ? 'bg-blue-50' : ''}`}
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedRecruiters.includes(recruiter.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRecruiters([...selectedRecruiters, recruiter.id]);
                        } else {
                          setSelectedRecruiters(selectedRecruiters.filter(id => id !== recruiter.id));
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <img
                        src={recruiter.avatar}
                        alt={recruiter.name}
                        className="w-10 h-10 rounded-full object-cover mr-3"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900 flex items-center">
                          {recruiter.name}
                          {recruiter.verified && (
                            <CheckCircle className="w-4 h-4 ml-1 text-green-500" />
                          )}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Mail className="w-3 h-3 mr-1" />
                          {recruiter.email}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {recruiter.location}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 flex items-center">
                        <Building className="w-4 h-4 mr-1" />
                        {recruiter.company}
                      </div>
                      <div className="text-sm text-gray-500">{recruiter.position}</div>
                      <div className="text-sm text-gray-500">{recruiter.industry}</div>
                      <div className="text-sm text-gray-500">{recruiter.companySize} employees</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(recruiter.status)}`}>
                      {recruiter.status.charAt(0).toUpperCase() + recruiter.status.slice(1)}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      Joined: {new Date(recruiter.joinDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      <div className="flex items-center">
                        <Briefcase className="w-4 h-4 mr-1 text-gray-400" />
                        {recruiter.jobsPosted} jobs posted
                      </div>
                      <div className="flex items-center">
                        <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
                        {recruiter.activeJobs} active
                      </div>
                      <div className="flex items-center">
                        <Award className="w-4 h-4 mr-1 text-blue-500" />
                        {recruiter.hiredCandidates} hired
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {recruiter.rating > 0 ? (
                      getRatingStars(recruiter.rating)
                    ) : (
                      <span className="text-sm text-gray-500">No ratings</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewDetails(recruiter)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="text-green-600 hover:text-green-900"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleVerificationChange(recruiter.id, !recruiter.verified)}
                        className="text-yellow-600 hover:text-yellow-900"
                        title={recruiter.verified ? 'Unverify' : 'Verify'}
                      >
                        {recruiter.verified ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleStatusChange(recruiter.id, recruiter.status === 'active' ? 'suspended' : 'active')}
                        className="text-orange-600 hover:text-orange-900"
                        title={recruiter.status === 'active' ? 'Suspend' : 'Activate'}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRecruiter(recruiter.id)}
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

        {filteredRecruiters.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No recruiters found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search criteria
            </p>
          </div>
        )}
      </div>

      {/* Recruiter Details Modal */}
      {showRecruiterModal && selectedRecruiter && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Recruiter Details</h3>
                <button
                  onClick={() => setShowRecruiterModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <img
                      src={selectedRecruiter.avatar}
                      alt={selectedRecruiter.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{selectedRecruiter.name}</h4>
                      <p className="text-gray-600">{selectedRecruiter.position}</p>
                      <p className="text-gray-600">{selectedRecruiter.company}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact Information</label>
                    <div className="mt-1 space-y-1">
                      <p className="text-sm text-gray-900">{selectedRecruiter.email}</p>
                      <p className="text-sm text-gray-900">{selectedRecruiter.phone}</p>
                      <p className="text-sm text-gray-900">{selectedRecruiter.location}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Company Details</label>
                    <div className="mt-1 space-y-1">
                      <p className="text-sm text-gray-900">Industry: {selectedRecruiter.industry}</p>
                      <p className="text-sm text-gray-900">Size: {selectedRecruiter.companySize} employees</p>
                      <p className="text-sm text-gray-900">Website: {selectedRecruiter.website}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Account Status</label>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedRecruiter.status)}`}>
                        {selectedRecruiter.status.charAt(0).toUpperCase() + selectedRecruiter.status.slice(1)}
                      </span>
                      {selectedRecruiter.verified && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Performance Metrics</label>
                    <div className="mt-1 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Jobs Posted:</span>
                        <span className="text-sm text-gray-900">{selectedRecruiter.jobsPosted}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Active Jobs:</span>
                        <span className="text-sm text-gray-900">{selectedRecruiter.activeJobs}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Applications:</span>
                        <span className="text-sm text-gray-900">{selectedRecruiter.totalApplications}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Successful Hires:</span>
                        <span className="text-sm text-gray-900">{selectedRecruiter.hiredCandidates}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Rating:</span>
                        {selectedRecruiter.rating > 0 ? (
                          getRatingStars(selectedRecruiter.rating)
                        ) : (
                          <span className="text-sm text-gray-500">No ratings</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Account History</label>
                    <div className="mt-1 space-y-1">
                      <p className="text-sm text-gray-900">
                        Joined: {new Date(selectedRecruiter.joinDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-900">
                        Last Active: {new Date(selectedRecruiter.lastActive).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowRecruiterModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleVerificationChange(selectedRecruiter.id, !selectedRecruiter.verified);
                    setShowRecruiterModal(false);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {selectedRecruiter.verified ? 'Unverify' : 'Verify'} Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRecruiters;
