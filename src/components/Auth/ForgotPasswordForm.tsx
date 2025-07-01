import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, KeyRound } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ForgotPasswordVerificationForm } from './ForgotPasswordVerificationForm';
import { PasswordResetForm } from './PasswordResetForm';

interface ForgotPasswordFormData {
  email: string;
}

interface ForgotPasswordFormProps {
  onBack: () => void;
}

type Step = 'email' | 'verification' | 'passwordReset' | 'success';

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onBack }) => {
  const [currentStep, setCurrentStep] = useState<Step>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ForgotPasswordFormData>();

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setLoading(true);
    setError('');

    try {
      console.log('🔄 Sending password reset verification code to:', data.email);

      // Send password reset with OTP (no redirect URL to force OTP)
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: undefined // This forces OTP instead of magic link
      });

      if (error) {
        console.error('❌ Password reset error:', error);
        
        if (error.message.includes('rate limit')) {
          setError('Too many requests. Please wait a moment before trying again.');
        } else {
          // For security, we don't reveal if email exists or not
          setEmail(data.email);
          setCurrentStep('verification');
        }
      } else {
        console.log('✅ Password reset verification code sent successfully');
        setEmail(data.email);
        setCurrentStep('verification');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSuccess = () => {
    setCurrentStep('passwordReset');
  };

  const handlePasswordResetSuccess = () => {
    setCurrentStep('success');
  };

  const handleBackToEmail = () => {
    setCurrentStep('email');
    setEmail('');
    setError('');
  };

  const handleBackToVerification = () => {
    setCurrentStep('verification');
  };

  // Verification step
  if (currentStep === 'verification') {
    return (
      <ForgotPasswordVerificationForm
        email={email}
        onBack={handleBackToEmail}
        onVerified={handleVerificationSuccess}
      />
    );
  }

  // Password reset step
  if (currentStep === 'passwordReset') {
    return (
      <PasswordResetForm
        onSuccess={handlePasswordResetSuccess}
        onBack={handleBackToVerification}
      />
    );
  }

  // Success step
  if (currentStep === 'success') {
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
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Password successfully updated</h2>
            <p className="text-gray-600">Your password has been changed successfully</p>
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

  // Email input step (default)
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
            <KeyRound className="h-8 w-8 text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Forgot your password?</h2>
          <p className="text-gray-600">Enter your email to receive a verification code</p>
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
              <p className="mt-1 text-xs text-gray-500">
                💡 Use the same email you used to create your account
              </p>
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
                  <span>Sending verification code...</span>
                </div>
              ) : (
                'Send Verification Code'
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