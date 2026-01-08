import rateLimit from 'express-rate-limit';
import { body, param, validationResult } from 'express-validator';
import xss from 'xss';

/**
 * Rate limiting middleware for authentication endpoints
 * Prevents brute force attacks on login/register
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development', // Disable in development
});

/**
 * General API rate limiter for all requests
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development',
});

/**
 * Validation middleware for registration
 */
export const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  
  body('email')
    .trim()
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),
  
  body('role')
    .isIn(['jobseeker', 'job_seeker', 'recruiter']).withMessage('Invalid role'),
  
  body('phone')
    .optional()
    .trim(),
];

/**
 * Validation middleware for login
 */
export const validateLogin = [
  body('email')
    .trim()
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required'),
];

/**
 * Middleware to handle validation errors
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

/**
 * XSS protection middleware - sanitizes user input
 */
export const sanitizeInputs = (req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key]);
      }
    });
  }
  next();
};

/**
 * Parameter validation for numeric IDs
 */
export const validateNumericId = param('id')
  .isInt({ min: 1 }).withMessage('Invalid ID format');

/**
 * Environment validation on startup
 */
export function validateEnvironment() {
  const requiredEnvVars = [
    'PORT',
    'DB_USER',
    'DB_HOST',
    'DB_NAME',
    'DB_PASSWORD',
    'DB_PORT',
    'JWT_SECRET',
  ];

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    console.error('Please check your .env file and ensure all required variables are set.');
    process.exit(1);
  }

  // Validate JWT_SECRET strength
  if (process.env.JWT_SECRET.length < 32) {
    console.warn('WARNING: JWT_SECRET is weak (less than 32 characters). Please use a stronger secret.');
    if (process.env.NODE_ENV === 'production') {
      console.error('Cannot start in production with weak JWT_SECRET');
      process.exit(1);
    }
  }

  console.log('✓ Environment variables validated');
}

/**
 * CSRF Token middleware (for future form submissions)
 */
export const generateCSRFToken = (req, res, next) => {
  // In a real implementation, you would generate and store CSRF tokens
  // For APIs using JWTs, CSRF is less critical, but can be added for additional security
  next();
};
