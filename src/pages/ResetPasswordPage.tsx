import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle, Shield, ArrowRight, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useForm } from 'react-hook-form';

interface ResetPasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sessionValid, setSessionValid] = useState<boolean | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<ResetPasswordFormData>({
    mode: 'onChange'
  });

  const newPassword = watch('newPassword');
  const confirmPassword = watch('confirmPassword');

  // Check if we have valid reset tokens and establish session
  useEffect(() => {
    const handlePasswordReset = async () => {
      try {
        console.log('🔍 Checking password reset tokens...');
        
        // Get tokens from URL (both query params and hash)
        const urlParams = new URLSearchParams(window.location.search);
        const hash = window.location.hash;
        const hashParams = new URLSearchParams(hash.substring(1));
        
        const accessToken = urlParams.get('access_token') || hashParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token') || hashParams.get('refresh_token');
        const type = urlParams.get('type') || hashParams.get('type');
        const error = urlParams.get('error') || hashParams.get('error');

        console.log('Reset tokens found:', {
          accessToken: accessToken ? 'present' : 'missing',
          refreshToken: refreshToken ? 'present' : 'missing',
          type,
          error
        });

        if (error) {
          setError('Invalid or expired reset link. Please request a new password reset.');
          setSessionValid(false);
          return;
        }

        if (type === 'recovery' && accessToken && refreshToken) {
          console.log('✅ Valid recovery tokens found, setting session...');
          
          // Set the session with the recovery tokens
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (sessionError) {
            console.error('❌ Error setting session:', sessionError);
            setError('Invalid reset link. Please request a new password reset.');
            setSessionValid(false);
          } else if (data.session) {
            console.log('✅ Session established successfully for password reset');
            setSessionValid(true);
            
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
          } else {
            setError('Failed to establish session. Please request a new password reset.');
            setSessionValid(false);
          }
        } else {
          // Check if we already have a valid session (user came from verification flow)
          const { data: existingSession } = await supabase.auth.getSession();
          
          if (existingSession.session) {
            console.log('✅ Existing valid session found');
            setSessionValid(true);
          } else {
            setError('No valid reset session found. Please request a new password reset.');
            setSessionValid(false);
          }
        }
      } catch (error) {
        console.error('❌ Error handling password reset:', error);
        setError('Failed to process reset link. Please try again.');
        setSessionValid(false);
      }
    };

    handlePasswordReset();
  }, []);

  // Password strength calculation
  const getPasswordStrength = (password: string) => {
    if (!password) return { score: 0, label: '', color: '', requirements: {} };
    
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const score = Object.values(requirements).filter(Boolean).length;
    
    const strengthLevels = [
      { label: 'Very Weak', color: 'bg-red-500', textColor: 'text-red-600' },
      { label: 'Weak', color: 'bg-orange-500', textColor: 'text-orange-600' },
      { label: 'Fair', color: 'bg-yellow-500', textColor: 'text-yellow-600' },
      { label: 'Good', color: 'bg-blue-500', textColor: 'text-blue-600' },
      { label: 'Strong', color: 'bg-green-500', textColor: 'text-green-600' }
    ];

    return {
      score,
      requirements,
      isValid: score === 5,
      ...strengthLevels[Math.min(score, 4)]
    };
  };

  const passwordStrength = getPasswordStrength(newPassword || '');
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
  const canSubmit = passwordStrength.isValid && passwordsMatch && !loading;

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!sessionValid) {
      setError('Session expired. Please request a new password reset.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔄 Starting password reset...');

      // Final session check
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        setError('Your session has expired. Please request a new password reset.');
        setLoading(false);
        return;
      }

      console.log('✅ Session confirmed, updating password...');

      // Update the user's password
      const { data: updateData, error } = await supabase.auth.updateUser({
        password: data.newPassword
      });

      if (error) {
        console.error('❌ Password update error:', error);
        
        if (error.message.includes('same as the old password') || error.message.includes('same as your previous password')) {
          setError('Your new password cannot be the same as your previous password. Please choose a different password.');
        } else if (error.message.includes('session') || error.message.includes('expired')) {
          setError('Your session has expired. Please request a new password reset.');
        } else if (error.message.includes('weak') || error.message.includes('strength')) {
          setError('Your password is too weak. Please choose a stronger password that meets all requirements.');
        } else {
          setError(error.message || 'Failed to update password. Please try again.');
        }
      } else if (updateData.user) {
        console.log('✅ Password updated successfully');
        
        // Show success state
        setSuccess(true);
        
        // Sign out the user for security and redirect to login
        setTimeout(async () => {
          await supabase.auth.signOut();
          navigate('/', { replace: true });
        }, 3000);
      } else {
        setError('Password update failed. Please try again.');
      }
    } catch (error) {
      console.error('Password update error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking session
  if (sessionValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  // Show error state if session is invalid
  if (sessionValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full space-y-8"
        >
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <AlertCircle className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Invalid Reset Link</h2>
            <p className="text-gray-600">This password reset link is invalid or has expired</p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="text-center space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
              
              <p className="text-gray-600 text-sm">
                Password reset links expire after 1 hour for security. Please request a new reset link.
              </p>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/', { replace: true })}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-500/25 transition-all duration-300"
              >
                Back to Sign In
                <ArrowRight className="h-4 w-4 ml-2" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Success state
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
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Password Reset Complete!</h2>
            <p className="text-gray-600">Your password has been successfully updated</p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="text-center space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800 font-medium mb-2">
                  🎉 Success! Your password has been updated.
                </p>
                <div className="text-xs text-green-700 space-y-1">
                  <p>✓ Your account is now secure with your new password</p>
                  <p>✓ You can now sign in with your new credentials</p>
                  <p>✓ Your old password is no longer valid</p>
                </div>
              </div>
              
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                <span className="ml-3 text-gray-600">Redirecting to sign in...</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Main password reset form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
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
            className="mx-auto h-16 w-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
          >
            <Shield className="h-8 w-8 text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Reset Your Password</h2>
          <p className="text-gray-600">Create a strong, secure password for your account</p>
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

            {/* New Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  {...register('newPassword', {
                    required: 'New password is required',
                    validate: (value) => {
                      const strength = getPasswordStrength(value);
                      return strength.isValid || 'Password must meet all requirements';
                    }
                  })}
                  type={showNewPassword ? 'text' : 'password'}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {newPassword && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${passwordStrength.textColor}`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                </motion.div>
              )}
              
              {errors.newPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.newPassword.message}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) =>
                      value === newPassword || 'Passwords do not match'
                  })}
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  placeholder="Confirm your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              
              {/* Password Match Validation */}
              {newPassword && confirmPassword && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2"
                >
                  {passwordsMatch ? (
                    <p className="text-sm text-green-600 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Passwords match
                    </p>
                  ) : (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      Passwords do not match
                    </p>
                  )}
                </motion.div>
              )}
              
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Password Requirements */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 mb-3 flex items-center">
                <Zap className="h-4 w-4 mr-2" />
                Password Requirements:
              </p>
              <div className="space-y-2">
                {[
                  { key: 'length', label: 'At least 8 characters', test: passwordStrength.requirements.length },
                  { key: 'uppercase', label: 'One uppercase letter (A-Z)', test: passwordStrength.requirements.uppercase },
                  { key: 'lowercase', label: 'One lowercase letter (a-z)', test: passwordStrength.requirements.lowercase },
                  { key: 'number', label: 'One number (0-9)', test: passwordStrength.requirements.number },
                  { key: 'special', label: 'One special character (!@#$%^&*)', test: passwordStrength.requirements.special }
                ].map((requirement) => (
                  <div key={requirement.key} className={`flex items-center space-x-2 text-sm transition-colors duration-200 ${
                    requirement.test ? 'text-green-700' : 'text-blue-800'
                  }`}>
                    <span className="w-4 h-4 flex items-center justify-center">
                      {requirement.test ? '✓' : '•'}
                    </span>
                    <span>{requirement.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-2">🔒 Security Notice:</p>
                <div className="space-y-1 text-xs">
                  <p>• Your new password must be different from your previous password</p>
                  <p>• You'll be automatically signed out after the password is updated</p>
                  <p>• Use your new password to sign in to your account</p>
                </div>
              </div>
            </div>

            {/* Reset Password Button */}
            <motion.button
              whileHover={{ scale: canSubmit ? 1.02 : 1 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={!canSubmit}
              className={`w-full py-3 px-4 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md ${
                canSubmit
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Resetting Password...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span>Reset Password</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </motion.button>

            {/* Footer */}
            <div className="text-center">
              <p className="text-xs text-gray-500">
                🔒 Your password will be securely encrypted and you'll be signed out for security
              </p>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};