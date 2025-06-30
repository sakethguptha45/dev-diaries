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
      console.log('🔄 Starting Supabase OTP registration process...');
      
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

      console.log('📧 Using Supabase built-in OTP system...');

      // Use Supabase's built-in OTP system
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
          // This will trigger Supabase to send an OTP instead of a confirmation link
          emailRedirectTo: undefined,
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
        console.log('✅ User created, email confirmation required');
        
        // Set up verification state
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
      console.log('📧 Sending OTP via Supabase to:', email);
      
      // Use Supabase's resend functionality
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        console.error('❌ Failed to send OTP:', error);
        return { 
          success: false, 
          message: error.message || 'Failed to send verification code' 
        };
      }

      console.log('✅ OTP sent successfully via Supabase');
      
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
        message: 'Verification code sent to your email address. Please check your inbox.' 
      };
    } catch (error) {
      console.error('Error sending verification code:', error);
      return { 
        success: false, 
        message: 'Failed to send verification code. Please try again.' 
      };
    }
  },

  verifyCode: async (code: string): Promise<{ success: boolean; message?: string }> => {
    const { verification } = get();
    
    try {
      console.log('🔍 Verifying OTP code via Supabase:', code);
      
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

      // Verify the OTP using Supabase
      const { data, error } = await supabase.auth.verifyOtp({
        email: verification.email,
        token: code,
        type: 'signup'
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
        
        return { 
          success: false, 
          message: `Invalid verification code. ${attemptsRemaining} ${attemptsRemaining === 1 ? 'attempt' : 'attempts'} remaining.`
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
      console.error('Error verifying code:', error);
      return { 
        success: false, 
        message: 'An error occurred during verification. Please try again.' 
      };
    }
  },

  resendCode: async (): Promise<{ success: boolean; message?: string }> => {
    const { verification } = get();
    
    try {
      console.log('🔄 Resending OTP via Supabase');
      
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

      // Use Supabase's resend functionality
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: verification.email,
      });

      if (error) {
        console.error('❌ Failed to resend OTP:', error);
        return { 
          success: false, 
          message: error.message || 'Failed to resend verification code' 
        };
      }
      
      console.log('✅ New OTP sent successfully');
      
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
      
      return { success: true, message: 'New verification code sent to your email!' };
    } catch (error) {
      console.error('Error resending code:', error);
      return { 
        success: false, 
        message: 'Failed to resend verification code. Please try again.' 
      };
    }
  },

  resetVerification: () => {
    set({ verification: initialVerificationState });
  },
}));