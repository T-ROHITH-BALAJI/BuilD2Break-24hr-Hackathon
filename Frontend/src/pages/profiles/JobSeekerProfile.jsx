import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit2,
  Save,
  Camera,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import client from '../../api/client';
import toast from 'react-hot-toast';

const JobSeekerProfile = ({ user }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    personal: true
  });

  // Simplified profile data structure
  const [profileData, setProfileData] = useState({
    // Personal Information
    name: '',
    email: '',
    phone: '',
    dob: '',
    nationality: '',
    address: '',
    currentLocation: '',
    preferredLocation: '',
    bio: ''
  });

  const [editData, setEditData] = useState({ ...profileData });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      // First load basic user info as fallback
      let baseProfile = {
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone_no || '',
        dob: '',
        nationality: '',
        address: '',
        currentLocation: '',
        preferredLocation: '',
        bio: ''
      };

      // Try to load complete profile from backend
      try {
        const response = await client.get('/api/jobseeker/profile');
        if (response.data?.success && response.data?.profile) {
          const serverProfile = response.data.profile;
          baseProfile = {
            name: serverProfile.name || baseProfile.name,
            email: serverProfile.email || baseProfile.email,
            phone: serverProfile.phone_no || baseProfile.phone,
            dob: serverProfile.dob ? serverProfile.dob.split('T')[0] : '',
            nationality: serverProfile.nationality || '',
            address: serverProfile.address || '',
            currentLocation: serverProfile.address || '',
            preferredLocation: serverProfile.preferred_location || '',
            bio: serverProfile.bio || ''
          };
        }
      } catch (error) {
        console.log('Using fallback profile data:', error.message);
      }

      setProfileData(baseProfile);
      setEditData(baseProfile);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditData({ ...profileData });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const profileUpdateData = {
        name: editData.name,
        email: editData.email,
        phone_no: editData.phone,
        dob: editData.dob,
        nationality: editData.nationality,
        address: editData.address,
        bio: editData.bio,
        preferred_location: editData.preferredLocation
      };

      const response = await client.put('/api/jobseeker/profile', profileUpdateData);
      
      if (response.data?.success) {
        setProfileData(editData);
        setIsEditing(false);
        toast.success('✨ Profile updated successfully!');
      } else {
        throw new Error(response.data?.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile: ' + (error.response?.data?.error || error.message));
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
      <div className="max-w-6xl mx-auto">
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
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-3xl font-bold">
                  {profileData.name ? profileData.name.charAt(0).toUpperCase() : 'U'}
                </div>
                {isEditing && (
                  <button className="absolute bottom-0 right-0 p-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors">
                    <Camera className="w-4 h-4" />
                  </button>
                )}
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
                <p className="text-sm text-purple-600 mt-1">Job Seeker</p>
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

          {/* Bio/About Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">About</h3>
            {isEditing ? (
              <textarea
                value={editData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-purple-500 outline-none resize-none"
                rows="3"
                placeholder="Tell us about yourself..."
              />
            ) : (
              <p className="text-gray-600">{profileData.bio || 'No bio added yet'}</p>
            )}
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-gray-900">{profileData.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="text-gray-900 bg-transparent border-b border-gray-300 focus:border-purple-500 outline-none"
                    placeholder="Your phone number"
                  />
                ) : (
                  <p className="text-gray-900">{profileData.phone || 'Not provided'}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-500">Current Location</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.currentLocation}
                    onChange={(e) => handleInputChange('currentLocation', e.target.value)}
                    className="text-gray-900 bg-transparent border-b border-gray-300 focus:border-purple-500 outline-none"
                    placeholder="Your current location"
                  />
                ) : (
                  <p className="text-gray-900">{profileData.currentLocation || 'Not specified'}</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Personal Information Section */}
        <motion.div
          className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
            <button
              onClick={() => toggleSection('personal')}
              className="text-gray-500 hover:text-gray-700"
            >
              {expandedSections.personal ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>

          {expandedSections.personal && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={editData.dob}
                    onChange={(e) => handleInputChange('dob', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:border-purple-500 outline-none"
                  />
                ) : (
                  <p className="text-gray-900">{profileData.dob ? new Date(profileData.dob).toLocaleDateString() : 'Not specified'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nationality
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.nationality}
                    onChange={(e) => handleInputChange('nationality', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:border-purple-500 outline-none"
                    placeholder="Your nationality"
                  />
                ) : (
                  <p className="text-gray-900">{profileData.nationality || 'Not specified'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:border-purple-500 outline-none"
                    placeholder="Your address"
                  />
                ) : (
                  <p className="text-gray-900">{profileData.address || 'Not specified'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Location
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.preferredLocation}
                    onChange={(e) => handleInputChange('preferredLocation', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:border-purple-500 outline-none"
                    placeholder="Preferred work location"
                  />
                ) : (
                  <p className="text-gray-900">{profileData.preferredLocation || 'Not specified'}</p>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default JobSeekerProfile;
