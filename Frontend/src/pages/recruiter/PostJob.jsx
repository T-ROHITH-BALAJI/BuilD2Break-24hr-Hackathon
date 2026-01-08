import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import client from '../../api/client';
import {
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  Users,
  FileText,
  Plus,
  Trash2,
  Save,
  Eye,
  Building,
  Calendar,
  Globe
} from 'lucide-react';

const PostJob = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: '',
      company: '',
      location: '',
      workType: 'full-time',
      salaryMin: '',
      salaryMax: '',
      experience: 'mid',
      description: '',
      requirements: [],
      benefits: [],
      skills: [],
      applicationDeadline: '',
      contactEmail: '',
      department: '',
      remote: false,
    },
  });

  const watchAllFields = watch();

  const [customRequirement, setCustomRequirement] = useState('');
  const [customBenefit, setCustomBenefit] = useState('');
  const [customSkill, setCustomSkill] = useState('');

  const handleAddItem = (type, value, setter) => {
    if (value.trim()) {
      const currentItems = watchAllFields[type] || [];
      setValue(type, [...currentItems, value.trim()]);
      setter('');
    }
  };

  const handleRemoveItem = (type, index) => {
    const currentItems = watchAllFields[type] || [];
    setValue(type, currentItems.filter((_, i) => i !== index));
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        title: data.title,
        job_description: data.description,
        salary: Number(data.salaryMax || data.salaryMin || 0),
        company: data.company,
        min_experience: data.experience === 'entry' ? 0 : data.experience === 'mid' ? 3 : data.experience === 'senior' ? 5 : 8,
        skills_required: Array.isArray(data.skills) ? data.skills : [],
        location: data.location,
        job_type: data.workType,
      };
      const res = await client.post('/api/recruiter/jobs', payload);
      if (res.data?.success) {
      toast.success('Job posted successfully!');
      navigate('/recruiter/jobs');
      } else {
        toast.error(res.data?.error || 'Failed to post job');
      }
    } catch (error) {
      toast.error('Failed to post job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    setLoading(true);
    try {
      // Mock API call for saving draft
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Draft saved successfully!');
    } catch (error) {
      toast.error('Failed to save draft.');
    } finally {
      setLoading(false);
    }
  };

  if (preview) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Job Preview</h1>
            <p className="text-gray-600">Review your job posting before publishing</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPreview(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
            >
              Edit
            </button>
            <button
              onClick={handleSubmit(onSubmit)}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              {loading ? 'Publishing...' : 'Publish Job'}
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="bg-white rounded-lg shadow border p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{watchAllFields.title}</h1>
                <div className="flex items-center space-x-4 text-gray-600">
                  <span className="flex items-center">
                    <Building className="w-4 h-4 mr-1" />
                    {watchAllFields.company}
                  </span>
                  <span className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {watchAllFields.location}
                  </span>
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {watchAllFields.workType}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">
                  ${watchAllFields.salaryMin} - ${watchAllFields.salaryMax}
                </div>
                <div className="text-sm text-gray-500">per year</div>
              </div>
            </div>

            <div className="prose max-w-none">
              <h3>Job Description</h3>
              <p className="whitespace-pre-wrap">{watchAllFields.description}</p>

              {watchAllFields.requirements?.length > 0 && (
                <>
                  <h3>Requirements</h3>
                  <ul>
                    {watchAllFields.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </>
              )}

              {watchAllFields.skills?.length > 0 && (
                <>
                  <h3>Required Skills</h3>
                  <div className="flex flex-wrap gap-2 not-prose">
                    {watchAllFields.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </>
              )}

              {watchAllFields.benefits?.length > 0 && (
                <>
                  <h3>Benefits</h3>
                  <ul>
                    {watchAllFields.benefits.map((benefit, index) => (
                      <li key={index}>{benefit}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Post a New Job</h1>
          <p className="text-gray-600">Create a job posting to attract top talent</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleSaveDraft}
            disabled={loading}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
          >
            <Save className="w-4 h-4 inline mr-2" />
            Save Draft
          </button>
          <button
            onClick={() => setPreview(true)}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium"
          >
            <Eye className="w-4 h-4 inline mr-2" />
            Preview
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
                  <input
                    {...register('title', { required: 'Job title is required' })}
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. Senior Frontend Developer"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
                  <input
                    {...register('company', { required: 'Company name is required' })}
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. TechCorp Inc."
                  />
                  {errors.company && (
                    <p className="mt-1 text-sm text-red-600">{errors.company.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    {...register('department')}
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. Engineering"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                  <input
                    {...register('location', { required: 'Location is required' })}
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. San Francisco, CA or Remote"
                  />
                  {errors.location && (
                    <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Work Type *</label>
                  <select
                    {...register('workType', { required: 'Work type is required' })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                    <option value="freelance">Freelance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level</label>
                  <select
                    {...register('experience')}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="entry">Entry Level</option>
                    <option value="mid">Mid Level</option>
                    <option value="senior">Senior Level</option>
                    <option value="executive">Executive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Salary ($)</label>
                  <input
                    {...register('salaryMin', { required: 'Minimum salary is required' })}
                    type="number"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="80000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Salary ($)</label>
                  <input
                    {...register('salaryMax', { required: 'Maximum salary is required' })}
                    type="number"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="120000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Application Deadline</label>
                  <input
                    {...register('applicationDeadline')}
                    type="date"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                  <input
                    {...register('contactEmail')}
                    type="email"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="hr@company.com"
                  />
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center">
                    <input
                      {...register('remote')}
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Remote work available
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Job Description */}
            <div className="bg-white rounded-lg shadow border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Job Description</h3>
              <textarea
                {...register('description', { required: 'Job description is required' })}
                rows={8}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Requirements */}
            <div className="bg-white rounded-lg shadow border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Requirements</h3>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={customRequirement}
                    onChange={(e) => setCustomRequirement(e.target.value)}
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add a requirement..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddItem('requirements', customRequirement, setCustomRequirement);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddItem('requirements', customRequirement, setCustomRequirement)}
                    className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(watchAllFields.requirements || []).map((req, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
                    >
                      {req}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem('requirements', index)}
                        className="ml-2 text-gray-600 hover:text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="bg-white rounded-lg shadow border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Required Skills</h3>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={customSkill}
                    onChange={(e) => setCustomSkill(e.target.value)}
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add a skill..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddItem('skills', customSkill, setCustomSkill);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddItem('skills', customSkill, setCustomSkill)}
                    className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(watchAllFields.skills || []).map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem('skills', index)}
                        className="ml-2 text-blue-600 hover:text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="bg-white rounded-lg shadow border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Benefits & Perks</h3>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={customBenefit}
                    onChange={(e) => setCustomBenefit(e.target.value)}
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add a benefit..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddItem('benefits', customBenefit, setCustomBenefit);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddItem('benefits', customBenefit, setCustomBenefit)}
                    className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(watchAllFields.benefits || []).map((benefit, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                    >
                      {benefit}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem('benefits', index)}
                        className="ml-2 text-green-600 hover:text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Job Posting Tips */}
            <div className="bg-white rounded-lg shadow border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                <FileText className="w-5 h-5 inline mr-2" />
                Tips for Better Job Posts
              </h3>
              <div className="space-y-3 text-sm text-gray-600">
                <p>• Be specific about role responsibilities</p>
                <p>• Include required experience level</p>
                <p>• Mention growth opportunities</p>
                <p>• Add company culture details</p>
                <p>• Use inclusive language</p>
                <p>• Specify remote work options</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow border p-6">
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
                >
                  {loading ? 'Publishing...' : 'Publish Job'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/recruiter/jobs')}
                  className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PostJob;
