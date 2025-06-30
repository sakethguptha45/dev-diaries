import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle, Shield, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface NewPasswordFormData {
  password: string;
  confirmPassword: string;
}

interface NewPasswordFormProps {
  onSuccess: () => void;
}

export const NewPasswordForm: React.FC<NewPasswordFormProps> = ({ onSuccess }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<NewPasswordFormData>();

  const password = watch('password');
  const confirmPassword = watch('confirmPassword');

  // Enhanced password validation
  const validatePassword = (password: string) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const isValid = Object.values(requirements).every(req => req);
    return { isValid, requirements };
  };

  const passwordValidation = password ? validatePassword(password) : { isValid: false, requirements: {} };

  const onSubmit = async (data: NewPasswordFormData) => {
    setLoading(true);
    setError('');

    try {
      console.log('🔄 Starting password update process...');

      // Validate password strength
      if (!passwordValidation.isValid) {
        setError('Password does not meet all requirements. Please check the requirements below.');
        setLoading(false);
        return;
      }

      // Validate password confirmation
      if (data.password !== data.confirmPassword) {
        setError('Passwords do not match. Please ensure both fields contain the same password.');
        setLoading(false);
        return;
      }

      // Check if we have a valid session first
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        setError('Your session has expired. Please restart the password reset process.');
        setLoading(false);
        return;
      }

      console.log('✅ Valid session found, proceeding with password update...');

      // Update the user's password using the current session
      const { data: updateData, error } = await supabase.auth.updateUser({
        password: data.password
      });

      if (error) {
        console.error('❌ Password update error:', error);
        
        if (error.message.includes('same as the old password') || error.message.includes('same as your previous password')) {
          setError('Your new password cannot be the same as your previous password. Please choose a different password.');
        } else if (error.message.includes('session') || error.message.includes('expired')) {
          setError('Your session has expired. Please restart the password reset process.');
        } else if (error.message.includes('weak') || error.message.includes('strength')) {
          setError('Your password is too weak. Please choose a stronger password that meets all requirements.');
        } else {
          setError(error.message || 'Failed to update password. Please try again.');
        }
      } else if (updateData.user) {
        console.log('✅ Password updated successfully for user:', updateData.user.email);
        
        // Show success state
        setSuccess(true);
        
        // Wait a moment to show success, then sign out and redirect
        setTimeout(async () => {
          console.log('🔄 Signing out user to complete password reset...');
          await supabase.auth.signOut();
          
          console.log('✅ Password reset completed successfully!');
          onSuccess();
        }, 2000);
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
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Password Updated!</h2>
            <p className="text-gray-600">Your password has been successfully changed</p>
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Create New Password</h2>
          <p className="text-gray-600">Choose a strong password that meets all security requirements</p>
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

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  {...register('password', {
                    required: 'Password is required',
                    validate: (value) => {
                      const validation = validatePassword(value);
                      return validation.isValid || 'Password does not meet all requirements';
                    }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) =>
                      value === password || 'Passwords do not match'
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
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
              
              {/* Password Match Indicator */}
              {password && confirmPassword && (
                <div className="mt-2">
                  {password === confirmPassword ? (
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
                </div>
              )}
            </div>

            {/* Password Requirements */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 mb-3">Password Requirements:</p>
              <div className="space-y-2">
                {[
                  { key: 'length', label: 'At least 8 characters long', test: password?.length >= 8 },
                  { key: 'uppercase', label: 'One uppercase letter (A-Z)', test: /[A-Z]/.test(password || '') },
                  { key: 'lowercase', label: 'One lowercase letter (a-z)', test: /[a-z]/.test(password || '') },
                  { key: 'number', label: 'One number (0-9)', test: /\d/.test(password || '') },
                  { key: 'special', label: 'One special character (!@#$%^&*)', test: /[!@#$%^&*(),.?":{}|<>]/.test(password || '') }
                ].map((requirement) => (
                  <div key={requirement.key} className={`flex items-center space-x-2 text-sm ${
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
                <p className="font-medium mb-1">🔒 Important Security Notes:</p>
                <div className="space-y-1 text-xs">
                  <p>• Your new password must be different from your previous password</p>
                  <p>• Choose a unique password you haven't used elsewhere</p>
                  <p>• Your password will be securely encrypted and stored</p>
                  <p>• You'll be signed out after updating to ensure security</p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || !passwordValidation.isValid || password !== confirmPassword}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Updating Password...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span>Update Password</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </button>

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