import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Clock, RefreshCw, CheckCircle, AlertCircle, Mail, ArrowLeft, KeyRound } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ForgotPasswordVerificationFormProps {
  email: string;
  onBack: () => void;
  onVerified: () => void;
}

export const ForgotPasswordVerificationForm: React.FC<ForgotPasswordVerificationFormProps> = ({
  email,
  onBack,
  onVerified
}) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes
  const [canResend, setCanResend] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Start countdown timer
  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1;
          if (newTime === 0) {
            setCanResend(true);
          }
          return newTime;
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [timeRemaining]);

  // Format time as mm:ss
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Handle input change
  const handleInputChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all fields are filled
    if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
      handleVerify(newCode.join(''));
    }
  };

  // Handle backspace navigation
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    if (e.key === 'Enter' && code.join('').length === 6) {
      handleVerify();
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    
    if (pastedData.length === 6) {
      const newCode = pastedData.split('');
      setCode(newCode);
      setError('');
      inputRefs.current[5]?.focus();
      setTimeout(() => handleVerify(pastedData), 100);
    }
  };

  // Verify code
  const handleVerify = async (codeToVerify?: string) => {
    const verificationCode = codeToVerify || code.join('');
    
    if (verificationCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    if (isLocked) {
      setError('Too many failed attempts. Please wait before trying again.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Verify the OTP for password recovery
      const { data, error } = await supabase.auth.verifyOtp({
        email: email,
        token: verificationCode,
        type: 'recovery'
      });

      if (error) {
        console.error('❌ Password reset verification failed:', error);
        
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        if (newAttempts >= 3) {
          setIsLocked(true);
          setError('Too many failed attempts. Please request a new code.');
          return;
        }
        
        const attemptsRemaining = 3 - newAttempts;
        
        if (error.message.includes('expired')) {
          setError('Verification code has expired. Please request a new one.');
        } else if (error.message.includes('invalid')) {
          setError(`Invalid verification code. ${attemptsRemaining} ${attemptsRemaining === 1 ? 'attempt' : 'attempts'} remaining.`);
        } else {
          setError(`Verification failed. ${attemptsRemaining} ${attemptsRemaining === 1 ? 'attempt' : 'attempts'} remaining.`);
        }
        
        // Clear code inputs on error
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else if (data.session) {
        console.log('✅ Password reset verification successful');
        setSuccess('Code verified! You can now create a new password.');
        
        // Set the session for password reset
        await supabase.auth.setSession(data.session);
        
        setTimeout(() => {
          onVerified();
        }, 1500);
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend code
  const handleResend = async () => {
    setIsResending(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: undefined // Force OTP instead of link
      });

      if (error) {
        setError(error.message || 'Failed to resend code');
      } else {
        setSuccess('New verification code sent!');
        setCode(['', '', '', '', '', '']);
        setTimeRemaining(600); // Reset to 10 minutes
        setCanResend(false);
        setAttempts(0);
        setIsLocked(false);
        inputRefs.current[0]?.focus();
        
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  // Focus first input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Enter Verification Code</h2>
          <p className="text-gray-600">
            We've sent a 6-digit code to{' '}
            <span className="font-semibold text-orange-600 break-all">{email}</span>
          </p>
        </div>

        <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          {/* Email Check Reminder */}
          <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <Mail className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-orange-900 mb-2">📧 Check your email for the verification code</p>
                <div className="text-orange-700 space-y-1">
                  <p>✓ Look for an email from <strong>Supabase</strong></p>
                  <p>✓ Check your <strong>SPAM/JUNK</strong> folder</p>
                  <p>✓ The code is <strong>6 digits</strong> long</p>
                  <p>✓ Code expires in <strong>10 minutes</strong></p>
                </div>
              </div>
            </div>
          </div>

          {/* Timer */}
          <div className="text-center mb-6">
            {isLocked ? (
              <div className="flex items-center justify-center space-x-2 text-red-600 bg-red-50 rounded-lg p-3">
                <AlertCircle className="h-5 w-5" />
                <div>
                  <div className="font-medium">Too many failed attempts</div>
                  <div className="text-xs opacity-75">Please request a new code</div>
                </div>
              </div>
            ) : timeRemaining > 0 ? (
              <div className="flex items-center justify-center space-x-2 text-orange-600">
                <Clock className="h-5 w-5" />
                <div>
                  <div className="font-mono text-lg font-semibold">
                    {formatTime(timeRemaining)}
                  </div>
                  <div className="text-xs opacity-75">until code expires</div>
                </div>
              </div>
            ) : (
              <div className="text-red-600 font-medium">
                <div>Code expired</div>
                <div className="text-xs opacity-75">Request a new code below</div>
              </div>
            )}
            
            {attempts > 0 && (
              <p className="text-sm text-gray-500 mt-2">
                Attempts: {attempts}/3
              </p>
            )}
          </div>

          {/* Success Message */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2"
              >
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                <span className="text-green-800 text-sm">{success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2"
              >
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <span className="text-red-800 text-sm">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Code Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
              Enter your 6-digit verification code
            </label>
            <div className="flex justify-center space-x-3" onPaste={handlePaste}>
              {code.map((digit, index) => (
                <motion.input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  disabled={isSubmitting || isLocked}
                  className={`w-12 h-12 text-center text-xl font-bold border-2 rounded-lg focus:outline-none transition-all duration-200 ${
                    digit
                      ? 'border-orange-500 bg-orange-50 text-orange-900'
                      : 'border-gray-300 hover:border-gray-400 focus:border-orange-500'
                  } ${
                    isSubmitting || isLocked
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:shadow-sm focus:shadow-md'
                  }`}
                  whileFocus={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                />
              ))}
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">
              💡 You can paste your code or enter each digit manually
            </p>
          </div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleVerify()}
            disabled={isSubmitting || code.join('').length !== 6 || isLocked}
            className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 px-4 rounded-lg font-medium hover:from-orange-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Verifying...</span>
              </div>
            ) : (
              'Verify Code'
            )}
          </motion.button>

          {/* Resend Code */}
          <div className="mt-6 text-center space-y-3">
            <motion.button
              whileHover={{ scale: canResend && !isResending ? 1.02 : 1 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleResend}
              disabled={!canResend || isResending || (!isLocked && timeRemaining > 0)}
              className="inline-flex items-center space-x-2 text-sm font-medium text-orange-600 hover:text-orange-500 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <RefreshCw className={`h-4 w-4 ${isResending ? 'animate-spin' : ''}`} />
              <span>
                {isResending
                  ? 'Sending new code...'
                  : canResend || isLocked
                  ? 'Resend Code'
                  : `Resend in ${formatTime(timeRemaining)}`
                }
              </span>
            </motion.button>

            <div className="flex items-center justify-center space-x-4 text-sm">
              <button
                onClick={onBack}
                className="inline-flex items-center space-x-1 text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};