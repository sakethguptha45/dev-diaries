import { create } from 'zustand';
import { AuthState, User, VerificationState } from '../types';
import { supabase } from '../lib/supabase';
import { verificationManager } from '../utils/verification';
import { EmailService } from '../services/emailService';

const initialVerificationState: VerificationState = {
  isVerifying: false,
  email: '',
  code: '',
  timeRemaining: 0,
  attempts: 0,
  maxAttempts: 3,
  canResend: false,
  isLocked: false,
  lockUntil: null,
  lastCodeSent: null,
  errors: [],
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: true,
  verification: initialVerificationState,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const user: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.email || '',
          isEmailVerified: session.user.email_confirmed_at !== null,
          createdAt: new Date(session.user.created_at)
        };
        
        set({ 
          user, 
          isAuthenticated: true, 
          loading: false 
        });
      } else {
        set({ 
          user: null, 
          isAuthenticated: false, 
          loading: false 
        });
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const user: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email || '',
            isEmailVerified: session.user.email_confirmed_at !== null,
            createdAt: new Date(session.user.created_at)
          };
          
          set({ 
            user, 
            isAuthenticated: true, 
            loading: false 
          });
        } else if (event === 'SIGNED_OUT') {
          set({ 
            user: null, 
            isAuthenticated: false, 
            loading: false 
          });
        }
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ 
        user: null, 
        isAuthenticated: false, 
        loading: false 
      });
    }
  },

  login: async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        return false;
      }

      if (data.user) {
        const user: User = {
          id: data.user.id,
          email: data.user.email || '',
          name: data.user.user_metadata?.name || data.user.email || '',
          isEmailVerified: data.user.email_confirmed_at !== null,
          createdAt: new Date(data.user.created_at)
        };
        
        set({ 
          user, 
          isAuthenticated: true 
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  },

  register: async (email: string, password: string, name: string): Promise<{ success: boolean; needsVerification?: boolean; errorMessage?: string }> => {
    try {
      // Validate email format first
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { 
          success: false, 
          errorMessage: 'Please enter a valid email address.' 
        };
      }

      // Check if Supabase is properly configured
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        return { 
          success: false, 
          errorMessage: 'Service is not properly configured. Please contact support.' 
        };
      }

      // For our custom verification flow, we'll disable Supabase's email confirmation
      // and handle verification ourselves
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
          // Disable Supabase email confirmation since we're handling it ourselves
          emailRedirectTo: undefined,
        },
      });

      if (error) {
        console.error('Registration error:', error);
        
        // Provide more specific error messages
        if (error.message.includes('Failed to fetch')) {
          return { 
            success: false, 
            errorMessage: 'Unable to connect to the server. Please check your internet connection and try again.' 
          };
        }
        
        if (error.message.includes('already registered')) {
          return { 
            success: false, 
            errorMessage: 'An account with this email already exists. Please sign in instead.' 
          };
        }
        
        return { success: false, errorMessage: error.message };
      }

      if (data.user) {
        // Always require verification for new accounts
        return { success: true, needsVerification: true };
      }

      return { success: false, errorMessage: 'Registration failed. Please try again.' };
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle network errors specifically
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        return { 
          success: false, 
          errorMessage: 'Unable to connect to the server. Please check your internet connection.' 
        };
      }
      
      return { success: false, errorMessage: 'An unexpected error occurred. Please try again.' };
    }
  },

  logout: async () => {
    try {
      await supabase.auth.signOut();
      set({ 
        user: null, 
        isAuthenticated: false,
        verification: initialVerificationState
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  sendVerificationCode: async (email: string): Promise<{ success: boolean; message?: string }> => {
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { success: false, message: 'Invalid email address format.' };
      }

      // Check rate limiting
      const rateLimit = verificationManager.checkRateLimit(email);
      if (!rateLimit.allowed) {
        const resetTime = rateLimit.resetTime ? new Date(rateLimit.resetTime).toLocaleTimeString() : '';
        return { 
          success: false, 
          message: `Too many requests. Please try again ${resetTime ? `after ${resetTime}` : 'later'}.` 
        };
      }

      // Create verification session
      const { code } = await verificationManager.createSession(email);
      
      // Send email
      const emailService = EmailService.getInstance();
      const emailSent = await emailService.sendVerificationCode(email, code);
      
      if (!emailSent) {
        return { success: false, message: 'Failed to send verification email. Please check your email address and try again.' };
      }

      // Start timer and update state
      const startTimer = () => {
        const updateTimer = () => {
          const stats = verificationManager.getSessionStats(email);
          
          set(state => ({
            verification: {
              ...state.verification,
              isVerifying: true,
              email,
              timeRemaining: stats.timeRemaining,
              attempts: 3 - stats.attemptsRemaining,
              canResend: stats.canResend && stats.timeRemaining === 0,
              isLocked: stats.isLocked,
              lockUntil: null, // Will be set by verify/resend functions if needed
              lastCodeSent: new Date(),
            }
          }));

          if (stats.timeRemaining > 0) {
            setTimeout(updateTimer, 1000);
          }
        };
        updateTimer();
      };

      startTimer();
      
      return { success: true, message: 'Verification code sent successfully! Please check your email.' };
    } catch (error) {
      console.error('Error sending verification code:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to send verification code. Please try again.' 
      };
    }
  },

  verifyCode: async (code: string): Promise<{ success: boolean; message?: string }> => {
    const { verification } = get();
    
    try {
      if (!verification.email) {
        return { success: false, message: 'No verification session found. Please request a new code.' };
      }

      // Get user's IP and user agent for security logging
      const userAgent = navigator.userAgent;
      
      const result = await verificationManager.verifyCode(
        verification.email, 
        code, 
        undefined, // IP would be available on server-side
        userAgent
      );
      
      if (result.success) {
        // Reset verification state
        set({ verification: initialVerificationState });
        return { success: true, message: result.message };
      } else {
        // Update verification state with new attempt info
        const stats = verificationManager.getSessionStats(verification.email);
        set(state => ({
          verification: {
            ...state.verification,
            attempts: 3 - stats.attemptsRemaining,
            isLocked: result.isLocked || false,
            lockUntil: result.lockUntil || null,
          }
        }));
        
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'An error occurred during verification. Please try again.' 
      };
    }
  },

  resendCode: async (): Promise<{ success: boolean; message?: string }> => {
    const { verification } = get();
    
    try {
      if (!verification.email) {
        return { success: false, message: 'No verification session found.' };
      }

      const result = await verificationManager.resendCode(verification.email);
      
      if (result.success && result.code) {
        // Send new email
        const emailService = EmailService.getInstance();
        const emailSent = await emailService.sendVerificationCode(verification.email, result.code);
        
        if (!emailSent) {
          return { success: false, message: 'Failed to send verification email. Please try again.' };
        }

        // Restart timer
        const startTimer = () => {
          const updateTimer = () => {
            const stats = verificationManager.getSessionStats(verification.email);
            
            set(state => ({
              verification: {
                ...state.verification,
                timeRemaining: stats.timeRemaining,
                canResend: stats.canResend && stats.timeRemaining === 0,
                attempts: 3 - stats.attemptsRemaining,
                lastCodeSent: new Date(),
              }
            }));

            if (stats.timeRemaining > 0) {
              setTimeout(updateTimer, 1000);
            }
          };
          updateTimer();
        };

        startTimer();
        
        return { success: true, message: result.message };
      } else {
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('Error resending code:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to resend verification code. Please try again.' 
      };
    }
  },

  resetVerification: () => {
    set({ verification: initialVerificationState });
  },
}));