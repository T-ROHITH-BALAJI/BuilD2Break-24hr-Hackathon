// Validation middleware for common input validation

export const validateJobPosting = (req, res, next) => {
  const { title, job_description, salary, company, min_experience, skills_required } = req.body;
  
  const errors = [];
  
  if (!title || title.trim().length < 3) {
    errors.push('Job title is required and must be at least 3 characters');
  }
  
  if (!job_description || job_description.trim().length < 10) {
    errors.push('Job description is required and must be at least 10 characters');
  }
  
  if (!company || company.trim().length < 2) {
    errors.push('Company name is required and must be at least 2 characters');
  }
  
  if (salary && (isNaN(salary) || salary < 0)) {
    errors.push('Salary must be a positive number');
  }
  
  if (min_experience && (isNaN(min_experience) || min_experience < 0)) {
    errors.push('Minimum experience must be a positive number');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }
  
  next();
};

export const validateResumeData = (req, res, next) => {
  const { statement_profile, linkedin_url, github_url } = req.body;
  
  const errors = [];
  
  if (statement_profile && statement_profile.length > 2000) {
    errors.push('Professional summary must be less than 2000 characters');
  }
  
  if (linkedin_url && !isValidUrl(linkedin_url)) {
    errors.push('LinkedIn URL must be a valid URL');
  }
  
  if (github_url && !isValidUrl(github_url)) {
    errors.push('GitHub URL must be a valid URL');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }
  
  next();
};

export const validateExperienceData = (req, res, next) => {
  const { company, duration, job_title, description } = req.body;
  
  const errors = [];
  
  if (!company || company.trim().length < 2) {
    errors.push('Company name is required and must be at least 2 characters');
  }
  
  if (!job_title || job_title.trim().length < 2) {
    errors.push('Job title is required and must be at least 2 characters');
  }
  
  if (!duration || duration.trim().length < 3) {
    errors.push('Duration is required and must be at least 3 characters');
  }
  
  if (description && description.length > 1000) {
    errors.push('Description must be less than 1000 characters');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }
  
  next();
};

export const validateEducationData = (req, res, next) => {
  const { qualification, college, gpa, start_date, end_date } = req.body;
  
  const errors = [];
  
  if (!qualification || qualification.trim().length < 2) {
    errors.push('Qualification is required and must be at least 2 characters');
  }
  
  if (!college || college.trim().length < 2) {
    errors.push('College name is required and must be at least 2 characters');
  }
  
  if (gpa && (isNaN(gpa) || gpa < 0 || gpa > 4)) {
    errors.push('GPA must be a number between 0 and 4');
  }
  
  if (start_date && !isValidDate(start_date)) {
    errors.push('Start date must be a valid date');
  }
  
  if (end_date && !isValidDate(end_date)) {
    errors.push('End date must be a valid date');
  }
  
  if (start_date && end_date && new Date(start_date) > new Date(end_date)) {
    errors.push('Start date must be before end date');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }
  
  next();
};

// Helper functions
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

function isValidDate(dateString) {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

// Sanitize input data
export const sanitizeInput = (req, res, next) => {
  // Remove any potential XSS or SQL injection attempts
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  };

  const sanitizeObject = (obj) => {
    if (obj === null || typeof obj !== 'object') return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = typeof obj[key] === 'string' ? sanitizeString(obj[key]) : sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  };

  req.body = sanitizeObject(req.body);
  req.query = sanitizeObject(req.query);
  req.params = sanitizeObject(req.params);
  
  next();
};
