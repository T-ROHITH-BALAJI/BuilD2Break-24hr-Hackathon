import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react'; // ✅ only these icons are used

const Register = () => {
  const { register: registerUser, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated && user) {
      const roleRoutes = {
        jobseeker: '/jobseeker/dashboard',
        recruiter: '/recruiter/dashboard',
        admin: '/admin/dashboard'
      };
      navigate(roleRoutes[user.role] || '/login');
    }
  }, [isAuthenticated, user, navigate]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      role: '',
      company: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false
    },
    mode: 'onChange'
  });

  const watchPassword = watch('password');
  const watchRole = watch('role');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Only send essential user data according to new schema
      const registrationData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        role: data.role, // Role is already in correct format from the select element
        company: data.company // Required for recruiters
      };

      const result = await registerUser(registrationData);

      if (result.success) {
        toast.success('Registration successful! Please check your email for verification.');
        // Add a small delay before redirecting to login
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Registration successful! Please sign in to continue.',
              email: data.email 
            }
          });
        }, 2000);
      } else {
        toast.error(result.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.error === 'Email already exists' ?
        'This email is already registered. Please login or use a different email.' :
        error.response?.data?.error || 'An unexpected error occurred. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              sign in to your existing account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <div className="mt-1 relative">
                <input
                  {...register('name', {
                    required: 'Full name is required',
                    minLength: { value: 5, message: 'Name must be at least 5 characters long' },
                    pattern: {
                      value: /^[a-zA-Z\s]+$/,
                      message: 'Name should only contain letters and spaces'
                    }
                  })}
                  type="text"
                  placeholder="Enter your full name"
                  className="w-full px-3 py-2 pl-10 border rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <User className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
              </div>
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <div className="mt-1 relative">
                <input
                  {...register('email', {
                    required: 'Email address is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Please enter a valid email address'
                    }
                  })}
                  type="email"
                  placeholder="Enter your email address"
                  className="w-full px-3 py-2 pl-10 border rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700">I am a</label>
              <div className="mt-1">
                <select
                  {...register('role', { required: 'Please select your role' })}
                  className="block w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select your role</option>
                  <option value="job_seeker">Job Seeker</option>
                  <option value="recruiter">Recruiter</option>
                </select>
              </div>
              {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>}
            </div>

            {/* Company Name - Only for Recruiters */}
            {watchRole === 'recruiter' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Company Name</label>
                <div className="mt-1 relative">
                  <input
                    {...register('company', {
                      required: watchRole === 'recruiter' ? 'Company name is required for recruiters' : false,
                      minLength: { value: 2, message: 'Company name must be at least 2 characters' }
                    })}
                    type="text"
                    placeholder="Enter your company name"
                    className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                {errors.company && <p className="mt-1 text-sm text-red-600">{errors.company.message}</p>}
              </div>
            )}

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <div className="mt-1 relative">
                <input
                  {...register('phone', {
                    required: 'Phone number is required',
                    pattern: {
                      value: /^[0-9]{10}$/,
                      message: 'Please enter a valid 10-digit phone number'
                    }
                  })}
                  type="tel"
                  placeholder="Enter your phone number"
                  className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  maxLength={10}
                />
              </div>
              {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1 relative">
                <input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters long'
                    },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
                    }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  className="w-full px-3 py-2 pl-10 pr-10 border rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <div className="mt-1 relative">
                <input
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) => value === watchPassword || 'Passwords do not match'
                  })}
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  className="w-full px-3 py-2 pl-10 pr-10 border rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>}
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                {...register('agreeToTerms', {
                  required: 'You must agree to the Terms and Privacy Policy to continue'
                })}
                id="agree-terms"
                type="checkbox"
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="agree-terms" className="ml-2 text-sm text-gray-900">
                I agree to the{' '}
                <Link to="/terms" className="font-medium text-blue-600 hover:text-blue-500">Terms and Conditions</Link>
                {' '}and{' '}
                <Link to="/privacy" className="font-medium text-blue-600 hover:text-blue-500">Privacy Policy</Link>
              </label>
            </div>
            {errors.agreeToTerms && <p className="text-sm text-red-600">{errors.agreeToTerms.message}</p>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
