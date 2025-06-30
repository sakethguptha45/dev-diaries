import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, BookOpen, ArrowRight } from 'lucide-react';

export const EmailVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check URL parameters and hash for verification tokens
    const urlParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    const hashParams = new URLSearchParams(hash.substring(1));
    
    const accessToken = urlParams.get('access_token') || hashParams.get('access_token');
    const type = urlParams.get('type') || hashParams.get('type');
    const error = urlParams.get('error') || hashParams.get('error');
    const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');
    
    console.log('Email verification page loaded:', {
      accessToken: accessToken ? 'present' : 'missing',
      type,
      error,
      errorDescription
    });

    if (error) {
      // Handle verification errors
      if (errorDescription?.includes('expired') || errorDescription?.includes('invalid') || error === 'access_denied') {
        setError('The verification link has expired or is invalid. Please try registering again.');
      } else {
        setError('There was an issue with email verification. Please try again.');
      }
    } else if (type === 'signup' && accessToken) {
      // Successful verification
      setIsVerified(true);
    } else {
      // No verification data found
      setError('Invalid verification link. Please check your email and try again.');
    }
  }, []);

  const handleBackToSignIn = () => {
    navigate('/', { replace: true });
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/40 p-8">
            <div className="mx-auto h-20 w-20 bg-gradient-to-br from-red-500 to-orange-600 rounded-3xl flex items-center justify-center mb-6 shadow-lg">
              <X className="h-10 w-10 text-white" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Verification Failed
            </h1>
            
            <p className="text-gray-600 mb-8">
              {error}
            </p>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBackToSignIn}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-500/25 transition-all duration-300"
            >
              Back to sign in
              <ArrowRight className="h-4 w-4 ml-2" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center"
      >
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/40 p-8">
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto h-20 w-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center mb-6 shadow-lg"
          >
            <CheckCircle className="h-10 w-10 text-white" />
          </motion.div>
          
          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-gray-900 mb-4"
          >
            Email Verified!
          </motion.h1>
          
          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600 mb-8 text-lg"
          >
            Your account has been successfully activated
          </motion.p>
          
          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-green-50/80 backdrop-blur-sm rounded-2xl border border-green-200/50 p-6 mb-8"
          >
            <div className="space-y-3 text-sm text-green-800">
              <p className="font-semibold">
                🎉 Welcome to Dev Diaries!
              </p>
              <p>
                Your email has been verified and your account is now active. You can now sign in and start organizing your development knowledge.
              </p>
              <div className="flex items-center justify-center space-x-2 pt-2">
                <BookOpen className="h-4 w-4 text-green-600" />
                <span className="text-green-700 font-medium">Ready to get started!</span>
              </div>
            </div>
          </motion.div>
          
          {/* Sign In Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(59, 130, 246, 0.3)" }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBackToSignIn}
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white text-lg font-semibold rounded-2xl shadow-2xl hover:shadow-blue-500/25 focus:outline-none focus:ring-4 focus:ring-blue-500/25 transition-all duration-300"
          >
            Sign in to your account
            <ArrowRight className="h-5 w-5 ml-3" />
          </motion.button>
          
          {/* Footer note */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-xs text-gray-500 mt-6"
          >
            You will be redirected to the sign-in page
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
};