import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RefreshCw, CheckCircle, AlertCircle, Mail, Clock, Shield } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface VerificationFormProps {
  email: string;
  onBack: () => void;
  onSuccess: () => void;
}

export const VerificationForm: React.FC<VerificationFormProps> = ({
  email,
  onBack,
  onSuccess
}) => {
  const { verification, verifyCode, resendCode } = useAuthStore();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

    setIsSubmitting(true);
    setError('');

    try {
      const result = await verifyCode(verificationCode);
      
      if (result.success) {
        setSuccess(result.message || 'Email verified successfully!');
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        setError(result.message || 'Invalid verification code');
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      setError('Network error. Please try again.');
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
      const result = await resendCode();
      
      if (result.success) {
        setSuccess(result.message || 'New verification code sent!');
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message || 'Failed to resend code');
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

  const canResend = verification.canResend && verification.timeRemaining === 0;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </motion.button>
        <h1 className="text-lg font-semibold text-gray-900">Verify Email</h1>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center px-6 py-8">
        <div className="max-w-sm mx-auto w-full space-y-8">
          {/* Icon and Title */}
          <div className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto"
            >
              <Shield className="h-8 w-8 text-white" />
            </motion.div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Check your email</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                We sent a verification code to<br />
                <span className="font-medium text-gray-900">{email}</span>
              </p>
            </div>
          </div>

          {/* Code Input */}
          <div className="space-y-6">
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
                  disabled={isSubmitting || verification.isLocked}
                  className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-xl transition-all duration-200 ${
                    digit
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-gray-200 hover:border-gray-300 focus:border-blue-500'
                  } ${
                    isSubmitting || verification.isLocked
                      ? 'opacity-50 cursor-not-allowed'
                      : 'focus:outline-none focus:ring-0'
                  }`}
                  whileFocus={{ scale: 1.05 }}
                />
              ))}
            </div>

            {/* Timer */}
            <div className="text-center">
              {verification.timeRemaining > 0 ? (
                <div className="flex items-center justify-center space-x-2 text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">
                    Code expires in {formatTime(verification.timeRemaining)}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-red-500">Code expired</p>
              )}
            </div>
          </div>

          {/* Messages */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-center space-x-2 p-4 bg-green-50 rounded-xl border border-green-200"
              >
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-800 text-sm font-medium">{success}</span>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-center space-x-2 p-4 bg-red-50 rounded-xl border border-red-200"
              >
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-800 text-sm font-medium">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Verify Button */}
          <motion.button
            whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleVerify()}
            disabled={isSubmitting || code.join('').length !== 6 || verification.isLocked}
            className="w-full bg-blue-500 text-white py-4 rounded-xl font-semibold hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Verifying...</span>
              </div>
            ) : (
              'Verify Email'
            )}
          </motion.button>

          {/* Resend */}
          <div className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              Didn't receive the code?
            </p>
            
            <motion.button
              whileHover={{ scale: canResend && !isResending ? 1.02 : 1 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleResend}
              disabled={!canResend || isResending || verification.isLocked}
              className="inline-flex items-center space-x-2 text-blue-500 hover:text-blue-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
            >
              <RefreshCw className={`h-4 w-4 ${isResending ? 'animate-spin' : ''}`} />
              <span>
                {isResending
                  ? 'Sending...'
                  : canResend
                  ? 'Resend Code'
                  : `Resend in ${formatTime(verification.timeRemaining)}`
                }
              </span>
            </motion.button>
          </div>

          {/* Help Text */}
          <div className="text-center">
            <p className="text-xs text-gray-500 leading-relaxed">
              Check your spam folder if you don't see the email.<br />
              The code will expire in 10 minutes for security.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};