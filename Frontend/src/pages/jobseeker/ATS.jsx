import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import toast from 'react-hot-toast';
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Target,
  Award,
  Lightbulb,
  Download,
  RotateCcw
} from 'lucide-react';

// Glassmorphism and elegant color palette
const glassBg = "bg-white/30 backdrop-blur-md border border-white/30 shadow-xl";
const glassCard = `rounded-2xl ${glassBg} p-6 transition-shadow hover:shadow-2xl`;
const accent = "from-[#f8fafc] via-[#f1f5f9] to-[#e0e7ef]";
const gradientText = "bg-gradient-to-r from-[#7f53ac] via-[#647dee] to-[#43cea2] bg-clip-text text-transparent";
const accentBtn = "bg-gradient-to-r from-[#43cea2] to-[#185a9d] text-white shadow-lg hover:scale-105 transition-transform";
const accentBtn2 = "bg-gradient-to-r from-[#f7971e] to-[#ffd200] text-gray-900 shadow-lg hover:scale-105 transition-transform";
const subtleText = "text-gray-700/80";
const glassInput = "bg-white/40 backdrop-blur rounded-lg border border-white/30 focus:ring-2 focus:ring-[#43cea2] focus:border-[#43cea2] transition-all";

const ATS = () => {
  const [uploadedResume, setUploadedResume] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userResume, setUserResume] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(true);

  // Load user's resume data
  useEffect(() => {
    const loadUserResume = async () => {
      setResumeLoading(true);
      try {
        const res = await client.get('/api/jobseeker/resume');
        if (res.data?.success) {
          setUserResume(res.data.resume);
        }
      } catch (e) {
        console.error('Error loading resume:', e);
      } finally {
        setResumeLoading(false);
      }
    };
    loadUserResume();
  }, []);

  const handleResumeUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedResume(file);
      // Auto-analyze when file is uploaded
      setTimeout(() => {
        analyzeResume();
      }, 1000);
    }
  };

  const analyzeResume = async () => {
    if (!userResume && !uploadedResume) {
      toast.error('Please upload a resume or create one first');
      return;
    }
    
    setLoading(true);
    try {
      const res = await client.post('/api/jobseeker/ats/analyze', {
        jobDescription: jobDescription || ''
      });
      
      if (res.data?.success) {
        const a = res.data.analysis || {};
        // Normalize backend shape (scores nested) to UI shape
        const normalized = a.scores ? {
          overallScore: a.scores.overallScore ?? 0,
          keywordMatch: a.scores.keywordMatch ?? 0,
          formatting: a.scores.formatting ?? 0,
          completeness: a.scores.completeness ?? 0,
          readability: a.scores.readability ?? 0,
          matchedKeywords: a.matchedKeywords || [],
          missingKeywords: a.missingKeywords || [],
          suggestions: a.suggestions || [],
          sections: a.sections || {}
        } : a;
        setAnalysis(normalized);
        toast.success('Resume analysis complete!');
      } else {
        // Fallback to local analysis
        const analysis = generateResumeAnalysis(userResume, jobDescription);
        setAnalysis(analysis);
      }
    } catch (error) {
      console.error('Error analyzing resume:', error);
      // Fallback to local analysis
      const analysis = generateResumeAnalysis(userResume, jobDescription);
      setAnalysis(analysis);
      toast.info('Using local analysis engine');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    // load tips in parallel
    try {
      const t = await client.get('/api/jobseeker/ats/tips');
      if (t.data?.success) setTips(t.data.tips || []);
    } catch {}
    analyzeResume();
  };

  const generateResumeAnalysis = (resume, jobDesc) => {
    // Calculate scores based on actual resume data
    const hasContact = resume.statement_profile ? 1 : 0;
    const hasExperience = resume.experiences && resume.experiences.length > 0 ? 1 : 0;
    const hasEducation = resume.education && resume.education.length > 0 ? 1 : 0;
    const hasSkills = resume.skills && resume.skills.length > 0 ? 1 : 0;
    
    const completeness = ((hasContact + hasExperience + hasEducation + hasSkills) / 4) * 100;
    const keywordMatch = jobDesc ? calculateKeywordMatch(resume, jobDesc) : 75;
    const formatting = 85; // Assume good formatting
    const readability = 90; // Assume good readability
    
    const overallScore = Math.round((completeness + keywordMatch + formatting + readability) / 4);
    
    return {
      overallScore,
      keywordMatch,
      formatting,
      completeness,
      readability,
      suggestions: generateSuggestions(resume, jobDesc),
      matchedKeywords: extractMatchedKeywords(resume, jobDesc),
      missingKeywords: extractMissingKeywords(resume, jobDesc),
      sections: {
        contact: { score: hasContact ? 95 : 0, status: hasContact ? 'excellent' : 'needs_improvement' },
        summary: { score: resume.statement_profile ? 80 : 0, status: resume.statement_profile ? 'good' : 'needs_improvement' },
        experience: { score: hasExperience ? 85 : 0, status: hasExperience ? 'good' : 'needs_improvement' },
        education: { score: hasEducation ? 90 : 0, status: hasEducation ? 'excellent' : 'needs_improvement' },
        skills: { score: hasSkills ? 70 : 0, status: hasSkills ? 'good' : 'needs_improvement' }
      }
    };
  };

  const calculateKeywordMatch = (resume, jobDesc) => {
    // Simple keyword matching logic
    const jobKeywords = jobDesc.toLowerCase().match(/\b\w+\b/g) || [];
    const resumeText = [
      resume.statement_profile || '',
      ...(resume.experiences || []).map(exp => `${exp.job_title} ${exp.description}`).join(' '),
      ...(resume.skills || []).map(skill => skill.skills).flat().join(' ')
    ].join(' ').toLowerCase();
    
    const matched = jobKeywords.filter(keyword => 
      resumeText.includes(keyword) && keyword.length > 3
    ).length;
    
    return Math.min(Math.round((matched / jobKeywords.length) * 100), 100);
  };

  const generateSuggestions = (resume, jobDesc) => {
    const suggestions = [];
    
    if (!resume.statement_profile) {
      suggestions.push({
        type: 'critical',
        message: 'Add a professional summary to highlight your key qualifications',
        impact: 'High'
      });
    }
    
    if (!resume.experiences || resume.experiences.length === 0) {
      suggestions.push({
              type: 'critical',
        message: 'Add your work experience with detailed descriptions',
              impact: 'High'
      });
    }
    
    if (!resume.skills || resume.skills.length === 0) {
      suggestions.push({
        type: 'warning',
        message: 'Add relevant technical and soft skills',
        impact: 'Medium'
      });
    }
    
    if (jobDesc && calculateKeywordMatch(resume, jobDesc) < 60) {
      suggestions.push({
              type: 'warning',
        message: 'Include more keywords from the job description in your resume',
              impact: 'Medium'
      });
    }
    
    if (suggestions.length === 0) {
      suggestions.push({
              type: 'info',
        message: 'Your resume looks well-structured! Consider adding quantifiable achievements.',
              impact: 'Low'
      });
    }
    
    return suggestions;
  };

  const extractMatchedKeywords = (resume, jobDesc) => {
if (!jobDesc) return [];
    
    const jobKeywords = jobDesc.toLowerCase().match(/\b\w+\b/g) || [];
    const resumeText = [
      resume.statement_profile || '',
      ...(resume.experiences || []).map(exp => `${exp.job_title} ${exp.description}`).join(' '),
      ...(resume.skills || []).map(skill => skill.skills).flat().join(' ')
    ].join(' ').toLowerCase();
    
    return jobKeywords.filter(keyword => 
      resumeText.includes(keyword) && keyword.length > 3
    ).slice(0, 10);
  };

  const extractMissingKeywords = (resume, jobDesc) => {
if (!jobDesc) return [];
    
    const jobKeywords = jobDesc.toLowerCase().match(/\b\w+\b/g) || [];
    const resumeText = [
      resume.statement_profile || '',
      ...(resume.experiences || []).map(exp => `${exp.job_title} ${exp.description}`).join(' '),
      ...(resume.skills || []).map(skill => skill.skills).flat().join(' ')
    ].join(' ').toLowerCase();
    
    return jobKeywords.filter(keyword => 
      !resumeText.includes(keyword) && keyword.length > 3
    ).slice(0, 10);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-[#43cea2]';
    if (score >= 60) return 'text-[#ffd200]';
    return 'text-[#ff5858]';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-[#43cea2]/20';
    if (score >= 60) return 'bg-[#ffd200]/20';
    return 'bg-[#ff5858]/20';
  };

  const getSuggestionIcon = (type) => {
    switch (type) {
      case 'critical':
        return <XCircle className="w-5 h-5 text-[#ff5858] animate-pulse" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-[#ffd200] animate-bounce" />;
      case 'info':
        return <CheckCircle className="w-5 h-5 text-[#43cea2] animate-fade-in" />;
      default:
        return <Lightbulb className="w-5 h-5 text-gray-500" />;
    }
  };

  const getSectionStatus = (status) => {
    switch (status) {
      case 'excellent':
        return { color: 'text-[#43cea2]', bg: 'bg-[#43cea2]/20', text: 'Excellent' };
      case 'good':
        return { color: 'text-[#ffd200]', bg: 'bg-[#ffd200]/20', text: 'Good' };
      case 'needs_improvement':
        return { color: 'text-[#ff5858]', bg: 'bg-[#ff5858]/20', text: 'Needs Improvement' };
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-100', text: 'Unknown' };
    }
  };

  return (
    <div className={`min-h-screen py-10 px-2 md:px-8 bg-gradient-to-br ${accent} relative`}>
      {/* Glassy floating shapes for effect */}
      <div className="pointer-events-none fixed top-0 left-0 w-full h-full z-0">
        <div className="absolute top-10 left-10 w-40 h-40 bg-[#43cea2]/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-20 w-56 h-56 bg-[#ffd200]/20 rounded-full blur-3xl animate-float2" />
        <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-[#7f53ac]/20 rounded-full blur-2xl animate-float3" />
      </div>
      <div className="relative z-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className={`text-3xl font-extrabold ${gradientText} tracking-tight drop-shadow-lg`}>
              ATS Resume Scanner
            </h1>
            <p className={`mt-1 ${subtleText} text-lg font-medium`}>
              Optimize your resume to pass Applicant Tracking Systems
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button className={`px-5 py-2 rounded-xl font-semibold shadow-md ${accentBtn2} flex items-center gap-2`}>
              <Target className="w-5 h-5" />
              Resume Tips
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-2 space-y-8">
            {/* Resume Upload */}
            <div className={glassCard}>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Upload Your Resume</h3>
              <div className="border-2 border-dashed border-white/40 rounded-2xl p-8 text-center bg-white/10 hover:bg-white/20 transition-all duration-300">
                <Upload className="w-14 h-14 text-[#43cea2] mx-auto mb-4 animate-bounce" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  {uploadedResume ? uploadedResume.name : 'Drop your resume here'}
                </h4>
                <p className={`${subtleText} mb-4`}>
                  {uploadedResume
                    ? <span className="text-[#43cea2] font-semibold animate-fade-in">Resume uploaded successfully!</span>
                    : 'Drag and drop your resume file or click to browse'
                  }
                </p>
                <input
                  type="file"
                  onChange={handleResumeUpload}
                  className="hidden"
                  id="resume-upload"
                  accept=".pdf,.doc,.docx"
                />
                <label
                  htmlFor="resume-upload"
                  className={`px-5 py-2 rounded-xl font-semibold cursor-pointer ${accentBtn} inline-block`}
                >
                  {uploadedResume ? 'Change Resume' : 'Choose File'}
                </label>
                <p className="text-xs text-gray-500 mt-2">Supported formats: PDF, DOC, DOCX</p>
              </div>
              
              {/* Current Resume Analysis */}
              {userResume && !resumeLoading && (
                <div className="mt-6 p-4 bg-white/20 rounded-xl border border-white/30">
                  <h4 className="font-semibold text-gray-900 mb-2">Or analyze your current resume</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Analyze your existing resume data from your profile
                  </p>
                  <button
                    onClick={analyzeResume}
                    disabled={loading}
                    className={`px-4 py-2 rounded-lg font-semibold ${accentBtn2} disabled:opacity-50`}
                  >
                    {loading ? 'Analyzing...' : 'Analyze Current Resume'}
                  </button>
                </div>
              )}
            </div>

            {/* Job Description */}
            <div className={glassCard}>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Job Description <span className="text-xs text-gray-400">(Optional)</span></h3>
              <textarea
                rows={8}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className={`w-full p-3 ${glassInput} text-gray-900 font-medium`}
                placeholder="Paste the job description here to get targeted optimization suggestions..."
              />
              <div className="mt-4 flex justify-between items-center">
                <p className="text-xs text-gray-500">
                  Adding a job description will provide more targeted feedback
                </p>
                <button
                  onClick={handleAnalyze}
                  disabled={(!uploadedResume && !userResume) || loading}
                  className={`px-5 py-2 rounded-xl font-semibold flex items-center gap-2 shadow-md ${accentBtn} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4" />
                      Analyze Resume
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Analysis Results */}
            {analysis && (
              <div className="space-y-8">
                {/* Overall Score */}
                <div className={glassCard}>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">ATS Compatibility Score</h3>
                  <div className="flex items-center justify-center">
                    <div className="relative w-36 h-36">
                      <svg className="w-36 h-36 transform -rotate-90">
                        <circle
                          cx="72"
                          cy="72"
                          r="62"
                          stroke="currentColor"
                          strokeWidth="10"
                          fill="transparent"
                          className="text-white/40"
                        />
                        <circle
                          cx="72"
                          cy="72"
                          r="62"
                          stroke="url(#score-gradient)"
                          strokeWidth="10"
                          fill="transparent"
                          strokeDasharray={`${2 * Math.PI * 62}`}
                          strokeDashoffset={`${2 * Math.PI * 62 * (1 - analysis.overallScore / 100)}`}
                          className={getScoreColor(analysis.overallScore)}
                          strokeLinecap="round"
                          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.4,2,.6,1)' }}
                        />
                        <defs>
                          <linearGradient id="score-gradient" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#43cea2" />
                            <stop offset="100%" stopColor="#185a9d" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className={`text-4xl font-extrabold ${getScoreColor(analysis.overallScore)} animate-fade-in`}>
                            {analysis.overallScore}%
                          </div>
                          <div className="text-sm text-gray-600">ATS Score</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getScoreColor(analysis.keywordMatch)}`}>
                        {analysis.keywordMatch}%
                      </div>
                      <div className="text-sm text-gray-600">Keywords</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getScoreColor(analysis.formatting)}`}>
                        {analysis.formatting}%
                      </div>
                      <div className="text-sm text-gray-600">Formatting</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getScoreColor(analysis.completeness)}`}>
                        {analysis.completeness}%
                      </div>
                      <div className="text-sm text-gray-600">Completeness</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getScoreColor(analysis.readability)}`}>
                        {analysis.readability}%
                      </div>
                      <div className="text-sm text-gray-600">Readability</div>
                    </div>
                  </div>
                </div>

                {/* Keywords Analysis */}
                <div className={glassCard}>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Keyword Analysis</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-[#43cea2] mb-3">Found Keywords</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.matchedKeywords.map((keyword, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#43cea2]/20 text-[#43cea2] animate-fade-in"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-[#ff5858] mb-3">Missing Keywords</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.missingKeywords.map((keyword, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#ff5858]/20 text-[#ff5858] animate-fade-in"
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Suggestions Sidebar */}
          <div className="space-y-8">
            {analysis && (
              <div className={glassCard}>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#ffd200]" />
                  Optimization Suggestions
                </h3>
                <div className="space-y-4">
                  {analysis.suggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 border border-white/20 rounded-xl bg-white/10 hover:bg-white/20 transition-all">
                      {getSuggestionIcon(suggestion.type)}
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{suggestion.message}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-2 ${
                          suggestion.impact === 'High'
                            ? 'bg-[#ff5858]/20 text-[#ff5858]'
                            : suggestion.impact === 'Medium'
                            ? 'bg-[#ffd200]/20 text-[#ffd200]'
                            : 'bg-[#43cea2]/20 text-[#43cea2]'
                        }`}>
                          {suggestion.impact} Impact
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <button className={`w-full px-4 py-2 rounded-xl font-semibold ${accentBtn2} flex items-center gap-2`}>
                    <Download className="w-4 h-4" />
                    Download Detailed Report
                  </button>
                </div>
              </div>
            )}

            {/* ATS Tips */}
            <div className={glassCard}>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-[#43cea2]" />
                ATS Optimization Tips
              </h3>
              <div className="space-y-3 text-sm text-gray-700">
                {(tips || []).map((group, idx) => (
                  <div key={idx} className="mb-3">
                    {group.category && (
                      <div className="font-semibold text-gray-800 mb-1">{group.category}</div>
                    )}
                    <ul className="list-disc ml-5 space-y-1">
                      {(group.tips || []).map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                ))}
                {!tips?.length && (
                  <p className="text-gray-600">Tips will appear here after analysis.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1);}
          50% { transform: translateY(-20px) scale(1.05);}
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0) scale(1);}
          50% { transform: translateY(20px) scale(1.1);}
        }
        @keyframes float3 {
          0%, 100% { transform: translateX(0) scale(1);}
          50% { transform: translateX(-20px) scale(1.08);}
        }
        .animate-float { animation: float 7s ease-in-out infinite; }
        .animate-float2 { animation: float2 9s ease-in-out infinite; }
        .animate-float3 { animation: float3 11s ease-in-out infinite; }
        .animate-fade-in { animation: fadeIn 1.2s cubic-bezier(.4,2,.6,1); }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px);}
          to { opacity: 1; transform: translateY(0);}
        }
      `}</style>
    </div>
  );
};

export default ATS;
