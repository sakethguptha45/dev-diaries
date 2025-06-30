import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Clock, RefreshCw, CheckCircle, AlertCircle, Mail, ArrowLeft, Wifi, WifiOff, Inbox, HelpCircle, ExternalLink, Bug } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { EmailDebugger } from './EmailDebugger';

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
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const [showDebugger, setShowDebugger] = useState(false);
  const [emailCheckCount, setEmailCheckCount] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Monitor network connectivity
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-show troubleshooting after 1 minute
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!success && !verification.isLocked) {
        setShowTroubleshooting(true);
      }
    }, 60000); // 1 minute

    return () => clearTimeout(timer);
  }, [success, verification.isLocked]);

  // Periodic reminder to check email
  useEffect(() => {
    const interval = setInterval(() => {
      if (!success && !verification.isLocked) {
        setEmailCheckCount(prev => prev + 1);
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [success, verification.isLocked]);

  // Format time as mm:ss
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Handle input change with enhanced validation
  const handleInputChange = (index: number, value: string) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value.slice(-1); // Only take the last character
    setCode(newCode);
    setError(''); // Clear error on input

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
    
    // Handle Enter key to submit
    if (e.key === 'Enter' && code.join('').length === 6) {
      handleVerify();
    }
  };

  // Enhanced paste handling
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    
    if (pastedData.length === 6) {
      const newCode = pastedData.split('');
      setCode(newCode);
      setError('');
      
      // Focus last input
      inputRefs.current[5]?.focus();
      
      // Auto-submit after a brief delay
      setTimeout(() => handleVerify(pastedData), 100);
    } else if (pastedData.length > 0) {
      setError('Please paste a valid 6-digit code');
    }
  };

  // Verify code with comprehensive error handling
  const handleVerify = async (codeToVerify?: string) => {
    const verificationCode = codeToVerify || code.join('');
    
    if (verificationCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    if (!isOnline) {
      setError('No internet connection. Please check your network and try again.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      console.log('🔍 Attempting to verify code:', verificationCode);
      const result = await verifyCode(verificationCode);
      
      if (result.success) {
        setSuccess(result.message || 'Email verified successfully!');
        
        // Show success animation before redirecting
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        setError(result.message || 'Invalid verification code');
        
        // Clear the code inputs on error for better UX
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        
        // Add haptic feedback on mobile
        if ('vibrate' in navigator) {
          navigator.vibrate(200);
        }
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Enhanced resend with better error handling
  const handleResend = async () => {
    if (!isOnline) {
      setError('No internet connection. Please check your network and try again.');
      return;
    }

    setIsResending(true);
    setError('');
    setSuccess('');

    try {
      console.log('🔄 Resending verification code to:', email);
      const result = await resendCode();
      
      if (result.success) {
        setSuccess(result.message || 'New verification code sent!');
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message || 'Failed to resend code');
      }
    } catch (error) {
      console.error('Resend error:', error);
      setError('Network error. Please check your connection and try again.');
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
  const isLocked = verification.isLocked;

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
        {/* Network Status Indicator */}
        <AnimatePresence>
          {!isOnline && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
            >
              <div className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
                <WifiOff className="h-4 w-4" />
                <span className="text-sm font-medium">No internet connection</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Email Check Reminder */}
        <AnimatePresence>
          {emailCheckCount > 0 && emailCheckCount % 2 === 0 && !success && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40"
            >
              <div className="bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3">
                <Mail className="h-5 w-5" />
                <div>
                  <p className="font-medium text-sm">📧 Check your email again!</p>
                  <p className="text-xs opacity-90">Don't forget to check spam/junk folder</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Verify Your Email</h2>
            <p className="text-gray-600">
              We've sent a 6-digit code to{' '}
              <span className="font-semibold text-indigo-600 break-all">{email}</span>
            </p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            {/* Enhanced Email Check Reminder */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg"
            >
              <div className="flex items-start space-x-3">
                <Inbox className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 mb-2">📧 Check your email inbox NOW</p>
                  <div className="text-blue-700 space-y-1">
                    <p>✓ Look for an email from <strong>Supabase</strong></p>
                    <p>✓ Check your <strong>SPAM/JUNK</strong> folder</p>
                    <p>✓ Search for "verification" or "6-digit"</p>
                    <p>✓ Wait 2-3 minutes for delivery</p>
                  </div>
                  <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-800">
                    <strong>Still nothing?</strong> Try the troubleshooting options below
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Quick Troubleshooting */}
            <AnimatePresence>
              {showTroubleshooting && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                >
                  <div className="flex items-start space-x-3">
                    <HelpCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-900 mb-2">🤔 Not receiving the code?</p>
                      <div className="text-yellow-800 space-y-2">
                        <div className="grid grid-cols-1 gap-2 text-xs">
                          <div className="p-2 bg-yellow-100 rounded">
                            <strong>Gmail users:</strong> Check Promotions tab & Spam
                          </div>
                          <div className="p-2 bg-yellow-100 rounded">
                            <strong>Outlook users:</strong> Check Junk Email folder
                          </div>
                          <div className="p-2 bg-yellow-100 rounded">
                            <strong>Corporate email:</strong> Contact IT or use personal email
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 mt-3">
                        <button
                          onClick={() => setShowDebugger(true)}
                          className="text-yellow-700 hover:text-yellow-900 text-xs underline flex items-center space-x-1"
                        >
                          <Bug className="h-3 w-3" />
                          <span>Run Email Diagnostics</span>
                        </button>
                        <span className="text-yellow-600">•</span>
                        <button
                          onClick={() => setShowTroubleshooting(false)}
                          className="text-yellow-700 hover:text-yellow-900 text-xs underline"
                        >
                          Hide
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Timer and Status */}
            <div className="text-center mb-6">
              {isLocked ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center space-x-2 text-red-600 bg-red-50 rounded-lg p-3"
                >
                  <AlertCircle className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Account temporarily locked</div>
                    <div className="text-xs opacity-75">Too many failed attempts</div>
                  </div>
                </motion.div>
              ) : verification.timeRemaining > 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center space-x-2 text-indigo-600"
                >
                  <Clock className="h-5 w-5" />
                  <div className="text-center">
                    <div className="font-mono text-lg font-semibold">
                      {formatTime(verification.timeRemaining)}
                    </div>
                    <div className="text-xs opacity-75">until code expires</div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-orange-600 font-medium"
                >
                  <div>Code expired</div>
                  <div className="text-xs opacity-75">Request a new code below</div>
                </motion.div>
              )}
              
              {verification.attempts > 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  Attempts: {verification.attempts}/{verification.maxAttempts}
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
                    disabled={isSubmitting || isLocked || !isOnline}
                    className={`w-12 h-12 text-center text-xl font-bold border-2 rounded-lg focus:outline-none transition-all duration-200 ${
                      digit
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                        : 'border-gray-300 hover:border-gray-400 focus:border-indigo-500'
                    } ${
                      isSubmitting || isLocked || !isOnline
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
              whileHover={{ scale: isSubmitting || !isOnline ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleVerify()}
              disabled={isSubmitting || code.join('').length !== 6 || isLocked || !isOnline}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Verifying...</span>
                </div>
              ) : !isOnline ? (
                <div className="flex items-center justify-center space-x-2">
                  <WifiOff className="h-4 w-4" />
                  <span>No Connection</span>
                </div>
              ) : (
                'Verify Email'
              )}
            </motion.button>

            {/* Resend Code */}
            <div className="mt-6 text-center space-y-3">
              <motion.button
                whileHover={{ scale: canResend && !isResending && isOnline ? 1.02 : 1 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleResend}
                disabled={!canResend || isResending || isLocked || !isOnline}
                className="inline-flex items-center space-x-2 text-sm font-medium text-indigo-600 hover:text-indigo-500 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <RefreshCw className={`h-4 w-4 ${isResending ? 'animate-spin' : ''}`} />
                <span>
                  {isResending
                    ? 'Sending new code...'
                    : !isOnline
                    ? 'No connection'
                    : canResend
                    ? 'Resend Code'
                    : `Resend in ${formatTime(verification.timeRemaining)}`
                  }
                </span>
              </motion.button>

              {!showTroubleshooting && (
                <button
                  onClick={() => setShowTroubleshooting(true)}
                  className="block mx-auto text-xs text-gray-500 hover:text-gray-700 transition-colors duration-200"
                >
                  Not receiving the code? Click for help
                </button>
              )}

              <div className="flex items-center justify-center space-x-4 text-sm">
                <button
                  onClick={onBack}
                  className="inline-flex items-center space-x-1 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to sign up</span>
                </button>
                
                <span className="text-gray-300">•</span>
                
                <button
                  onClick={() => setShowDebugger(true)}
                  className="inline-flex items-center space-x-1 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                >
                  <Bug className="h-4 w-4" />
                  <span>Debug Email</span>
                </button>
              </div>

              {/* Network Status */}
              <div className="flex items-center justify-center space-x-2 text-xs">
                {isOnline ? (
                  <>
                    <Wifi className="h-3 w-3 text-green-500" />
                    <span className="text-green-600">Connected</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 text-red-500" />
                    <span className="text-red-600">Offline</span>
                  </>
                )}
              </div>
            </div>

            {/* Debug Info (only in development) */}
            {import.meta.env.DEV && (
              <div className="mt-6 p-3 bg-gray-50 rounded-lg border text-xs text-gray-600">
                <p className="font-medium mb-1">🔧 Debug Info:</p>
                <p>Email: {email}</p>
                <p>Time remaining: {verification.timeRemaining}s</p>
                <p>Can resend: {canResend ? 'Yes' : 'No'}</p>
                <p>Attempts: {verification.attempts}/{verification.maxAttempts}</p>
                <p>Supabase URL: {import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing'}</p>
                <p>Supabase Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing'}</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Email Debugger Modal */}
      {showDebugger && (
        <EmailDebugger
          email={email}
          onClose={() => setShowDebugger(false)}
        />
      )}
    </>
  );
};