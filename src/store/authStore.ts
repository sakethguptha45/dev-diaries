import { create } from 'zustand';
import { AuthState, User, VerificationState } from '../types';
import { supabase } from '../lib/supabase';

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
        console.log('🔄 Auth state changed:', event, session?.user?.email);
        
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
            loading: false,
            verification: initialVerificationState // Clear verification state on successful login
          });
        } else if (event === 'SIGNED_OUT') {
          set({ 
            user: null, 
            isAuthenticated: false, 
            loading: false,
            verification: initialVerificationState
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
      console.log('🔄 Starting registration process for:', email);
      
      // Validate email format
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

      console.log('📧 Attempting Supabase signup with OTP verification...');

      // CRITICAL: Register user WITHOUT emailRedirectTo to force OTP instead of magic link
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
          // DO NOT SET emailRedirectTo - this forces Supabase to send OTP instead of magic link
        },
      });

      if (error) {
        console.error('❌ Supabase registration error:', error);
        
        if (error.message.includes('already registered') || error.message.includes('already been registered')) {
          return { 
            success: false, 
            errorMessage: 'An account with this email already exists. Please sign in instead.' 
          };
        }
        
        if (error.message.includes('Failed to fetch')) {
          return { 
            success: false, 
            errorMessage: 'Unable to connect to the server. Please check your internet connection.' 
          };
        }
        
        return { success: false, errorMessage: error.message };
      }

      if (data.user) {
        console.log('✅ User created successfully:', {
          id: data.user.id,
          email: data.user.email,
          emailConfirmed: data.user.email_confirmed_at,
          needsConfirmation: !data.session
        });
        
        // Check if user needs email confirmation (should be true for OTP flow)
        if (!data.session) {
          console.log('📧 Email confirmation required, setting up OTP verification state...');
          
          // Set up verification state for OTP
          set(state => ({
            verification: {
              ...state.verification,
              isVerifying: true,
              email: email,
              timeRemaining: 300, // 5 minutes
              canResend: false,
              lastCodeSent: new Date(),
            }
          }));

          // Start countdown timer
          const startTimer = () => {
            const updateTimer = () => {
              const currentState = get();
              const timeRemaining = Math.max(0, Math.floor((300000 - (Date.now() - (currentState.verification.lastCodeSent?.getTime() || 0))) / 1000));
              
              set(state => ({
                verification: {
                  ...state.verification,
                  timeRemaining,
                  canResend: timeRemaining === 0,
                }
              }));

              if (timeRemaining > 0) {
                setTimeout(updateTimer, 1000);
              }
            };
            updateTimer();
          };

          startTimer();
          
          return { success: true, needsVerification: true };
        } else {
          // User is immediately signed in (email confirmation disabled)
          console.log('✅ User signed in immediately (no email confirmation required)');
          
          const user: User = {
            id: data.user.id,
            email: data.user.email || '',
            name: data.user.user_metadata?.name || name,
            isEmailVerified: true,
            createdAt: new Date(data.user.created_at)
          };
          
          set({ 
            user, 
            isAuthenticated: true 
          });
          return { success: true, needsVerification: false };
        }
      }

      return { success: false, errorMessage: 'Registration failed. Please try again.' };
      
    } catch (error) {
      console.error('❌ Registration error:', error);
      
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
      console.log('📧 Sending OTP verification code to:', email);
      
      // Use Supabase's resend functionality for signup confirmation with OTP
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        // DO NOT include options.emailRedirectTo to ensure OTP is sent
      });

      if (error) {
        console.error('❌ Failed to send OTP verification code:', error);
        
        // Provide more specific error messages
        if (error.message.includes('rate limit')) {
          return { 
            success: false, 
            message: 'Too many requests. Please wait a moment before requesting another code.' 
          };
        }
        
        if (error.message.includes('not found') || error.message.includes('invalid')) {
          return { 
            success: false, 
            message: 'Email address not found. Please check your email and try again.' 
          };
        }
        
        return { 
          success: false, 
          message: error.message || 'Failed to send verification code' 
        };
      }

      console.log('✅ OTP verification code sent successfully');
      
      // Update verification state
      set(state => ({
        verification: {
          ...state.verification,
          isVerifying: true,
          email,
          timeRemaining: 300, // 5 minutes
          attempts: 0,
          canResend: false,
          isLocked: false,
          lockUntil: null,
          lastCodeSent: new Date(),
        }
      }));

      // Start countdown timer
      const startTimer = () => {
        const updateTimer = () => {
          const currentState = get();
          const timeRemaining = Math.max(0, Math.floor((300000 - (Date.now() - (currentState.verification.lastCodeSent?.getTime() || 0))) / 1000));
          
          set(state => ({
            verification: {
              ...state.verification,
              timeRemaining,
              canResend: timeRemaining === 0,
            }
          }));

          if (timeRemaining > 0) {
            setTimeout(updateTimer, 1000);
          }
        };
        updateTimer();
      };

      startTimer();
      
      return { 
        success: true, 
        message: 'OTP verification code sent! Please check your email inbox (and spam folder).' 
      };
    } catch (error) {
      console.error('Error sending OTP verification code:', error);
      return { 
        success: false, 
        message: 'Network error. Please check your connection and try again.' 
      };
    }
  },

  verifyCode: async (code: string): Promise<{ success: boolean; message?: string }> => {
    const { verification } = get();
    
    try {
      console.log('🔍 Verifying OTP code:', code, 'for email:', verification.email);
      
      if (!verification.email) {
        return { success: false, message: 'No verification session found. Please request a new code.' };
      }

      // Check attempts limit
      if (verification.attempts >= 3) {
        console.log('🚫 Too many attempts, locking account');
        
        set(state => ({
          verification: {
            ...state.verification,
            isLocked: true,
            lockUntil: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
          }
        }));
        
        return { 
          success: false, 
          message: 'Too many failed attempts. Please wait 15 minutes before trying again.' 
        };
      }

      // Verify the OTP using Supabase with type 'signup'
      const { data, error } = await supabase.auth.verifyOtp({
        email: verification.email,
        token: code,
        type: 'signup' // This is crucial for signup verification
      });

      if (error) {
        console.error('❌ OTP verification failed:', error);
        
        // Increment attempts
        set(state => ({
          verification: {
            ...state.verification,
            attempts: state.verification.attempts + 1,
          }
        }));
        
        const attemptsRemaining = 3 - (verification.attempts + 1);
        
        if (attemptsRemaining <= 0) {
          set(state => ({
            verification: {
              ...state.verification,
              isLocked: true,
              lockUntil: new Date(Date.now() + 15 * 60 * 1000),
            }
          }));
          
          return { 
            success: false, 
            message: 'Too many failed attempts. Please wait 15 minutes before trying again.' 
          };
        }
        
        // Provide more specific error messages
        if (error.message.includes('expired')) {
          return { 
            success: false, 
            message: 'Verification code has expired. Please request a new one.' 
          };
        }
        
        if (error.message.includes('invalid') || error.message.includes('not found')) {
          return { 
            success: false, 
            message: `Invalid verification code. ${attemptsRemaining} ${attemptsRemaining === 1 ? 'attempt' : 'attempts'} remaining.`
          };
        }
        
        return { 
          success: false, 
          message: `Verification failed. ${attemptsRemaining} ${attemptsRemaining === 1 ? 'attempt' : 'attempts'} remaining.`
        };
      }

      if (data.user && data.session) {
        console.log('✅ OTP verified successfully! User is now authenticated.');
        
        const user: User = {
          id: data.user.id,
          email: data.user.email || '',
          name: data.user.user_metadata?.name || data.user.email || '',
          isEmailVerified: true,
          createdAt: new Date(data.user.created_at)
        };
        
        // Clear verification state and set user as authenticated
        set({ 
          user, 
          isAuthenticated: true,
          verification: initialVerificationState 
        });
        
        return { success: true, message: 'Email verified successfully! Welcome to Dev Diaries!' };
      }

      return { 
        success: false, 
        message: 'Verification failed. Please try again.' 
      };
      
    } catch (error) {
      console.error('Error verifying OTP code:', error);
      return { 
        success: false, 
        message: 'Network error. Please check your connection and try again.' 
      };
    }
  },

  resendCode: async (): Promise<{ success: boolean; message?: string }> => {
    const { verification } = get();
    
    try {
      console.log('🔄 Resending OTP verification code to:', verification.email);
      
      if (!verification.email) {
        return { success: false, message: 'No verification session found.' };
      }

      // Check if user is locked
      if (verification.isLocked && verification.lockUntil && new Date() < verification.lockUntil) {
        const remainingTime = Math.ceil((verification.lockUntil.getTime() - Date.now()) / 1000 / 60);
        return { 
          success: false, 
          message: `Please wait ${remainingTime} minutes before requesting a new code.` 
        };
      }

      // Use Supabase's resend functionality for OTP
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: verification.email,
        // DO NOT include options.emailRedirectTo to ensure OTP is sent
      });

      if (error) {
        console.error('❌ Failed to resend OTP verification code:', error);
        
        if (error.message.includes('rate limit')) {
          return { 
            success: false, 
            message: 'Too many requests. Please wait a moment before requesting another code.' 
          };
        }
        
        return { 
          success: false, 
          message: error.message || 'Failed to resend verification code' 
        };
      }
      
      console.log('✅ New OTP verification code sent successfully');
      
      // Reset verification state
      set(state => ({
        verification: {
          ...state.verification,
          timeRemaining: 300, // 5 minutes
          attempts: 0,
          canResend: false,
          isLocked: false,
          lockUntil: null,
          lastCodeSent: new Date(),
        }
      }));

      // Restart timer
      const startTimer = () => {
        const updateTimer = () => {
          const currentState = get();
          const timeRemaining = Math.max(0, Math.floor((300000 - (Date.now() - (currentState.verification.lastCodeSent?.getTime() || 0))) / 1000));
          
          set(state => ({
            verification: {
              ...state.verification,
              timeRemaining,
              canResend: timeRemaining === 0,
            }
          }));

          if (timeRemaining > 0) {
            setTimeout(updateTimer, 1000);
          }
        };
        updateTimer();
      };

      startTimer();
      
      return { success: true, message: 'New OTP verification code sent! Please check your email.' };
    } catch (error) {
      console.error('Error resending OTP code:', error);
      return { 
        success: false, 
        message: 'Network error. Please check your connection and try again.' 
      };
    }
  },

  resetVerification: () => {
    set({ verification: initialVerificationState });
  },
}));