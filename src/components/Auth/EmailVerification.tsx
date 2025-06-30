import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, CheckCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface VerificationFormData {
  code: string;
}

interface EmailVerificationProps {
  onBack: () => void;
}

export const EmailVerification: React.FC<EmailVerificationProps> = ({ onBack }) => {
  const { verifyEmail, resendVerification, verificationEmail, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<VerificationFormData>();

  const codeValue = watch('code');

  // If user becomes authenticated, the parent component will handle the redirect
  useEffect(() => {
    if (isAuthenticated) {
      // The App component will automatically redirect to dashboard
      console.log('User authenticated, redirecting...');
    }
  }, [isAuthenticated]);

  const onSubmit = async (data: VerificationFormData) => {
    setLoading(true);
    setError('');

    try {
      const verified = await verifyEmail(data.code);
      if (!verified) {
        setError('Invalid verification code. Please check the code and try again.');
      }
      // If verified is true, the auth store will update isAuthenticated
      // and the App component will redirect automatically
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');

    try {
      const sent = await resendVerification();
      if (sent) {
        setError(''); // Clear any previous errors
        // Show success message briefly
        setTimeout(() => setResending(false), 2000);
      } else {
        setError('Failed to resend verification code.');
        setResending(false);
      }
    } catch (err) {
      setError('An error occurred while resending.');
      setResending(false);
    }
  };

  // Format input to uppercase and limit to 6 characters
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    e.target.value = value;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <Mail className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Verify your email</h2>
          <p className="text-gray-600">
            We've sent a verification code to{' '}
            <span className="font-medium text-gray-900">{verificationEmail}</span>
          </p>
        </div>

        <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {resending && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-600">Verification code sent! Check your email.</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <input
                {...register('code', {
                  required: 'Verification code is required',
                  minLength: {
                    value: 6,
                    message: 'Code must be 6 characters'
                  },
                  maxLength: {
                    value: 6,
                    message: 'Code must be 6 characters'
                  },
                  pattern: {
                    value: /^[A-Z0-9]{6}$/,
                    message: 'Code must be 6 alphanumeric characters'
                  }
                })}
                type="text"
                onChange={handleCodeChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-center text-lg font-mono tracking-widest uppercase"
                placeholder="XXXXXX"
                maxLength={6}
                style={{ letterSpacing: '0.5em' }}
                autoComplete="off"
              />
              {errors.code && (
                <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
              )}
              
              {/* Show current input for debugging */}
              {codeValue && (
                <p className="mt-1 text-xs text-gray-500">
                  Current input: {codeValue} ({codeValue?.length || 0}/6 characters)
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !codeValue || codeValue.length !== 6}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          <div className="mt-6 space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Didn't receive the code?</p>
              <button
                onClick={handleResend}
                disabled={resending}
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 transition-colors duration-200 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${resending ? 'animate-spin' : ''}`} />
                {resending ? 'Sending...' : 'Resend code'}
              </button>
            </div>

            <div className="text-center pt-4 border-t border-gray-200">
              <button
                onClick={onBack}
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to sign in
              </button>
            </div>
          </div>

          {/* Debug info for development */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border text-xs text-gray-600">
            <p className="font-medium mb-1">Debug Info:</p>
            <p>Email: {verificationEmail}</p>
            <p>Expected format: 6 uppercase alphanumeric characters</p>
            <p>The verification code is shown in the alert when you register</p>
          </div>
        </div>
      </div>
    </div>
  );
};