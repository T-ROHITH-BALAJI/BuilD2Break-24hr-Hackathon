import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Download, Upload, Eye, Star, FileText } from 'lucide-react';
import client from '../../api/client';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const Resume = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('builder');
  const [uploadedResumes, setUploadedResumes] = useState([]);
  const [resumeData, setResumeData] = useState({
    personalInfo: {
      name: '',
      email: '',
      phone: '',
      location: '',
      summary: ''
    },
    experience: [],
    education: [],
    skills: ['JavaScript', 'React', 'Node.js', 'Python']
  });
  const [newSkill, setNewSkill] = useState('');
  const [loading, setLoading] = useState(false);
  const previewRef = useRef(null);

  // Enhanced input field component
  const EnhancedInput = ({ label, icon, type = "text", value, onChange, placeholder, className = "", rows }) => {
    const baseClass = "w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white shadow-sm hover:shadow-md focus:shadow-lg";
    
    return (
      <div className={className}>
        <label className="block text-sm font-weight-medium text-gray-700 mb-2 flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="font-semibold">{label}</span>
        </label>
        {rows ? (
          <textarea
            value={value}
            onChange={onChange}
            className={baseClass + " resize-none"}
            placeholder={placeholder}
            rows={rows}
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={onChange}
            className={baseClass}
            placeholder={placeholder}
          />
        )}
      </div>
    );
  };

  // Load resumes on component mount
  useEffect(() => {
    loadResumes();
  }, []);

  // Load resumes from API
  const loadResumes = async () => {
    try {
      const response = await client.get('/api/jobseeker/resumes');
      if (response.data?.success) {
        const resumes = response.data.resumes.map(resume => ({
          id: resume.resume_id,
          name: resume.file_name || resume.title || 'Untitled Resume',
          uploadDate: new Date(resume.created_at).toLocaleDateString(),
          size: resume.file_size ? `${Math.round(resume.file_size / 1024)}KB` : 'N/A',
          status: resume.is_primary ? 'Primary' : 'Active',
          score: Math.floor(Math.random() * 20) + 80, // Placeholder score
          type: resume.type,
          resume_id: resume.resume_id
        }));
        setUploadedResumes(resumes);
      }
    } catch (error) {
      console.error('Error loading resumes:', error);
      if (error.response?.status !== 404) {
        toast.error('Failed to load resumes');
      }
    }
  };

  // Handle file upload with enhanced error handling
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    
    try {
      // Validate file type
      const allowedTypes = [
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload a PDF or Word document only');
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      // Show loading toast
      const loadingToast = toast.loading('Uploading resume...');

      // Convert file to base64
      const fileData = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      console.log('Uploading file:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      // Upload to server
      const uploadResponse = await client.post('/api/jobseeker/resumes/upload', {
        fileName: file.name,
        fileData: fileData,
        fileSize: file.size,
        fileType: file.type,
        title: file.name.split('.')[0],
        is_primary: uploadedResumes.length === 0
      });

      toast.dismiss(loadingToast);
      
      if (uploadResponse.data?.success) {
        toast.success('✨ Resume uploaded successfully!');
        await loadResumes();
        event.target.value = '';
      } else {
        toast.error('Upload failed: ' + (uploadResponse.data?.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error uploading resume:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to upload resume';
      toast.error('⚠️ ' + errorMsg);
      
      // Log additional debug info
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      
      event.target.value = '';
    } finally {
      setLoading(false);
    }
  };

  // Download resume file (from resume list)
  const downloadResumeFile = async (resume) => {
    if (resume.type === 'uploaded') {
      // Download uploaded file (PDF/DOC) from database
      try {
        const response = await client.get(`/api/jobseeker/resumes/${resume.resume_id}/download`, {
          responseType: 'blob'
        });
        
        // Create blob URL and trigger download
        const blob = new Blob([response.data]);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = resume.name;
        link.click();
        window.URL.revokeObjectURL(url);
        
        toast.success('📄 Resume file downloaded!');
      } catch (error) {
        console.error('Error downloading resume:', error);
        toast.error('Failed to download resume file');
      }
    } else {
      // For built resumes, generate PDF from current builder data
      toast('💡 This resume was built using our builder. Use "Download PDF" button in the builder tab to download it.', {
        duration: 4000,
        icon: 'ℹ️'
      });
    }
  };

  // Delete resume
  const deleteResume = async (resumeId) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) return;

    try {
      const response = await client.delete(`/api/jobseeker/resumes/${resumeId}`);
      if (response.data?.success) {
        toast.success('Resume deleted successfully!');
        loadResumes(); // Reload the list
      }
    } catch (error) {
      console.error('Error deleting resume:', error);
      toast.error(error.response?.data?.error || 'Failed to delete resume');
    }
  };

  // Preview resume
  const previewResume = async (resume) => {
    if (resume.type === 'uploaded') {
      toast.info('Preview for uploaded resumes will be available soon');
    } else {
      toast.info('Click "View Preview" in the builder tab to preview this resume');
      setActiveTab('builder');
    }
  };

  // Save resume to database
  const saveResumeToDatabase = async () => {
    try {
      const loadingToast = toast.loading('Saving resume to database...');
      
      // First, ensure we have a resume record
      const resume = await ensureResume();
      if (!resume) {
        toast.dismiss(loadingToast);
        return null;
      }

      const resumeId = resume.resume_id;

      // Save/update basic resume info
      await client.put(`/api/jobseeker/resumes/${resumeId}`, {
        title: `Resume - ${resumeData.personalInfo.name || 'Your Name'}`,
        statement_profile: resumeData.personalInfo.summary,
        linkedin_url: '',
        github_url: ''
      });

      // Clear existing data first to prevent duplicates
      try {
        await client.delete(`/api/jobseeker/resumes/${resumeId}/experiences`);
        await client.delete(`/api/jobseeker/resumes/${resumeId}/education`);
        await client.delete(`/api/jobseeker/resumes/${resumeId}/skills`);
      } catch (error) {
        console.log('Note: Could not clear existing data, continuing...', error.message);
      }

      // Save experiences
      for (const exp of resumeData.experience) {
        if (exp.title && exp.company) {
          await client.post('/api/jobseeker/resume/experience', {
            company: exp.company,
            duration: exp.duration,
            job_title: exp.title,
            description: exp.description,
            resume_id: resumeId
          });
        }
      }

      // Save education
      for (const edu of resumeData.education) {
        if (edu.degree && edu.school) {
          await client.post('/api/jobseeker/resume/education', {
            qualification: edu.degree,
            college: edu.school,
            gpa: edu.gpa,
            start_date: null,
            end_date: edu.year ? new Date(edu.year + '-12-31') : null,
            resume_id: resumeId
          });
        }
      }

      // Save skills
      if (resumeData.skills.length > 0) {
        await client.post('/api/jobseeker/resume/skills', {
          skill_type: 'tech', // Use 'tech' instead of 'technical' to match DB constraint
          skills: resumeData.skills, // Send as array, not string
          resume_id: resumeId
        });
      }

      toast.dismiss(loadingToast);
      toast.success('✨ Resume saved successfully!');
      
      // Reload the resumes list
      await loadResumes();
      
      return resumeId;
    } catch (error) {
      console.error('Error saving resume:', error);
      toast.error('Failed to save resume to database');
      return null;
    }
  };

  // Download resume as PDF (capture the live preview panel)
  const downloadResume = async () => {
    try {
      // First save the resume to database
      const resumeId = await saveResumeToDatabase();
      
      if (!previewRef.current) return;
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      // Add extra pages if content is taller than a single page
      let heightLeft = imgHeight - pageHeight;
      let position = -pageHeight;
      while (heightLeft > 0) {
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        position -= pageHeight;
      }

      const filename = `Resume - ${resumeData.personalInfo.name || 'Your Name'}.pdf`;
      pdf.save(filename);
      
      toast.success('📄 Resume downloaded!');
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      toast.error('Failed to generate PDF');
    }
  };

  const generateResumeHTML = () => {
    return `
      <div class="resume">
        <div class="header">
          <div class="name">${resumeData.personalInfo.name || 'Your Name'}</div>
          <div class="contact">
            ${resumeData.personalInfo.email ? `<div>${resumeData.personalInfo.email}</div>` : ''}
            ${resumeData.personalInfo.phone ? `<div>${resumeData.personalInfo.phone}</div>` : ''}
            ${resumeData.personalInfo.location ? `<div>${resumeData.personalInfo.location}</div>` : ''}
          </div>
        </div>
        
        ${resumeData.personalInfo.summary ? `
          <div class="section">
            <div class="section-title">Professional Summary</div>
            <p>${resumeData.personalInfo.summary}</p>
          </div>
        ` : ''}
        
        ${resumeData.experience.length > 0 ? `
          <div class="section">
            <div class="section-title">Experience</div>
            ${resumeData.experience.map(exp => `
              <div class="experience-item">
                <div class="job-title">${exp.title}</div>
                <div class="company">${exp.company} - ${exp.duration}</div>
                <p>${exp.description}</p>
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        ${resumeData.skills.length > 0 ? `
          <div class="section">
            <div class="section-title">Skills</div>
            <div class="skills">
              ${resumeData.skills.map(skill => `<span class="skill">${skill}</span>`).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  };

  // Format dates like "Sep 2024"; fall back to raw if parsing fails
  const formatDateDisplay = (s) => {
    if (!s) return '';
    try {
      const d = new Date(s);
      if (Number.isNaN(d.getTime())) return s;
      return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
    } catch {
      return s;
    }
  };

  // Helper to ensure a resume exists before adding sections
  const ensureResume = async () => {
    try {
      const r = await client.get('/api/jobseeker/resume');
      if (r.data?.success && r.data.resume) return r.data.resume;
    } catch (e) {
      console.error('GET /api/jobseeker/resume failed:', e?.response?.status, e?.response?.data);
    }
    try {
      const created = await client.post('/api/jobseeker/resume', {
        statement_profile: '',
        linkedin_url: '',
        github_url: '',
        title: 'Untitled Resume'
      });
      return created.data?.resume || null;
    } catch (e) {
      console.error('POST /api/jobseeker/resume failed:', e?.response?.status, e?.response?.data);
      if (e?.response?.status === 404) {
        toast.error('Job seeker profile not found. Please log in as a job seeker to use the resume builder.');
      } else if (e?.response?.status === 401 || e?.response?.status === 403) {
        toast.error('Session expired. Please sign in again.');
      } else {
        toast.error(e?.response?.data?.error || 'Failed to create resume');
      }
      return null;
    }
  };

  // Load or create a resume on mount, then hydrate state
  useEffect(() => {
    const init = async () => {
      // Auto-fill personal information from user profile
      const autoFilledPersonalInfo = {
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone_no || '',
        location: '',
        summary: ''
      };
      setResumeData(prev => ({
        ...prev,
        personalInfo: { ...prev.personalInfo, ...autoFilledPersonalInfo }
      }));
    };
    init();
  }, [user]);

  // Add experience
  const addExperience = () => {
    setResumeData(prev => ({
      ...prev,
      experience: [...prev.experience, { title: '', company: '', duration: '', description: '' }]
    }));
  };

  // Update experience
  const updateExperience = (index, field, value) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) => 
        i === index ? { ...exp, [field]: value } : exp
      )
    }));
  };

  // Remove experience
  const removeExperience = (index) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
  };

  // Add education
  const addEducation = () => {
    setResumeData(prev => ({
      ...prev,
      education: [...prev.education, { degree: '', school: '', year: '', gpa: '' }]
    }));
  };

  // Update education
  const updateEducation = (index, field, value) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.map((edu, i) => 
        i === index ? { ...edu, [field]: value } : edu
      )
    }));
  };

  // Remove education
  const removeEducation = (index) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  // Add skill
  const addSkill = () => {
    if (newSkill.trim() && !resumeData.skills.includes(newSkill.trim())) {
      setResumeData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  // Remove skill
  const removeSkill = (skillToRemove) => {
    setResumeData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const updatePersonalInfo = (field, value) => {
    setResumeData(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value }
    }));
  };

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Resume Builder
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Create professional resumes that get you noticed. Build from scratch or upload your existing resume.
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div 
          className="flex justify-center mb-8"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="glass-secondary rounded-full p-2 flex space-x-2">
            {[
              { id: 'builder', label: '🛠️ Builder', icon: <Plus className="w-4 h-4" /> },
              { id: 'upload', label: '📤 Upload', icon: <Upload className="w-4 h-4" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover-glow'
                    : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'builder' && (
            <motion.div 
              className="grid lg:grid-cols-2 gap-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              {/* Resume Builder Form */}
              <motion.div 
                className="space-y-6"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                {/* Personal Information */}
                <div className="card-glass">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    👤 Personal Information
                  </h3>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          👤 Full Name
                        </label>
                        <input
                          type="text"
                          value={resumeData.personalInfo.name}
                          onChange={(e) => updatePersonalInfo('name', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white shadow-sm hover:shadow-md"
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          📧 Email Address
                        </label>
                        <input
                          type="email"
                          value={resumeData.personalInfo.email}
                          onChange={(e) => updatePersonalInfo('email', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white shadow-sm hover:shadow-md"
                          placeholder="your.email@example.com"
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input
                          type="tel"
                          value={resumeData.personalInfo.phone}
                          onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                          className="input-field w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white shadow-sm hover:shadow-md"
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                        <input
                          type="text"
                          value={resumeData.personalInfo.location}
                          onChange={(e) => updatePersonalInfo('location', e.target.value)}
                          className="input-field w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white shadow-sm hover:shadow-md"
                          placeholder="City, State"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Professional Summary</label>
                      <textarea
                        value={resumeData.personalInfo.summary}
                        onChange={(e) => updatePersonalInfo('summary', e.target.value)}
                        className="input-field w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white shadow-sm hover:shadow-md"
                        rows={3}
                        placeholder="Brief overview of your professional background and goals..."
                      />
                    </div>
                  </div>
                </div>

                {/* Experience Section */}
                <div className="card-glass">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      💼 Work Experience
                    </h3>
                    <button
                      onClick={addExperience}
                      className="btn-secondary hover-glow flex items-center space-x-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Experience</span>
                    </button>
                  </div>
                  <div className="space-y-4">
                    {resumeData.experience.map((exp, index) => (
                      <motion.div
                        key={index}
                        className="glass-secondary p-4 rounded-xl border border-gray-200"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-medium text-gray-900">Experience #{index + 1}</h4>
                          <button
                            onClick={() => removeExperience(index)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="space-y-3">
                          <div className="grid md:grid-cols-2 gap-3">
                            <input
                              type="text"
                              value={exp.title}
                              onChange={(e) => updateExperience(index, 'title', e.target.value)}
                              className="input-field w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white shadow-sm hover:shadow-md"
                              placeholder="Job Title"
                            />
                            <input
                              type="text"
                              value={exp.company}
                              onChange={(e) => updateExperience(index, 'company', e.target.value)}
                              className="input-field w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white shadow-sm hover:shadow-md"
                              placeholder="Company Name"
                            />
                          </div>
                          <input
                            type="text"
                            value={exp.duration}
                            onChange={(e) => updateExperience(index, 'duration', e.target.value)}
                            className="input-field w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white shadow-sm hover:shadow-md"
                            placeholder="Duration (e.g., Jan 2020 - Present)"
                          />
                          <textarea
                            value={exp.description}
                            onChange={(e) => updateExperience(index, 'description', e.target.value)}
                            className="input-field w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white shadow-sm hover:shadow-md"
                            rows={3}
                            placeholder="Describe your key responsibilities and achievements..."
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Education Section */}
                <div className="card-glass">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      🎓 Education
                    </h3>
                    <button
                      onClick={addEducation}
                      className="btn-secondary hover-glow flex items-center space-x-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Education</span>
                    </button>
                  </div>
                  <div className="space-y-4">
                    {resumeData.education.map((edu, index) => (
                      <motion.div
                        key={index}
                        className="glass-secondary p-4 rounded-xl border border-gray-200"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-medium text-gray-900">Education #{index + 1}</h4>
                          <button
                            onClick={() => removeEducation(index)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="space-y-3">
                          <div className="grid md:grid-cols-2 gap-3">
                            <input
                              type="text"
                              value={edu.degree}
                              onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                              className="input-field w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white shadow-sm hover:shadow-md"
                              placeholder="Degree/Qualification"
                            />
                            <input
                              type="text"
                              value={edu.school}
                              onChange={(e) => updateEducation(index, 'school', e.target.value)}
                              className="input-field w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white shadow-sm hover:shadow-md"
                              placeholder="School/University"
                            />
                          </div>
                          <div className="grid md:grid-cols-2 gap-3">
                            <input
                              type="text"
                              value={edu.year}
                              onChange={(e) => updateEducation(index, 'year', e.target.value)}
                              className="input-field w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white shadow-sm hover:shadow-md"
                              placeholder="Year (e.g., 2020-2024)"
                            />
                            <input
                              type="text"
                              value={edu.gpa}
                              onChange={(e) => updateEducation(index, 'gpa', e.target.value)}
                              className="input-field w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white shadow-sm hover:shadow-md"
                              placeholder="GPA (optional)"
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Skills Section */}
                <div className="card-glass">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    ⚡ Skills
                  </h3>
                  <div className="space-y-4">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                        className="input-field flex-1 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white shadow-sm hover:shadow-md"
                        placeholder="Add a skill..."
                      />
                      <button
                        onClick={addSkill}
                        className="btn-primary hover-glow"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {resumeData.skills.map((skill, index) => (
                        <motion.div
                          key={skill}
                          className="bg-gradient-to-r from-purple-100 to-pink-100 px-3 py-1 rounded-full text-sm font-medium text-purple-800 flex items-center space-x-2"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <span>{skill}</span>
                          <button
                            onClick={() => removeSkill(skill)}
                            className="text-purple-600 hover:text-red-600 transition-colors"
                          >
                            ×
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <motion.div 
                  className="flex space-x-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                >
                  <button
                    onClick={saveResumeToDatabase}
                    className="btn-secondary flex-1 hover-glow flex items-center justify-center space-x-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Save Resume</span>
                  </button>
                  <button
                    onClick={downloadResume}
                    className="btn-primary flex-1 hover-glow flex items-center justify-center space-x-2"
                    title="Save to database and download as PDF"
                  >
                    <Download className="w-4 h-4" />
                    <span>Save & Download PDF</span>
                  </button>
                </motion.div>
              </motion.div>

              {/* Live Preview */}
              <motion.div 
                className="lg:sticky lg:top-6"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <div className="card-glass">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    👁️ Live Preview
                  </h3>
                  <div 
                    ref={previewRef}
                    className="bg-white p-8 rounded-lg shadow-sm border min-h-[600px]"
                    style={{ 
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      fontSize: '14px',
                      lineHeight: '1.5'
                    }}
                  >
                    {/* Header */}
                    <div className="border-b-2 border-gray-800 pb-4 mb-6">
                      <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {resumeData.personalInfo.name || 'Your Name'}
                      </h1>
                      <div className="text-sm text-gray-600 space-y-1">
                        {resumeData.personalInfo.email && (
                          <div>📧 {resumeData.personalInfo.email}</div>
                        )}
                        {resumeData.personalInfo.phone && (
                          <div>📞 {resumeData.personalInfo.phone}</div>
                        )}
                        {resumeData.personalInfo.location && (
                          <div>📍 {resumeData.personalInfo.location}</div>
                        )}
                      </div>
                    </div>

                    {/* Summary */}
                    {resumeData.personalInfo.summary && (
                      <div className="mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-300 pb-1 mb-3">
                          Professional Summary
                        </h2>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {resumeData.personalInfo.summary}
                        </p>
                      </div>
                    )}

                    {/* Experience */}
                    {resumeData.experience.length > 0 && (
                      <div className="mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-300 pb-1 mb-3">
                          Work Experience
                        </h2>
                        <div className="space-y-4">
                          {resumeData.experience.map((exp, index) => (
                            <div key={index} className="text-sm">
                              <div className="flex justify-between items-start mb-1">
                                <h3 className="font-semibold text-gray-900">{exp.title}</h3>
                                <span className="text-xs text-gray-500">{exp.duration}</span>
                              </div>
                              <div className="text-gray-600 mb-2 font-medium">{exp.company}</div>
                              <p className="text-gray-700 text-xs leading-relaxed">{exp.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Education */}
                    {resumeData.education.length > 0 && (
                      <div className="mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-300 pb-1 mb-3">
                          Education
                        </h2>
                        <div className="space-y-3">
                          {resumeData.education.map((edu, index) => (
                            <div key={index} className="text-sm">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-semibold text-gray-900">{edu.degree}</h3>
                                  <div className="text-gray-600">{edu.school}</div>
                                </div>
                                <div className="text-right text-xs text-gray-500">
                                  <div>{edu.year}</div>
                                  {edu.gpa && <div>GPA: {edu.gpa}</div>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Skills */}
                    {resumeData.skills.length > 0 && (
                      <div className="mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-300 pb-1 mb-3">
                          Skills
                        </h2>
                        <div className="flex flex-wrap gap-2">
                          {resumeData.skills.map((skill, index) => (
                            <span 
                              key={skill}
                              className="bg-gray-100 px-2 py-1 rounded text-xs font-medium text-gray-700"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {activeTab === 'upload' && (
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              {/* Upload Area */}
              <motion.div 
                className="card-glass"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="border-2 border-dashed border-purple-300 rounded-xl p-12 text-center hover:border-purple-400 transition-colors duration-300">
                  <motion.div
                    className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mb-6"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Upload className="w-10 h-10 text-purple-600" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Upload Your Resume</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Upload your existing resume and we'll store it securely. You can download it anytime.
                  </p>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="resume-upload"
                    accept=".pdf,.doc,.docx"
                  />
                  <div className="flex justify-center">
                    <label
                      htmlFor="resume-upload"
                      className="btn-primary hover-glow cursor-pointer"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Choose File
                    </label>
                  </div>
                  <p className="text-sm text-gray-500 mt-4">Supported formats: PDF, DOC, DOCX (Max 5MB)</p>
                </div>
              </motion.div>

              {/* Uploaded Resumes */}
              <motion.div 
                className="card-glass"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    📁 My Resumes
                  </h3>
                  <span className="text-sm text-gray-500">
                    {uploadedResumes.length} resume{uploadedResumes.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-4">
                  {uploadedResumes.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No resumes uploaded yet</p>
                      <p className="text-sm text-gray-400">Upload your first resume to get started</p>
                    </div>
                  ) : (
                    uploadedResumes.map((resume, index) => (
                      <motion.div 
                        key={resume.id} 
                        className="glass-secondary p-4 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5 text-purple-600" />
                              </div>
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900">{resume.name}</h4>
                              <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                                <span>📅 {resume.uploadDate}</span>
                                <span>📊 {resume.size}</span>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  resume.status === 'Primary' 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {resume.status}
                                </span>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  resume.type === 'uploaded' 
                                    ? 'bg-purple-100 text-purple-700' 
                                    : 'bg-orange-100 text-orange-700'
                                }`}>
                                  {resume.type}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className="flex items-center justify-end mb-1">
                                <Star className="w-4 h-4 text-yellow-400 mr-1" />
                                <span className="text-sm font-semibold text-gray-900">{resume.score}%</span>
                              </div>
                              <p className="text-xs text-gray-500">Quality Score</p>
                            </div>
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => downloadResumeFile(resume)}
                                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200"
                                title="Download Resume"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => deleteResume(resume.resume_id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                title="Delete Resume"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default Resume;