import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, AlertTriangle, CheckCircle, ExternalLink, Copy, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface EmailDebuggerProps {
  email: string;
  onClose: () => void;
}

export const EmailDebugger: React.FC<EmailDebuggerProps> = ({ email, onClose }) => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState<any>({});

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    setLoading(true);
    const results: any = {};

    try {
      // Test 1: Check Supabase configuration
      results.supabaseConfig = {
        url: !!import.meta.env.VITE_SUPABASE_URL,
        key: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
        urlFormat: import.meta.env.VITE_SUPABASE_URL?.includes('supabase.co'),
      };

      // Test 2: Check auth settings
      try {
        const { data: settings } = await supabase.auth.getSession();
        results.authConnection = { success: true, session: !!settings.session };
      } catch (error) {
        results.authConnection = { success: false, error: error.message };
      }

      // Test 3: Test email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      results.emailFormat = {
        valid: emailRegex.test(email),
        domain: email.split('@')[1],
        provider: getEmailProvider(email),
      };

      // Test 4: Check if user already exists
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: 'test-password-that-wont-work'
        });
        
        if (error?.message.includes('Invalid login credentials')) {
          results.userExists = { exists: true, status: 'User exists but password incorrect' };
        } else if (error?.message.includes('Email not confirmed')) {
          results.userExists = { exists: true, status: 'User exists but email not confirmed' };
        } else {
          results.userExists = { exists: false, status: 'User does not exist' };
        }
      } catch (error) {
        results.userExists = { exists: 'unknown', error: error.message };
      }

      setTestResults(results);
    } catch (error) {
      console.error('Diagnostic error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEmailProvider = (email: string): string => {
    const domain = email.split('@')[1]?.toLowerCase();
    const providers: { [key: string]: string } = {
      'gmail.com': 'Gmail',
      'outlook.com': 'Outlook',
      'hotmail.com': 'Hotmail',
      'yahoo.com': 'Yahoo',
      'icloud.com': 'iCloud',
      'protonmail.com': 'ProtonMail',
    };
    return providers[domain] || 'Other';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const testEmailDelivery = async () => {
    try {
      setLoading(true);
      
      // Try to resend using different methods
      const methods = [
        { name: 'Standard Resend', method: () => supabase.auth.resend({ type: 'signup', email }) },
        { name: 'Recovery Email', method: () => supabase.auth.resetPasswordForEmail(email) },
      ];

      const results = [];
      for (const method of methods) {
        try {
          const result = await method.method();
          results.push({ name: method.name, success: !result.error, error: result.error?.message });
        } catch (error) {
          results.push({ name: method.name, success: false, error: error.message });
        }
      }

      setTestResults(prev => ({ ...prev, deliveryTests: results }));
    } catch (error) {
      console.error('Email delivery test error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Mail className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Email Delivery Diagnostics</h2>
              <p className="text-sm text-gray-600">Troubleshooting email verification issues</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600">Running diagnostics...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Email Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono">{email}</span>
                      <button
                        onClick={() => copyToClipboard(email)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Provider:</span>
                    <span>{testResults.emailFormat?.provider}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Format Valid:</span>
                    <span className={testResults.emailFormat?.valid ? 'text-green-600' : 'text-red-600'}>
                      {testResults.emailFormat?.valid ? '✓ Valid' : '✗ Invalid'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Configuration Check */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Configuration Status
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Supabase URL:</span>
                    <span className={testResults.supabaseConfig?.url ? 'text-green-600' : 'text-red-600'}>
                      {testResults.supabaseConfig?.url ? '✓ Set' : '✗ Missing'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Supabase Key:</span>
                    <span className={testResults.supabaseConfig?.key ? 'text-green-600' : 'text-red-600'}>
                      {testResults.supabaseConfig?.key ? '✓ Set' : '✗ Missing'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Auth Connection:</span>
                    <span className={testResults.authConnection?.success ? 'text-green-600' : 'text-red-600'}>
                      {testResults.authConnection?.success ? '✓ Connected' : '✗ Failed'}
                    </span>
                  </div>
                </div>
              </div>

              {/* User Status */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Account Status
                </h3>
                <div className="text-sm">
                  <p className="text-gray-700">{testResults.userExists?.status}</p>
                  {testResults.userExists?.error && (
                    <p className="text-red-600 mt-1">Error: {testResults.userExists.error}</p>
                  )}
                </div>
              </div>

              {/* Email Provider Specific Issues */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                  📧 {testResults.emailFormat?.provider} Specific Issues
                </h3>
                <div className="text-sm text-gray-700 space-y-2">
                  {testResults.emailFormat?.provider === 'Gmail' && (
                    <>
                      <p>• Check your <strong>Spam</strong> and <strong>Promotions</strong> folders</p>
                      <p>• Gmail may delay automated emails by 5-15 minutes</p>
                      <p>• Look for emails from "noreply@mail.app.supabase.io"</p>
                    </>
                  )}
                  {testResults.emailFormat?.provider === 'Outlook' && (
                    <>
                      <p>• Check your <strong>Junk Email</strong> folder</p>
                      <p>• Outlook often blocks automated emails</p>
                      <p>• May need to add Supabase to safe senders</p>
                    </>
                  )}
                  {testResults.emailFormat?.provider === 'Yahoo' && (
                    <>
                      <p>• Check your <strong>Spam</strong> folder</p>
                      <p>• Yahoo may significantly delay emails</p>
                      <p>• Consider using a different email provider</p>
                    </>
                  )}
                  {testResults.emailFormat?.provider === 'Other' && (
                    <>
                      <p>• Corporate emails often have strict filters</p>
                      <p>• Check with your IT department</p>
                      <p>• Try using a personal email address</p>
                    </>
                  )}
                </div>
              </div>

              {/* Delivery Test Results */}
              {testResults.deliveryTests && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Email Delivery Tests</h3>
                  <div className="space-y-2">
                    {testResults.deliveryTests.map((test: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600">{test.name}:</span>
                        <span className={test.success ? 'text-green-600' : 'text-red-600'}>
                          {test.success ? '✓ Sent' : `✗ ${test.error}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col space-y-3">
                <button
                  onClick={testEmailDelivery}
                  disabled={loading}
                  className="flex items-center justify-center space-x-2 w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors duration-200"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Test Email Delivery</span>
                </button>

                <a
                  href="https://app.supabase.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-2 w-full bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors duration-200"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Check Supabase Dashboard</span>
                </a>
              </div>

              {/* Manual Solutions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">🔧 Manual Solutions</h3>
                <div className="text-sm text-gray-700 space-y-2">
                  <p><strong>1. Try a different email:</strong> Use Gmail, as it has the best delivery rates</p>
                  <p><strong>2. Wait longer:</strong> Some providers delay emails by up to 30 minutes</p>
                  <p><strong>3. Check Supabase settings:</strong> Ensure email confirmation is enabled</p>
                  <p><strong>4. Use magic link:</strong> We can switch to magic link verification instead</p>
                  <p><strong>5. Contact support:</strong> If all else fails, contact your email provider</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            Need help? Check your Supabase project settings
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};