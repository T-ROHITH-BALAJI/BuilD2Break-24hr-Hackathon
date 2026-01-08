import pool from '../db.js';
import dotenv from 'dotenv';

dotenv.config();

// Simulated AI analysis function
// In production, you would integrate with OpenAI, Google AI, or another service
const analyzeResumeWithAI = async (resumeData, jobDescription) => {
  // If you have an OpenAI API key, uncomment and use this:
  /*
  if (process.env.OPENAI_API_KEY) {
    const OpenAI = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an ATS (Applicant Tracking System) analyzer. Analyze the resume against the job description and provide a score and suggestions."
          },
          {
            role: "user",
            content: `Resume: ${JSON.stringify(resumeData)}\n\nJob Description: ${jobDescription}\n\nProvide analysis with score, matched keywords, missing keywords, and suggestions.`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      const response = completion.choices[0].message.content;
      // Parse the AI response and return structured data
      return parseAIResponse(response);
    } catch (error) {
      console.error('OpenAI API error:', error);
      // Fall back to local analysis
    }
  }
  */

  // Enhanced local analysis algorithm
  const analysis = performLocalAnalysis(resumeData, jobDescription);
  return analysis;
};

const performLocalAnalysis = (resumeData, jobDescription) => {
  const scores = {
    keywordMatch: 0,
    formatting: 0,
    completeness: 0,
    readability: 0,
    overallScore: 0
  };

  // Extract text from resume
  const resumeText = extractResumeText(resumeData).toLowerCase();
  
  // Extract keywords from job description
  const jobKeywords = extractKeywords(jobDescription);
  
  // Calculate keyword match score
  const matchedKeywords = [];
  const missingKeywords = [];
  
  jobKeywords.forEach(keyword => {
    if (resumeText.includes(keyword.toLowerCase())) {
      matchedKeywords.push(keyword);
    } else {
      missingKeywords.push(keyword);
    }
  });
  
  scores.keywordMatch = Math.min(100, (matchedKeywords.length / Math.max(jobKeywords.length, 1)) * 100);
  
  // Calculate completeness score
  let completenessPoints = 0;
  if (resumeData.statement_profile) completenessPoints += 20;
  if (resumeData.experiences && resumeData.experiences.length > 0) completenessPoints += 30;
  if (resumeData.education && resumeData.education.length > 0) completenessPoints += 20;
  if (resumeData.skills && resumeData.skills.length > 0) completenessPoints += 20;
  if (resumeData.linkedin_url || resumeData.github_url) completenessPoints += 10;
  scores.completeness = completenessPoints;
  
  // Calculate formatting score (simulated)
  scores.formatting = 85; // Base score
  if (resumeData.statement_profile && resumeData.statement_profile.length > 500) {
    scores.formatting -= 10; // Too long summary
  }
  
  // Calculate readability score
  scores.readability = calculateReadability(resumeText);
  
  // Calculate overall score
  scores.overallScore = Math.round(
    (scores.keywordMatch * 0.4 + 
     scores.completeness * 0.3 + 
     scores.formatting * 0.15 + 
     scores.readability * 0.15)
  );
  
  // Generate suggestions
  const suggestions = generateSuggestions(resumeData, scores, missingKeywords);
  
  // Industry-specific insights
  const industryInsights = generateIndustryInsights(jobDescription);
  
  return {
    scores,
    matchedKeywords: matchedKeywords.slice(0, 15),
    missingKeywords: missingKeywords.slice(0, 10),
    suggestions,
    industryInsights,
    sections: {
      contact: { 
        score: resumeData.email ? 100 : 0, 
        status: resumeData.email ? 'complete' : 'missing' 
      },
      summary: { 
        score: resumeData.statement_profile ? 85 : 0, 
        status: resumeData.statement_profile ? 'good' : 'missing' 
      },
      experience: { 
        score: (resumeData.experiences && resumeData.experiences.length > 0) ? 90 : 0,
        status: (resumeData.experiences && resumeData.experiences.length > 0) ? 'good' : 'missing'
      },
      education: { 
        score: (resumeData.education && resumeData.education.length > 0) ? 85 : 0,
        status: (resumeData.education && resumeData.education.length > 0) ? 'good' : 'missing'
      },
      skills: { 
        score: (resumeData.skills && resumeData.skills.length > 0) ? 80 : 0,
        status: (resumeData.skills && resumeData.skills.length > 0) ? 'good' : 'needs_improvement'
      }
    }
  };
};

const extractResumeText = (resumeData) => {
  let text = '';
  
  if (resumeData.statement_profile) text += resumeData.statement_profile + ' ';
  
  if (resumeData.experiences) {
    resumeData.experiences.forEach(exp => {
      text += `${exp.job_title} ${exp.company} ${exp.description} `;
    });
  }
  
  if (resumeData.education) {
    resumeData.education.forEach(edu => {
      text += `${edu.qualification} ${edu.college} `;
    });
  }
  
  if (resumeData.skills) {
    resumeData.skills.forEach(skillSet => {
      if (Array.isArray(skillSet.skills)) {
        text += skillSet.skills.join(' ') + ' ';
      }
    });
  }
  
  return text;
};

const extractKeywords = (jobDescription) => {
  if (!jobDescription) return [];
  
  // Common technical skills and keywords
  const techKeywords = [
    'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'AWS', 'Docker',
    'Kubernetes', 'Git', 'Agile', 'Scrum', 'TypeScript', 'Angular', 'Vue',
    'MongoDB', 'PostgreSQL', 'MySQL', 'REST API', 'GraphQL', 'CI/CD',
    'Machine Learning', 'Data Science', 'DevOps', 'Cloud', 'Microservices'
  ];
  
  // Extract keywords from job description
  const words = jobDescription.split(/\s+/);
  const keywords = [];
  
  // Check for technical keywords
  techKeywords.forEach(keyword => {
    if (jobDescription.toLowerCase().includes(keyword.toLowerCase())) {
      keywords.push(keyword);
    }
  });
  
  // Extract years of experience requirements
  const expMatch = jobDescription.match(/(\d+)\+?\s*years?/gi);
  if (expMatch) {
    keywords.push(expMatch[0]);
  }
  
  // Extract degree requirements
  const degreeKeywords = ['Bachelor', 'Master', 'PhD', 'Degree', 'BS', 'MS'];
  degreeKeywords.forEach(degree => {
    if (jobDescription.toLowerCase().includes(degree.toLowerCase())) {
      keywords.push(degree);
    }
  });
  
  // Extract other important words (4+ characters, not common words)
  const commonWords = ['this', 'that', 'with', 'from', 'have', 'will', 'your', 'what', 'when', 'where'];
  words.forEach(word => {
    const cleanWord = word.replace(/[^a-zA-Z0-9]/g, '');
    if (cleanWord.length >= 4 && !commonWords.includes(cleanWord.toLowerCase()) && !keywords.includes(cleanWord)) {
      keywords.push(cleanWord);
    }
  });
  
  return [...new Set(keywords)].slice(0, 20);
};

const calculateReadability = (text) => {
  if (!text) return 0;
  
  const sentences = text.split(/[.!?]+/).filter(s => s.length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const syllables = words.reduce((count, word) => count + countSyllables(word), 0);
  
  if (sentences.length === 0 || words.length === 0) return 50;
  
  // Flesch Reading Ease formula (simplified)
  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;
  
  let score = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
  score = Math.max(0, Math.min(100, score));
  
  return Math.round(score);
};

const countSyllables = (word) => {
  word = word.toLowerCase();
  let count = 0;
  let previousWasVowel = false;
  const vowels = 'aeiouy';
  
  for (let i = 0; i < word.length; i++) {
    const isVowel = vowels.includes(word[i]);
    if (isVowel && !previousWasVowel) {
      count++;
    }
    previousWasVowel = isVowel;
  }
  
  // Adjust for silent e
  if (word.endsWith('e')) {
    count--;
  }
  
  // Ensure at least one syllable
  if (count === 0) {
    count = 1;
  }
  
  return count;
};

const generateSuggestions = (resumeData, scores, missingKeywords) => {
  const suggestions = [];
  
  if (!resumeData.statement_profile) {
    suggestions.push({
      type: 'critical',
      category: 'summary',
      message: 'Add a professional summary to highlight your key qualifications and career objectives',
      impact: 'High'
    });
  } else if (resumeData.statement_profile.length < 50) {
    suggestions.push({
      type: 'warning',
      category: 'summary',
      message: 'Expand your professional summary to better showcase your value proposition',
      impact: 'Medium'
    });
  }
  
  if (!resumeData.experiences || resumeData.experiences.length === 0) {
    suggestions.push({
      type: 'critical',
      category: 'experience',
      message: 'Add your work experience with quantifiable achievements and responsibilities',
      impact: 'High'
    });
  } else if (resumeData.experiences.length === 1) {
    suggestions.push({
      type: 'info',
      category: 'experience',
      message: 'Consider adding more relevant work experiences or projects',
      impact: 'Low'
    });
  }
  
  if (missingKeywords.length > 0) {
    suggestions.push({
      type: 'warning',
      category: 'keywords',
      message: `Include these missing keywords: ${missingKeywords.slice(0, 5).join(', ')}`,
      impact: 'High'
    });
  }
  
  if (scores.keywordMatch < 50) {
    suggestions.push({
      type: 'critical',
      category: 'optimization',
      message: 'Your resume needs better alignment with the job requirements. Review and incorporate relevant keywords',
      impact: 'High'
    });
  }
  
  if (!resumeData.skills || resumeData.skills.length === 0) {
    suggestions.push({
      type: 'warning',
      category: 'skills',
      message: 'Add a skills section highlighting your technical and soft skills',
      impact: 'Medium'
    });
  }
  
  if (scores.readability < 60) {
    suggestions.push({
      type: 'info',
      category: 'readability',
      message: 'Simplify your language and use shorter sentences for better readability',
      impact: 'Low'
    });
  }
  
  // Add positive feedback if score is good
  if (scores.overallScore >= 80) {
    suggestions.push({
      type: 'success',
      category: 'overall',
      message: 'Great job! Your resume is well-optimized for ATS systems',
      impact: 'Positive'
    });
  }
  
  return suggestions;
};

const generateIndustryInsights = (jobDescription) => {
  const insights = [];
  
  // Tech industry insights
  if (jobDescription && jobDescription.toLowerCase().includes('software')) {
    insights.push('Tech roles often value GitHub profiles and open source contributions');
    insights.push('Include specific technologies and version numbers when applicable');
  }
  
  // Management insights
  if (jobDescription && jobDescription.toLowerCase().includes('manager')) {
    insights.push('Leadership experience and team size metrics are crucial');
    insights.push('Include budget management and project success metrics');
  }
  
  // Data science insights
  if (jobDescription && (jobDescription.toLowerCase().includes('data') || jobDescription.toLowerCase().includes('analyst'))) {
    insights.push('Highlight specific tools like Python, R, SQL, and visualization platforms');
    insights.push('Include metrics on data processing volume and impact');
  }
  
  if (insights.length === 0) {
    insights.push('Tailor your resume to match industry-specific keywords');
    insights.push('Use action verbs and quantify your achievements');
    insights.push('Keep your resume concise and relevant to the position');
  }
  
  return insights;
};

// ATS Analysis Endpoint
export const analyzeResume = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { jobDescription, resumeId } = req.body;
    
    // Get job seeker's resume
    let resumeData;
    if (resumeId) {
      const resumeResult = await pool.query(
        `SELECT r.*, 
          json_agg(DISTINCT e.*) as experiences,
          json_agg(DISTINCT ed.*) as education,
          json_agg(DISTINCT s.*) as skills
         FROM resumes r
LEFT JOIN experiences e ON r.resume_id = e.resume_id
         LEFT JOIN education ed ON r.resume_id = ed.resume_id
         LEFT JOIN skills s ON r.resume_id = s.resume_id
         WHERE r.resume_id = $1
         GROUP BY r.resume_id`,
        [resumeId]
      );
      resumeData = resumeResult.rows[0];
    } else {
      // Get default resume
      const seekerResult = await pool.query(
        'SELECT seeker_id FROM job_seekers WHERE user_id = $1',
        [user_id]
      );
      
      if (seekerResult.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Job seeker profile not found' });
      }
      
      const seeker_id = seekerResult.rows[0].seeker_id;
      
      const resumeResult = await pool.query(
        `SELECT r.*, 
          json_agg(DISTINCT e.*) as experiences,
          json_agg(DISTINCT ed.*) as education,
          json_agg(DISTINCT s.*) as skills,
          u.email, u.name, u.phone_no
         FROM resumes r
LEFT JOIN experiences e ON r.resume_id = e.resume_id
         LEFT JOIN education ed ON r.resume_id = ed.resume_id
         LEFT JOIN skills s ON r.resume_id = s.resume_id
         JOIN job_seekers js ON r.seeker_id = js.seeker_id
         JOIN users u ON js.user_id = u.user_id
         WHERE r.seeker_id = $1 AND (r.is_primary = true OR r.resume_id = (
           SELECT resume_id FROM resumes WHERE seeker_id = $1 ORDER BY created_at DESC LIMIT 1
         ))
         GROUP BY r.resume_id, u.email, u.name, u.phone_no
         LIMIT 1`,
        [seeker_id]
      );
      
      if (resumeResult.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'No resume found' });
      }
      
      resumeData = resumeResult.rows[0];
    }
    
    // Analyze resume with AI or local algorithm
    const analysis = await analyzeResumeWithAI(resumeData, jobDescription);
    
    // Store analysis history (optional)
    await pool.query(
      `INSERT INTO ats_analysis_history (user_id, resume_id, job_description, overall_score, analysis_data, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT DO NOTHING`,
      [user_id, resumeData.resume_id, jobDescription, analysis.scores.overallScore, JSON.stringify(analysis)]
    ).catch(() => {
      // Table might not exist, ignore error
    });
    
    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('Error analyzing resume:', error);
    res.status(500).json({ success: false, error: 'Failed to analyze resume' });
  }
};

// Get ATS Tips
export const getATSTips = async (req, res) => {
  try {
    const tips = [
      {
        category: 'Format',
        tips: [
          'Use standard fonts like Arial, Calibri, or Times New Roman',
          'Stick to simple formatting - avoid tables, columns, or graphics',
          'Save your resume as .docx or .pdf (check job posting preference)',
          'Use standard section headers like "Experience" and "Education"'
        ]
      },
      {
        category: 'Keywords',
        tips: [
          'Mirror the exact keywords from the job description',
          'Include both acronyms and full terms (e.g., "AI" and "Artificial Intelligence")',
          'Use industry-standard job titles',
          'Include relevant certifications and tools'
        ]
      },
      {
        category: 'Content',
        tips: [
          'Start bullet points with action verbs',
          'Quantify achievements with numbers and percentages',
          'Include a skills section with relevant technical skills',
          'Keep your resume to 2 pages maximum for most roles'
        ]
      },
      {
        category: 'Optimization',
        tips: [
          'Tailor your resume for each application',
          'Place most important information in the top third',
          'Use consistent date formatting throughout',
          'Avoid headers, footers, and page numbers'
        ]
      }
    ];
    
    res.json({
      success: true,
      tips
    });
  } catch (error) {
    console.error('Error getting ATS tips:', error);
    res.status(500).json({ success: false, error: 'Failed to get ATS tips' });
  }
};

export default {
  analyzeResume,
  getATSTips
};