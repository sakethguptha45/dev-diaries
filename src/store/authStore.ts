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
      // Check if Supabase is properly configured
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        return { 
          success: false, 
          errorMessage: 'Supabase is not properly configured. Please check your environment variables.' 
        };
      }

      // Get the current URL and construct the redirect URL
      const currentUrl = window.location.origin;
      const redirectUrl = `${currentUrl}/verify-email`;

      console.log('Using redirect URL for email verification:', redirectUrl);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
          emailRedirectTo: redirectUrl,
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
        
        return { success: false, errorMessage: error.message };
      }

      if (data.user) {
        // Check if email confirmation is required
        if (!data.session) {
          // Start verification process
          await get().sendVerificationCode(email);
          return { success: true, needsVerification: true };
        }

        const user: User = {
          id: data.user.id,
          email: data.user.email || '',
          name: data.user.user_metadata?.name || name,
          isEmailVerified: data.user.email_confirmed_at !== null,
          createdAt: new Date(data.user.created_at)
        };
        
        set({ 
          user, 
          isAuthenticated: true 
        });
        return { success: true, needsVerification: false };
      }

      return { success: false, errorMessage: 'Registration failed. Please try again.' };
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle network errors specifically
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        return { 
          success: false, 
          errorMessage: 'Unable to connect to the server. Please check your internet connection and Supabase configuration.' 
        };
      }
      
      return { success: false, errorMessage: 'An error occurred. Please try again.' };
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
      // Check rate limiting
      if (!verificationManager.checkRateLimit(email)) {
        return { success: false, message: 'Too many requests. Please try again later.' };
      }

      // Create verification session
      const { code } = verificationManager.createSession(email);
      
      // Send email
      const emailService = EmailService.getInstance();
      const emailSent = await emailService.sendVerificationCode(email, code);
      
      if (!emailSent) {
        return { success: false, message: 'Failed to send verification email.' };
      }

      // Start timer
      const startTimer = () => {
        const updateTimer = () => {
          const timeRemaining = verificationManager.getTimeRemaining(email);
          const attemptsRemaining = verificationManager.getAttemptsRemaining(email);
          const session = verificationManager.getSession(email);
          
          set(state => ({
            verification: {
              ...state.verification,
              isVerifying: true,
              email,
              timeRemaining,
              attempts: session ? session.attempts.filter(a => !a.success).length : 0,
              canResend: timeRemaining === 0,
              isLocked: session ? verificationManager.isSessionLocked(session) : false,
              lockUntil: session?.lockUntil || null,
            }
          }));

          if (timeRemaining > 0) {
            setTimeout(updateTimer, 1000);
          }
        };
        updateTimer();
      };

      startTimer();
      
      return { success: true, message: 'Verification code sent successfully!' };
    } catch (error) {
      console.error('Error sending verification code:', error);
      return { success: false, message: 'Failed to send verification code.' };
    }
  },

  verifyCode: async (code: string): Promise<{ success: boolean; message?: string }> => {
    const { verification } = get();
    
    try {
      const result = verificationManager.verifyCode(verification.email, code);
      
      if (result.success) {
        // Reset verification state
        set({ verification: initialVerificationState });
        return { success: true, message: result.message };
      } else {
        // Update verification state with new attempt info
        const session = verificationManager.getSession(verification.email);
        set(state => ({
          verification: {
            ...state.verification,
            attempts: session ? session.attempts.filter(a => !a.success).length : 0,
            isLocked: result.isLocked || false,
            lockUntil: result.lockUntil || null,
          }
        }));
        
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      return { success: false, message: 'An error occurred during verification.' };
    }
  },

  resendCode: async (): Promise<{ success: boolean; message?: string }> => {
    const { verification } = get();
    
    try {
      const result = verificationManager.resendCode(verification.email);
      
      if (result.success && result.code) {
        // Send new email
        const emailService = EmailService.getInstance();
        const emailSent = await emailService.sendVerificationCode(verification.email, result.code);
        
        if (!emailSent) {
          return { success: false, message: 'Failed to send verification email.' };
        }

        // Restart timer
        const startTimer = () => {
          const updateTimer = () => {
            const timeRemaining = verificationManager.getTimeRemaining(verification.email);
            const session = verificationManager.getSession(verification.email);
            
            set(state => ({
              verification: {
                ...state.verification,
                timeRemaining,
                canResend: timeRemaining === 0,
                attempts: session ? session.attempts.filter(a => !a.success).length : 0,
              }
            }));

            if (timeRemaining > 0) {
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
      return { success: false, message: 'Failed to resend verification code.' };
    }
  },

  resetVerification: () => {
    set({ verification: initialVerificationState });
  },
}));