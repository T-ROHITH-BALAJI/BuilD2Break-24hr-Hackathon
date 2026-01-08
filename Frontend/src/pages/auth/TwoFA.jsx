import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Shield, RefreshCw } from 'lucide-react';

const TwoFA = () => {
  const { verify2FA } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(30);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm();

  const watchCode = watch('code');

  useEffect(() => {
    if (timer > 0) {
      const countdown = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(countdown);
    }
  }, [timer]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const result = await verify2FA(data.code);
      if (result.success) {
        toast.success('2FA verification successful!');
        // Redirect based on user role
        const userRole = result.user.role;
        if (userRole === 'jobseeker') {
          navigate('/jobseeker/dashboard');
        } else if (userRole === 'recruiter') {
          navigate('/recruiter/dashboard');
        } else if (userRole === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/');
        }
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    try {
      // API call to resend 2FA code
      toast.success('New verification code sent!');
      setTimer(30);
    } catch (error) {
      toast.error('Failed to resend code');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Two-Factor Authentication
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We've sent a verification code to your email address. 
            Please enter the 6-digit code below.
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 text-center">
              Verification Code
            </label>
            <div className="mt-1">
              <input
                {...register('code', {
                  required: 'Verification code is required',
                  pattern: {
                    value: /^\d{6}$/,
                    message: 'Please enter a valid 6-digit code',
                  },
                })}
                type="text"
                maxLength="6"
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm text-center text-2xl tracking-widest"
                placeholder="000000"
                autoComplete="one-time-code"
              />
            </div>
            {errors.code && (
              <p className="mt-1 text-sm text-red-600 text-center">{errors.code.message}</p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !watchCode || watchCode.length !== 6}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'Verify Code'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Didn't receive the code?{' '}
              {timer > 0 ? (
                <span className="text-gray-500">
                  Resend in {timer}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendLoading}
                  className="font-medium text-blue-600 hover:text-blue-500 disabled:opacity-50"
                >
                  {resendLoading ? (
                    <RefreshCw className="inline w-4 h-4 animate-spin" />
                  ) : (
                    'Resend Code'
                  )}
                </button>
              )}
            </p>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Back to Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TwoFA;
