import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Edit2,
  Save,
  Camera,
  Building,
  Globe,
  Upload,
  Users,
  CheckCircle,
  X,
  ChevronDown,
  ChevronUp,
  MapPin as LocationIcon,
  LinkIcon as LinkIconAlt,
  Briefcase as BriefcaseIcon,
  DollarSign,
  Clock,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import client from '../../api/client';
import toast from 'react-hot-toast';

const RecruiterProfile = ({ user }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    personal: true,
    company: true,
    locations: false,
    social: false
  });

  // Comprehensive profile data structure for Recruiters
  const [profileData, setProfileData] = useState({
    // Personal Information
    name: '',
    email: '',
    phone: '',
    designation: '',
    department: '',
    profilePhoto: null,
    bio: '',

    // Company Information
    companyName: '',
    companyLogo: null,
    companyWebsite: '',
    industry: '',
    companySize: '',
    companyDescription: '',
    companyFounded: '',
    companyType: '',
    officeLocations: [],

    // Social Links
    linkedin: '',
    website: ''
  });

  // Activity stats state
  const [activityStats, setActivityStats] = useState({
    jobsPosted: 0,
    applications: 0,
    interviews: 0,
    hired: 0
  });

  const [editData, setEditData] = useState({ ...profileData });

  useEffect(() => {
    loadProfile();
    loadStats();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      // Initialize with user prop data as fallback
      let baseProfile = {
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone_no || user?.phone || '',
        designation: '',
        department: '',
        profilePhoto: null,
        bio: '',
        companyName: user?.company || '',
        companyLogo: null,
        companyWebsite: '',
        industry: '',
        companySize: '',
        companyDescription: '',
        companyFounded: '',
        companyType: '',
        officeLocations: [],
        linkedin: '',
        website: ''
      };

      // Try to load complete profile from backend
      try {
        const response = await client.get('/api/recruiter/profile');
        if (response.data?.success && response.data?.profile) {
          const serverProfile = response.data.profile;
          baseProfile = {
            name: serverProfile.name || baseProfile.name,
            email: serverProfile.email || baseProfile.email,
            phone: serverProfile.phone_no || baseProfile.phone,
            designation: serverProfile.designation || '',
            department: '',
            profilePhoto: null,
            bio: serverProfile.bio || '',
            companyName: serverProfile.company || '',
            companyLogo: null,
            companyWebsite: '',
            industry: '',
            companySize: '',
            companyDescription: '',
            companyFounded: '',
            companyType: '',
            officeLocations: [],
            linkedin: '',
            website: ''
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

  const loadStats = async () => {
    try {
      const response = await client.get('/api/recruiter/stats');
      if (response.data?.success) {
        setActivityStats({
          jobsPosted: response.data.totalJobs || 0,
          applications: response.data.totalApplications || 0,
          interviews: response.data.scheduledInterviews || 0,
          hired: 0 // Not tracked in current schema
        });
      }
    } catch (error) {
      console.log('Could not load stats:', error.message);
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
      // Map frontend data to backend structure
      const profileUpdateData = {
        name: editData.name,
        phone_no: editData.phone,
        company: editData.companyName,
        designation: editData.designation
      };

      const response = await client.put('/api/recruiter/profile', profileUpdateData);
      
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

  const handleArrayFieldChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: typeof value === 'string' ? value.split(',').map(item => item.trim()).filter(item => item) : value
    }));
  };

  const handleFileUpload = (field, file) => {
    setEditData(prev => ({ ...prev, [field]: file }));
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

                {isEditing ? (
                  <input
                    type="text"
                    value={editData.designation}
                    onChange={(e) => handleInputChange('designation', e.target.value)}
                    className="text-lg text-gray-600 bg-transparent border-b border-gray-300 focus:border-purple-500 outline-none w-full"
                    placeholder="Your designation"
                  />
                ) : (
                  <p className="text-lg text-gray-600">{profileData.designation || 'No designation set'}</p>
                )}

                <p className="text-sm text-purple-600 mt-1">Recruiter</p>
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
              <BriefcaseIcon className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-500">Department</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    className="text-gray-900 bg-transparent border-b border-gray-300 focus:border-purple-500 outline-none"
                    placeholder="Your department"
                  />
                ) : (
                  <p className="text-gray-900">{profileData.department || 'Not specified'}</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Company Details Section */}
        <motion.div
          className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8 mb-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Company Details</h2>
            <button
              onClick={() => toggleSection('company')}
              className="text-gray-500 hover:text-gray-700"
            >
              {expandedSections.company ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>

          {expandedSections.company && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:border-purple-500 outline-none"
                      placeholder="Enter company name"
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.companyName || 'Not specified'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.industry}
                      onChange={(e) => handleInputChange('industry', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:border-purple-500 outline-none"
                      placeholder="e.g., Technology, Finance, Healthcare"
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.industry || 'Not specified'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Size
                  </label>
                  {isEditing ? (
                    <select
                      value={editData.companySize}
                      onChange={(e) => handleInputChange('companySize', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:border-purple-500 outline-none"
                    >
                      <option value="">Select company size</option>
                      <option value="1-10">1-10 employees</option>
                      <option value="11-50">11-50 employees</option>
                      <option value="51-200">51-200 employees</option>
                      <option value="201-500">201-500 employees</option>
                      <option value="501-1000">501-1000 employees</option>
                      <option value="1000+">1000+ employees</option>
                    </select>
                  ) : (
                    <p className="text-gray-900">{profileData.companySize || 'Not specified'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Type
                  </label>
                  {isEditing ? (
                    <select
                      value={editData.companyType}
                      onChange={(e) => handleInputChange('companyType', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:border-purple-500 outline-none"
                    >
                      <option value="">Select company type</option>
                      <option value="Startup">Startup</option>
                      <option value="SMB">Small/Medium Business</option>
                      <option value="MNC">Multinational Corporation</option>
                      <option value="Government">Government</option>
                      <option value="NGO">Non-Profit/NGO</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <p className="text-gray-900">{profileData.companyType || 'Not specified'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year Founded
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editData.companyFounded}
                      onChange={(e) => handleInputChange('companyFounded', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:border-purple-500 outline-none"
                      placeholder="e.g., 2010"
                      min="1800"
                      max={new Date().getFullYear()}
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.companyFounded || 'Not specified'}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Description
                </label>
                {isEditing ? (
                  <textarea
                    value={editData.companyDescription}
                    onChange={(e) => handleInputChange('companyDescription', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:border-purple-500 outline-none"
                    rows="4"
                    placeholder="Brief description about your company..."
                  />
                ) : (
                  <p className="text-gray-900">{profileData.companyDescription || 'No description added'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Website
                </label>
                {isEditing ? (
                  <input
                    type="url"
                    value={editData.companyWebsite}
                    onChange={(e) => handleInputChange('companyWebsite', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:border-purple-500 outline-none"
                    placeholder="https://yourcompany.com"
                  />
                ) : (
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-purple-600" />
                    {profileData.companyWebsite ? (
                      <a href={profileData.companyWebsite} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                        {profileData.companyWebsite}
                      </a>
                    ) : (
                      <p className="text-gray-500">Not provided</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>

        {/* Office Locations Section */}
        <motion.div
          className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8 mb-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Office Locations</h2>
            <button
              onClick={() => toggleSection('locations')}
              className="text-gray-500 hover:text-gray-700"
            >
              {expandedSections.locations ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>

          {expandedSections.locations && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Office Locations
              </label>
              {isEditing ? (
                <textarea
                  value={editData.officeLocations.join('\n')}
                  onChange={(e) => handleArrayFieldChange('officeLocations', e.target.value.split('\n').filter(item => item.trim()))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-purple-500 outline-none"
                  rows="3"
                  placeholder="Enter office locations (one per line)"
                />
              ) : (
                <div className="space-y-2">
                  {profileData.officeLocations.length > 0 ? (
                    profileData.officeLocations.map((location, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <LocationIcon className="w-4 h-4 text-purple-500" />
                        <span className="text-gray-900">{location}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No office locations added</p>
                  )}
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Social Links Section */}
        <motion.div
          className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8 mb-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Social Links</h2>
            <button
              onClick={() => toggleSection('social')}
              className="text-gray-500 hover:text-gray-700"
            >
              {expandedSections.social ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>

          {expandedSections.social && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LinkedIn
                </label>
                {isEditing ? (
                  <input
                    type="url"
                    value={editData.linkedin}
                    onChange={(e) => handleInputChange('linkedin', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:border-purple-500 outline-none"
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                ) : (
                  <div className="flex items-center space-x-2">
                    <LinkIconAlt className="w-4 h-4 text-blue-600" />
                    {profileData.linkedin ? (
                      <a href={profileData.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {profileData.linkedin}
                      </a>
                    ) : (
                      <p className="text-gray-500">Not provided</p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                {isEditing ? (
                  <input
                    type="url"
                    value={editData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:border-purple-500 outline-none"
                    placeholder="https://yourwebsite.com"
                  />
                ) : (
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-purple-600" />
                    {profileData.website ? (
                      <a href={profileData.website} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                        {profileData.website}
                      </a>
                    ) : (
                      <p className="text-gray-500">Not provided</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>


      </div>
    </motion.div>
  );
};

export default RecruiterProfile;
