import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Download,
  Eye,
  Edit,
  FileText,
  Plus,
  Trash2,
  Star,
  Award,
  Briefcase,
  GraduationCap,
  Mail,
  Phone,
  MapPin,
  Globe,
  Linkedin,
  Github
} from 'lucide-react';

// Add the famine theme
const famine = {
  primary: '#8b5cf6',
  primaryLight: '#c4b5fd',
  primaryDark: '#312e81',
  secondary: '#f1f5f9',
  secondaryLight: '#e0e7ef',
  accent: '#f472b6',
  backgroundGlass: 'rgba(255, 255, 255, 0.85)',
  glassBlur: '18px',
  glassSaturate: '160%',
  borderGlass: 'rgba(139, 92, 246, 0.13)',
  shadowGlass: '0 4px 24px 0 rgba(139, 92, 246, 0.10)',
  textMain: '#312e81',
  textSecondary: '#64748b',
  textAccent: '#f472b6',
  danger: '#ef4444',
  dangerLight: '#fca5a5',
};

const Resume = () => {
  const [activeTab, setActiveTab] = useState('builder');
  const [resumeData, setResumeData] = useState({
    personalInfo: {
      name: 'John Doe',
      email: 'john.doe@email.com',
      phone: '+1 (555) 123-4567',
      location: 'San Francisco, CA',
      website: 'www.johndoe.com',
      linkedin: 'linkedin.com/in/johndoe',
      github: 'github.com/johndoe',
      summary: 'Experienced software developer with 5+ years in full-stack development...'
    },
    experience: [
      {
        id: 1,
        title: 'Senior Frontend Developer',
        company: 'TechCorp Inc.',
        duration: 'Jan 2022 - Present',
        description: 'Led development of user-facing features using React and TypeScript...',
        achievements: ['Improved page load speed by 40%', 'Led team of 3 developers']
      }
    ],
    education: [
      {
        id: 1,
        degree: 'Bachelor of Computer Science',
        institution: 'University of California',
        duration: '2015 - 2019',
        gpa: '3.8/4.0'
      }
    ],
    skills: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS', 'Docker'],
    certifications: [
      {
        id: 1,
        name: 'AWS Certified Developer',
        issuer: 'Amazon Web Services',
        date: '2023'
      }
    ]
  });

  const [uploadedResumes, setUploadedResumes] = useState([
    {
      id: 1,
      name: 'Frontend_Developer_Resume.pdf',
      uploadDate: '2024-01-15',
      size: '245 KB',
      status: 'Active',
      score: 85
    },
    {
      id: 2,
      name: 'Software_Engineer_Resume.pdf',
      uploadDate: '2024-01-10',
      size: '198 KB',
      status: 'Draft',
      score: 78
    }
  ]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Handle file upload logic
      console.log('Uploading file:', file.name);
    }
  };

  const addExperience = () => {
    const newExp = {
      id: Date.now(),
      title: '',
      company: '',
      duration: '',
      description: '',
      achievements: []
    };
    setResumeData({
      ...resumeData,
      experience: [...resumeData.experience, newExp]
    });
  };

  const deleteExperience = (id) => {
    setResumeData({
      ...resumeData,
      experience: resumeData.experience.filter(exp => exp.id !== id)
    });
  };

  return (
    <motion.div 
      className="space-y-6 p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <motion.div 
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-4xl font-bold text-gradient mb-2">✨ Resume Builder</h1>
          <p className="text-gray-600">Create and manage your professional resume with glassmorphism design</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button className="btn-primary hover-glow flex items-center gap-2">
            <Download className="w-4 h-4" />
            Download PDF
          </button>
          <button className="btn-secondary hover-lift flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Preview
          </button>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div 
        className="glass-card p-1"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <nav className="flex space-x-2">
          <button
            onClick={() => setActiveTab('builder')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-300 ${
              activeTab === 'builder'
                ? 'glass-card text-purple-700 shadow-lg'
                : 'text-gray-500 hover:text-gray-700 hover:bg-white hover:bg-opacity-50'
            }`}
          >
            🛠️ Resume Builder
          </button>
          <button
            onClick={() => setActiveTab('uploads')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-300 ${
              activeTab === 'uploads'
                ? 'glass-card text-purple-700 shadow-lg'
                : 'text-gray-500 hover:text-gray-700 hover:bg-white hover:bg-opacity-50'
            }`}
          >
            📄 Uploaded Resumes
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-300 ${
              activeTab === 'templates'
                ? 'glass-card text-purple-700 shadow-lg'
                : 'text-gray-500 hover:text-gray-700 hover:bg-white hover:bg-opacity-50'
            }`}
          >
            🎨 Templates
          </button>
        </nav>
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'builder' && (
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.4 }}
          >
            {/* Resume Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <motion.div 
                className="card-glass animate-fade-in"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  👤 Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={resumeData.personalInfo.name}
                      onChange={(e) => setResumeData({
                        ...resumeData,
                        personalInfo: { ...resumeData.personalInfo, name: e.target.value }
                      })}
                      className="input-glass w-full"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={resumeData.personalInfo.email}
                      onChange={(e) => setResumeData({
                        ...resumeData,
                        personalInfo: { ...resumeData.personalInfo, email: e.target.value }
                      })}
                      className="input-glass w-full"
                      placeholder="your.email@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={resumeData.personalInfo.phone}
                      onChange={(e) => setResumeData({
                        ...resumeData,
                        personalInfo: { ...resumeData.personalInfo, phone: e.target.value }
                      })}
                      className="input-glass w-full"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <input
                      type="text"
                      value={resumeData.personalInfo.location}
                      onChange={(e) => setResumeData({
                        ...resumeData,
                        personalInfo: { ...resumeData.personalInfo, location: e.target.value }
                      })}
                      className="input-glass w-full"
                      placeholder="City, State"
                    />
                  </div>
                </div>
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Professional Summary</label>
                  <textarea
                    rows={4}
                    value={resumeData.personalInfo.summary}
                    onChange={(e) => setResumeData({
                      ...resumeData,
                      personalInfo: { ...resumeData.personalInfo, summary: e.target.value }
                    })}
                    className="input-glass w-full resize-none"
                    placeholder="Write a compelling professional summary that highlights your key achievements and career goals..."
                  />
                </div>
              </motion.div>

              {/* Experience */}
              <motion.div 
                className="card-glass animate-fade-in"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    💼 Work Experience
                  </h3>
                  <button
                    onClick={addExperience}
                    className="btn-primary hover-glow flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Experience
                  </button>
                </div>
                <div className="space-y-6">
                  {resumeData.experience.map((exp, index) => (
                    <motion.div 
                      key={exp.id} 
                      className="glass-secondary p-4 rounded-xl border border-gray-200"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                          ✨ Experience {index + 1}
                        </h4>
                        <button
                          onClick={() => deleteExperience(exp.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all duration-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                          <input
                            type="text"
                            value={exp.title}
                            className="input-glass w-full"
                            placeholder="e.g. Senior Developer"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                          <input
                            type="text"
                            value={exp.company}
                            className="input-glass w-full"
                            placeholder="e.g. TechCorp Inc."
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                        <input
                          type="text"
                          value={exp.duration}
                          className="input-glass w-full"
                          placeholder="e.g. Jan 2022 - Present"
                        />
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                          rows={3}
                          value={exp.description}
                          className="input-glass w-full resize-none"
                          placeholder="Describe your role, responsibilities, and key achievements..."
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Skills */}
              <motion.div 
                className="card-glass animate-fade-in"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  🚀 Skills
                </h3>
                <div className="flex flex-wrap gap-3 mb-6">
                  {resumeData.skills.map((skill, index) => (
                    <motion.span
                      key={index}
                      className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border border-purple-200 hover:shadow-lg transition-all duration-200"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      {skill}
                      <button className="ml-2 text-purple-600 hover:text-purple-800 hover:bg-purple-200 rounded-full p-1 transition-all duration-200">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </motion.span>
                  ))}
                </div>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    placeholder="Add a new skill..."
                    className="input-glass flex-1"
                  />
                  <button className="btn-primary hover-glow">
                    Add Skill
                  </button>
                </div>
              </motion.div>
            </div>

          {/* Resume Preview */}
          <div className="bg-white rounded-lg shadow border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Resume Preview</h3>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 min-h-96">
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">{resumeData.personalInfo.name}</h2>
                <div className="text-sm text-gray-600 space-y-1 mt-2">
                  <div className="flex items-center justify-center">
                    <Mail className="w-4 h-4 mr-1" />
                    {resumeData.personalInfo.email}
                  </div>
                  <div className="flex items-center justify-center">
                    <Phone className="w-4 h-4 mr-1" />
                    {resumeData.personalInfo.phone}
                  </div>
                  <div className="flex items-center justify-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {resumeData.personalInfo.location}
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Professional Summary</h3>
                <p className="text-sm text-gray-700">{resumeData.personalInfo.summary}</p>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Experience</h3>
                {resumeData.experience.map((exp, index) => (
                  <div key={index} className="mb-3">
                    <h4 className="font-medium text-gray-900">{exp.title}</h4>
                    <p className="text-sm text-gray-600">{exp.company} • {exp.duration}</p>
                    <p className="text-sm text-gray-700 mt-1">{exp.description}</p>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Skills</h3>
                <div className="flex flex-wrap gap-1">
                  {resumeData.skills.map((skill, index) => (
                    <span key={index} className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {activeTab === 'uploads' && (
        <div className="space-y-6">
          {/* Upload Area */}
          <div className="bg-white rounded-lg shadow border p-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Your Resume</h3>
              <p className="text-gray-600 mb-4">Drag and drop your resume file or click to browse</p>
              <input
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                id="resume-upload"
                accept=".pdf,.doc,.docx"
              />
              <label
                htmlFor="resume-upload"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer font-medium"
              >
                Choose File
              </label>
              <p className="text-sm text-gray-500 mt-2">Supported formats: PDF, DOC, DOCX (Max 5MB)</p>
            </div>
          </div>

          {/* Uploaded Resumes */}
          <div className="bg-white rounded-lg shadow border">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Your Resumes</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {uploadedResumes.map((resume) => (
                <div key={resume.id} className="p-6 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <FileText className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{resume.name}</h4>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-gray-500">Uploaded: {resume.uploadDate}</span>
                        <span className="text-sm text-gray-500">Size: {resume.size}</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          resume.status === 'Active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {resume.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 mr-1" />
                        <span className="text-sm font-medium text-gray-900">Score: {resume.score}%</span>
                      </div>
                      <p className="text-xs text-gray-500">ATS Optimized</p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((template) => (
            <div key={template} className="bg-white rounded-lg shadow border overflow-hidden">
              <div className="h-48 bg-gray-100 flex items-center justify-center">
                <FileText className="w-16 h-16 text-gray-400" />
              </div>
              <div className="p-4">
                <h3 className="font-medium text-gray-900">Professional Template {template}</h3>
                <p className="text-sm text-gray-600 mt-1">Clean and modern design perfect for tech roles</p>
                <div className="mt-4 flex space-x-2">
                  <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                    Use Template
                  </button>
                  <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">
                    Preview
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default Resume;
