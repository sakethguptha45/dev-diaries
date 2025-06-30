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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previousPassword, setPreviousPassword] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<NewPasswordFormData>();

  const password = watch('password');

  const onSubmit = async (data: NewPasswordFormData) => {
    setLoading(true);
    setError('');

    try {
      // Check if new password is same as previous (in real app, this would be handled server-side)
      if (previousPassword && data.password === previousPassword) {
        setError('New password cannot be the same as your previous password');
        setLoading(false);
        return;
      }

      console.log('🔄 Updating password...');

      const { error } = await supabase.auth.updateUser({
        password: data.password
      });

      if (error) {
        console.error('❌ Password update error:', error);
        
        if (error.message.includes('same as the old password')) {
          setError('New password cannot be the same as your previous password');
        } else {
          setError(error.message);
        }
      } else {
        console.log('✅ Password updated successfully');
        onSuccess();
      }
    } catch (error) {
      console.error('Password update error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const levels = [
      { label: 'Very Weak', color: 'bg-red-500' },
      { label: 'Weak', color: 'bg-orange-500' },
      { label: 'Fair', color: 'bg-yellow-500' },
      { label: 'Good', color: 'bg-blue-500' },
      { label: 'Strong', color: 'bg-green-500' }
    ];

    return { strength, ...levels[Math.min(strength, 4)] };
  };

  const passwordStrength = getPasswordStrength(password || '');

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
          <p className="text-gray-600">Choose a strong password that you haven't used before</p>
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

            {/* Security Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">🔒 Important Security Requirements</p>
                <div className="space-y-1 text-xs">
                  <p>• Your new password must be different from your previous password</p>
                  <p>• Choose a password you haven't used on this account before</p>
                  <p>• Make it strong and unique to protect your account</p>
                </div>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters'
                    },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                      message: 'Password must contain uppercase, lowercase, and number'
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
              
              {/* Password Strength Indicator */}
              {password && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${
                      passwordStrength.strength >= 3 ? 'text-green-600' : 
                      passwordStrength.strength >= 2 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                </motion.div>
              )}
              
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) =>
                      value === password || 'Passwords do not match'
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  placeholder="Confirm your new password"
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Password Requirements */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 mb-2">Password Requirements:</p>
              <div className="text-xs text-blue-800 space-y-1">
                <div className={`flex items-center space-x-2 ${password?.length >= 8 ? 'text-green-700' : ''}`}>
                  <span>{password?.length >= 8 ? '✓' : '•'}</span>
                  <span>At least 8 characters long</span>
                </div>
                <div className={`flex items-center space-x-2 ${/[A-Z]/.test(password || '') ? 'text-green-700' : ''}`}>
                  <span>{/[A-Z]/.test(password || '') ? '✓' : '•'}</span>
                  <span>One uppercase letter</span>
                </div>
                <div className={`flex items-center space-x-2 ${/[a-z]/.test(password || '') ? 'text-green-700' : ''}`}>
                  <span>{/[a-z]/.test(password || '') ? '✓' : '•'}</span>
                  <span>One lowercase letter</span>
                </div>
                <div className={`flex items-center space-x-2 ${/[0-9]/.test(password || '') ? 'text-green-700' : ''}`}>
                  <span>{/[0-9]/.test(password || '') ? '✓' : '•'}</span>
                  <span>One number</span>
                </div>
                <div className="flex items-center space-x-2 text-amber-700">
                  <span>⚠</span>
                  <span>Must be different from previous password</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || passwordStrength.strength < 3}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Updating password...</span>
                </div>
              ) : (
                'Update Password'
              )}
            </motion.button>

            {/* Security Notice */}
            <div className="text-center">
              <p className="text-xs text-gray-500">
                🔒 Your password will be securely encrypted and stored
              </p>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};