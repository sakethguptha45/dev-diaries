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

// Simple in-memory verification store
interface VerificationSession {
  email: string;
  code: string;
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
}

const verificationSessions = new Map<string, VerificationSession>();

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

      // Disable Supabase's email confirmation and handle it ourselves
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
          // Disable Supabase email confirmation
          emailRedirectTo: undefined,
        },
      });

      if (error) {
        console.error('Registration error:', error);
        
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
        // Always require our custom verification
        return { success: true, needsVerification: true };
      }

      return { success: false, errorMessage: 'Registration failed. Please try again.' };
    } catch (error) {
      console.error('Registration error:', error);
      
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

      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Create verification session
      const session: VerificationSession = {
        email,
        code,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        attempts: 0,
        createdAt: new Date()
      };
      
      verificationSessions.set(email, session);
      
      // Show development notification with the code
      showDevelopmentNotification(email, code);
      
      // Start timer
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
      
      return { success: true, message: 'Verification code sent successfully! Check the notification for your code.' };
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
      if (!verification.email) {
        return { success: false, message: 'No verification session found. Please request a new code.' };
      }

      const session = verificationSessions.get(verification.email);
      if (!session) {
        return { success: false, message: 'No verification session found. Please request a new code.' };
      }

      // Check if expired
      if (new Date() > session.expiresAt) {
        verificationSessions.delete(verification.email);
        return { success: false, message: 'Verification code has expired. Please request a new code.' };
      }

      // Check attempts
      if (session.attempts >= 3) {
        return { success: false, message: 'Too many failed attempts. Please request a new code.' };
      }

      // Verify code
      if (code === session.code) {
        // Success - clean up
        verificationSessions.delete(verification.email);
        set({ verification: initialVerificationState });
        return { success: true, message: 'Email verified successfully!' };
      } else {
        // Failed attempt
        session.attempts++;
        const attemptsRemaining = 3 - session.attempts;
        
        set(state => ({
          verification: {
            ...state.verification,
            attempts: session.attempts,
          }
        }));
        
        if (attemptsRemaining <= 0) {
          return { success: false, message: 'Too many failed attempts. Please request a new code.' };
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
      if (!verification.email) {
        return { success: false, message: 'No verification session found.' };
      }

      // Generate new code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Create new session
      const session: VerificationSession = {
        email: verification.email,
        code,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        attempts: 0,
        createdAt: new Date()
      };
      
      verificationSessions.set(verification.email, session);
      
      // Show development notification
      showDevelopmentNotification(verification.email, code);
      
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
      
      return { success: true, message: 'New verification code sent!' };
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

// Development notification function
function showDevelopmentNotification(email: string, code: string) {
  // Remove any existing notifications
  const existing = document.querySelector('#verification-notification');
  if (existing) {
    existing.remove();
  }

  const notification = document.createElement('div');
  notification.id = 'verification-notification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px 24px;
    border-radius: 16px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.15);
    z-index: 10000;
    font-family: system-ui, -apple-system, sans-serif;
    max-width: 320px;
    animation: slideInRight 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.2);
  `;
  
  notification.innerHTML = `
    <div style="display: flex; align-items: center; margin-bottom: 12px;">
      <div style="width: 8px; height: 8px; background: #4ade80; border-radius: 50%; margin-right: 8px; animation: pulse 2s infinite;"></div>
      <div style="font-size: 14px; font-weight: 600; opacity: 0.95;">
        📧 Verification Code Sent
      </div>
    </div>
    <div style="font-size: 28px; letter-spacing: 6px; text-align: center; background: rgba(255,255,255,0.15); padding: 12px; border-radius: 8px; margin: 12px 0; font-weight: 700; font-family: 'Courier New', monospace;">
      ${code}
    </div>
    <div style="font-size: 12px; opacity: 0.85; text-align: center; line-height: 1.4;">
      <div style="margin-bottom: 4px;">📨 Sent to: <strong>${email}</strong></div>
      <div style="color: #fbbf24;">⏰ Expires in 5 minutes</div>
    </div>
    <div style="margin-top: 12px; text-align: center;">
      <button onclick="this.parentElement.parentElement.remove()" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 6px 12px; border-radius: 6px; font-size: 11px; cursor: pointer; transition: all 0.2s;">
        ✕ Close
      </button>
    </div>
  `;
  
  // Add animations
  if (!document.querySelector('#verification-styles')) {
    const style = document.createElement('style');
    style.id = 'verification-styles';
    style.textContent = `
      @keyframes slideInRight {
        from { 
          transform: translateX(100%) scale(0.8); 
          opacity: 0; 
        }
        to { 
          transform: translateX(0) scale(1); 
          opacity: 1; 
        }
      }
      @keyframes slideOutRight {
        from { 
          transform: translateX(0) scale(1); 
          opacity: 1; 
        }
        to { 
          transform: translateX(100%) scale(0.8); 
          opacity: 0; 
        }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.7; transform: scale(1.2); }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(notification);
  
  // Auto remove after 15 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }
  }, 15000);
}