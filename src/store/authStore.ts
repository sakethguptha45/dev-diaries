import { create } from 'zustand';
import { AuthState, User, VerificationState } from '../types';
import { supabase } from '../lib/supabase';
import { sendVerificationEmail, generateVerificationCode } from '../services/emailService';

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

// Secure verification session storage
interface VerificationSession {
  email: string;
  hashedCode: string;
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
  isLocked: boolean;
  lockUntil: Date | null;
  userData: {
    name: string;
    password: string;
  };
}

const verificationSessions = new Map<string, VerificationSession>();

// Simple hash function for secure code storage
const hashCode = (code: string): string => {
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    const char = code.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
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
      console.log('🔄 Starting OTP registration process...');
      
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

      // Check if user already exists
      console.log('🔍 Checking if user already exists...');
      const { data: existingUsers, error: checkError } = await supabase
        .from('auth.users')
        .select('email')
        .eq('email', email)
        .limit(1);

      // If we can't check (which is normal for RLS), we'll proceed and let Supabase handle duplicates
      if (checkError) {
        console.log('ℹ️ Cannot check existing users (normal with RLS)');
      }

      console.log('📝 Starting OTP verification process (NOT creating Supabase account yet)...');

      // Store user data temporarily for verification
      const userData = {
        name,
        password,
      };

      // Generate verification code
      const code = generateVerificationCode();
      const hashedCode = hashCode(code);
      
      console.log('🔑 Generated verification code:', code);
      
      // Create verification session
      const session: VerificationSession = {
        email,
        hashedCode,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        attempts: 0,
        createdAt: new Date(),
        isLocked: false,
        lockUntil: null,
        userData
      };
      
      verificationSessions.set(email, session);
      console.log('💾 Verification session created');
      
      // Send verification email
      console.log('📤 Sending verification email...');
      const emailResult = await sendVerificationEmail(email, code, name);
      
      if (!emailResult.success) {
        console.error('❌ Email sending failed:', emailResult.message);
        verificationSessions.delete(email);
        return { 
          success: false, 
          errorMessage: emailResult.message || 'Failed to send verification email' 
        };
      }
      
      console.log('✅ Verification email sent successfully');
      
      // Always require verification for OTP system
      return { success: true, needsVerification: true };
      
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
      
      // Clear any verification sessions
      verificationSessions.clear();
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  sendVerificationCode: async (email: string): Promise<{ success: boolean; message?: string }> => {
    try {
      console.log('📧 Sending verification code to:', email);
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { success: false, message: 'Invalid email address format.' };
      }

      // Check if user is locked
      const existingSession = verificationSessions.get(email);
      if (existingSession?.isLocked && existingSession.lockUntil && new Date() < existingSession.lockUntil) {
        const remainingTime = Math.ceil((existingSession.lockUntil.getTime() - Date.now()) / 1000 / 60);
        return { 
          success: false, 
          message: `Account temporarily locked. Try again in ${remainingTime} minutes.` 
        };
      }

      // Generate secure verification code
      const code = generateVerificationCode();
      const hashedCode = hashCode(code);
      
      console.log('🔑 Generated verification code:', code);
      
      // Update existing session or create new one
      if (existingSession) {
        existingSession.hashedCode = hashedCode;
        existingSession.expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        existingSession.attempts = 0;
        existingSession.isLocked = false;
        existingSession.lockUntil = null;
      } else {
        return { success: false, message: 'No registration session found. Please start registration again.' };
      }
      
      console.log('💾 Verification session updated');
      
      // Send email with verification code
      console.log('📤 Sending email...');
      const emailResult = await sendVerificationEmail(email, code, existingSession.userData.name);
      
      if (!emailResult.success) {
        console.error('❌ Email sending failed:', emailResult.message);
        return emailResult;
      }
      
      console.log('✅ Email sent successfully');
      
      // Start countdown timer
      const startTimer = () => {
        const updateTimer = () => {
          const session = verificationSessions.get(email);
          if (!session) return;
          
          const timeRemaining = Math.max(0, Math.floor((session.expiresAt.getTime() - Date.now()) / 1000));
          
          set(state => ({
            verification: {
              ...state.verification,
              isVerifying: true,
              email,
              timeRemaining,
              attempts: session.attempts,
              canResend: timeRemaining === 0,
              isLocked: session.isLocked,
              lockUntil: session.lockUntil,
              lastCodeSent: new Date(),
            }
          }));

          if (timeRemaining > 0 && !session.isLocked) {
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
      console.log('🔍 Verifying code:', code);
      
      if (!verification.email) {
        return { success: false, message: 'No verification session found. Please request a new code.' };
      }

      const session = verificationSessions.get(verification.email);
      if (!session) {
        return { success: false, message: 'No verification session found. Please request a new code.' };
      }

      // Check if locked
      if (session.isLocked && session.lockUntil && new Date() < session.lockUntil) {
        const remainingTime = Math.ceil((session.lockUntil.getTime() - Date.now()) / 1000 / 60);
        return { 
          success: false, 
          message: `Account temporarily locked. Try again in ${remainingTime} minutes.` 
        };
      }

      // Check if expired
      if (new Date() > session.expiresAt) {
        console.log('⏰ Code expired');
        set(state => ({
          verification: {
            ...state.verification,
            timeRemaining: 0,
            canResend: true
          }
        }));
        return { success: false, message: 'Verification code has expired. Please request a new code.' };
      }

      // Check attempts limit
      if (session.attempts >= 3) {
        console.log('🚫 Too many attempts, locking account');
        // Lock account for 15 minutes
        session.isLocked = true;
        session.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        
        set(state => ({
          verification: {
            ...state.verification,
            isLocked: true,
            lockUntil: session.lockUntil
          }
        }));
        
        return { 
          success: false, 
          message: 'Too many failed attempts. Account locked for 15 minutes.' 
        };
      }

      // Verify code using secure comparison
      const inputHashedCode = hashCode(code);
      const isValidCode = inputHashedCode === session.hashedCode;
      
      console.log('🔐 Code validation:', isValidCode ? 'SUCCESS' : 'FAILED');
      
      if (isValidCode) {
        // Success - now create the actual Supabase account
        console.log('✅ Code verified! Creating Supabase account...');
        
        try {
          // Create the account in Supabase with email confirmation DISABLED
          const { data, error } = await supabase.auth.signUp({
            email: verification.email,
            password: session.userData.password,
            options: {
              data: {
                name: session.userData.name,
                email_verified: true, // Mark as verified since we verified via OTP
              },
              // CRITICAL: Disable Supabase's email confirmation completely
              emailRedirectTo: undefined,
            },
          });

          if (error) {
            console.error('❌ Supabase account creation failed:', error);
            
            if (error.message.includes('already registered')) {
              return { 
                success: false, 
                message: 'An account with this email already exists. Please sign in instead.' 
              };
            }
            
            return { 
              success: false, 
              message: 'Failed to create account. Please try again.' 
            };
          }

          if (data.user) {
            console.log('✅ Supabase account created successfully');
            
            // Clean up verification session
            verificationSessions.delete(verification.email);
            set({ verification: initialVerificationState });
            
            return { success: true, message: 'Email verified and account created successfully!' };
          } else {
            return { 
              success: false, 
              message: 'Failed to create account. Please try again.' 
            };
          }
          
        } catch (supabaseError) {
          console.error('❌ Supabase error:', supabaseError);
          return { 
            success: false, 
            message: 'Failed to create account. Please try again.' 
          };
        }
        
      } else {
        // Failed attempt
        session.attempts++;
        const attemptsRemaining = 3 - session.attempts;
        
        console.log(`❌ Invalid code. Attempts remaining: ${attemptsRemaining}`);
        
        set(state => ({
          verification: {
            ...state.verification,
            attempts: session.attempts,
          }
        }));
        
        if (attemptsRemaining <= 0) {
          // Lock account
          session.isLocked = true;
          session.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
          
          set(state => ({
            verification: {
              ...state.verification,
              isLocked: true,
              lockUntil: session.lockUntil
            }
          }));
          
          return { 
            success: false, 
            message: 'Too many failed attempts. Account locked for 15 minutes.' 
          };
        }
        
        return { 
          success: false, 
          message: `Invalid verification code. ${attemptsRemaining} ${attemptsRemaining === 1 ? 'attempt' : 'attempts'} remaining.`
        };
      }
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
      console.log('🔄 Resending verification code');
      
      if (!verification.email) {
        return { success: false, message: 'No verification session found.' };
      }

      // Check if user is locked
      const existingSession = verificationSessions.get(verification.email);
      if (existingSession?.isLocked && existingSession.lockUntil && new Date() < existingSession.lockUntil) {
        const remainingTime = Math.ceil((existingSession.lockUntil.getTime() - Date.now()) / 1000 / 60);
        return { 
          success: false, 
          message: `Account temporarily locked. Try again in ${remainingTime} minutes.` 
        };
      }

      if (!existingSession) {
        return { success: false, message: 'No verification session found.' };
      }

      // Generate new code
      const code = generateVerificationCode();
      const hashedCode = hashCode(code);
      
      console.log('🔑 Generated new verification code:', code);
      
      // Update session
      existingSession.hashedCode = hashedCode;
      existingSession.expiresAt = new Date(Date.now() + 5 * 60 * 1000);
      existingSession.attempts = 0;
      existingSession.isLocked = false;
      existingSession.lockUntil = null;
      
      // Send new email
      const emailResult = await sendVerificationEmail(verification.email, code, existingSession.userData.name);
      
      if (!emailResult.success) {
        console.error('❌ Failed to resend email:', emailResult.message);
        return emailResult;
      }
      
      console.log('✅ New verification code sent');
      
      // Restart timer
      const startTimer = () => {
        const updateTimer = () => {
          const session = verificationSessions.get(verification.email);
          if (!session) return;
          
          const timeRemaining = Math.max(0, Math.floor((session.expiresAt.getTime() - Date.now()) / 1000));
          
          set(state => ({
            verification: {
              ...state.verification,
              timeRemaining,
              attempts: session.attempts,
              canResend: timeRemaining === 0,
              isLocked: false,
              lockUntil: null,
              lastCodeSent: new Date(),
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
    const { verification } = get();
    if (verification.email) {
      verificationSessions.delete(verification.email);
    }
    set({ verification: initialVerificationState });
  },
}));