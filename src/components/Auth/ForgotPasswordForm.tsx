import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ForgotPasswordFormData {
  email: string;
}

interface ForgotPasswordFormProps {
  onBack: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [canResend, setCanResend] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ForgotPasswordFormData>();

  const startCooldownTimer = () => {
    setCanResend(false);
    setTimeRemaining(60); // 1 minute cooldown

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setLoading(true);
    setError('');

    try {
      console.log('🔄 Sending password reset email to:', data.email);

      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error('❌ Password reset error:', error);
        
        if (error.message.includes('rate limit')) {
          setError('Too many requests. Please wait a moment before trying again.');
        } else if (error.message.includes('not found')) {
          // For security, we don't reveal if email exists or not
          setSuccess(true);
          setEmail(data.email);
          startCooldownTimer();
        } else {
          setError(error.message);
        }
      } else {
        console.log('✅ Password reset email sent successfully');
        setSuccess(true);
        setEmail(data.email);
        startCooldownTimer();
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || !email) return;

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setError(error.message);
      } else {
        startCooldownTimer();
        // Show brief success message
        const originalError = error;
        setError('');
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    return `${seconds}s`;
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full space-y-8"
        >
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto h-16 w-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
            >
              <CheckCircle className="h-8 w-8 text-white" />
            </motion.div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Check your email</h2>
            <p className="text-gray-600">We've sent password reset instructions to</p>
            <p className="font-semibold text-emerald-600 break-all">{email}</p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="space-y-6">
              {/* Instructions */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-emerald-900 mb-2">📧 Next steps:</p>
                    <div className="text-emerald-800 space-y-1">
                      <p>1. Check your email inbox (and spam folder)</p>
                      <p>2. Click the "Reset Password" link in the email</p>
                      <p>3. Create your new password</p>
                      <p>4. Sign in with your new password</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">🔒 Security Notice</p>
                  <p>The reset link will expire in 1 hour for your security. If you don't see the email within a few minutes, check your spam folder.</p>
                </div>
              </div>

              {/* Resend Option */}
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-3">Didn't receive the email?</p>
                
                {canResend ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleResend}
                    disabled={loading}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-all duration-200"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    <span>{loading ? 'Sending...' : 'Resend Email'}</span>
                  </motion.button>
                ) : (
                  <div className="flex items-center justify-center space-x-2 text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">
                      Resend available in {formatTime(timeRemaining)}
                    </span>
                  </div>
                )}
              </div>

              {/* Back to Login */}
              <div className="text-center pt-4 border-t border-gray-200">
                <button
                  onClick={onBack}
                  className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to sign in</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-red-50 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto h-16 w-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
          >
            <Mail className="h-8 w-8 text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Forgot your password?</h2>
          <p className="text-gray-600">No worries! Enter your email and we'll send you reset instructions</p>
        </div>

        <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2"
                >
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <span className="text-red-800 text-sm">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  type="email"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your email address"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Security Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">🔒 How this works:</p>
                <div className="space-y-1 text-xs">
                  <p>• We'll send a secure reset link to your email</p>
                  <p>• The link expires in 1 hour for security</p>
                  <p>• You'll be able to create a new password</p>
                  <p>• Your account will remain secure throughout</p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 px-4 rounded-lg font-medium hover:from-orange-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Sending reset email...</span>
                </div>
              ) : (
                'Send Reset Instructions'
              )}
            </motion.button>

            {/* Back to Login */}
            <div className="text-center">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to sign in</span>
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};