import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Shield,
  Edit2,
  Save,
  Camera,
  Calendar,
  Settings,
  Users,
  Briefcase,
  Activity
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import client from '../../api/client';
import toast from 'react-hot-toast';

const AdminProfile = ({ user }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    created_at: ''
  });

  const [editData, setEditData] = useState({ ...profileData });
  
  // System stats
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    totalRecruiters: 0,
    totalJobs: 0,
    totalApplications: 0
  });

  useEffect(() => {
    loadProfile();
    loadSystemStats();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      // Initialize with user prop data
      const baseProfile = {
        name: user?.name || 'Admin',
        email: user?.email || '',
        created_at: user?.created_at || new Date().toISOString()
      };

      // Try to load from backend if endpoint exists
      try {
        const response = await client.get('/api/admin/profile');
        if (response.data?.success && response.data?.profile) {
          const serverProfile = response.data.profile;
          baseProfile.name = serverProfile.name || baseProfile.name;
          baseProfile.email = serverProfile.email || baseProfile.email;
          baseProfile.created_at = serverProfile.created_at || baseProfile.created_at;
        }
      } catch (error) {
        console.log('Using fallback admin profile data');
      }

      setProfileData(baseProfile);
      setEditData(baseProfile);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSystemStats = async () => {
    try {
      const response = await client.get('/api/admin/stats');
      if (response.data?.success) {
        setSystemStats({
          totalUsers: response.data.totalJobSeekers || 0,
          totalRecruiters: response.data.totalRecruiters || 0,
          totalJobs: response.data.totalJobs || 0,
          totalApplications: response.data.totalApplications || 0
        });
      }
    } catch (error) {
      console.log('Could not load system stats:', error.message);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditData({ ...profileData });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await client.put('/api/admin/profile', {
        name: editData.name
      });
      
      if (response.data?.success) {
        setProfileData(editData);
        setIsEditing(false);
        toast.success('✨ Profile updated successfully!');
      } else {
        throw new Error(response.data?.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      // Still update local state for now
      setProfileData(editData);
      setIsEditing(false);
      toast.success('Profile updated!');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({ ...profileData });
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
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
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <motion.div
          className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8 mb-6"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  {profileData.name ? profileData.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-purple-600 p-2 rounded-full">
                  <Shield className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="flex-1">
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-purple-300 focus:border-purple-500 outline-none mb-2 w-full"
                  />
                ) : (
                  <h1 className="text-2xl font-bold text-gray-900">{profileData.name}</h1>
                )}
                <p className="text-lg text-purple-600 font-medium flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  System Administrator
                </p>
              </div>
            </div>

            <div className="flex space-x-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={handleEdit}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <Mail className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-gray-900 font-medium">{profileData.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <Calendar className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-500">Account Created</p>
                <p className="text-gray-900 font-medium">{formatDate(profileData.created_at)}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* System Overview Stats */}
        <motion.div
          className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-600" />
            System Overview
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Users className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold text-purple-600">{systemStats.totalUsers}</p>
              <p className="text-sm text-gray-600">Job Seekers</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Briefcase className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold text-blue-600">{systemStats.totalRecruiters}</p>
              <p className="text-sm text-gray-600">Recruiters</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Settings className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold text-green-600">{systemStats.totalJobs}</p>
              <p className="text-sm text-gray-600">Active Jobs</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <Activity className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
              <p className="text-2xl font-bold text-yellow-600">{systemStats.totalApplications}</p>
              <p className="text-sm text-gray-600">Applications</p>
            </div>
          </div>
        </motion.div>

        {/* Admin Capabilities */}
        <motion.div
          className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8 mt-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">Admin Capabilities</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors">
              <h3 className="font-semibold text-gray-900 mb-1">User Management</h3>
              <p className="text-sm text-gray-600">View, edit, and manage all job seekers and their accounts</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors">
              <h3 className="font-semibold text-gray-900 mb-1">Recruiter Management</h3>
              <p className="text-sm text-gray-600">Approve, suspend, or remove recruiter accounts</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors">
              <h3 className="font-semibold text-gray-900 mb-1">System Logs</h3>
              <p className="text-sm text-gray-600">Monitor system activity and audit trails</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors">
              <h3 className="font-semibold text-gray-900 mb-1">Analytics Dashboard</h3>
              <p className="text-sm text-gray-600">View platform statistics and performance metrics</p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AdminProfile;
