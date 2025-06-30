import { supabase } from '../lib/supabase';
import { User } from '../types';


export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
  needsVerification?: boolean;
}

export interface VerificationResponse {
  success: boolean;
  message?: string;
}

export class AuthService {
  /**
   * Sign in with email and password
   */
  static async signIn(email: string, password: string): Promise<AuthResponse> {

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {

        return { success: false, error: error.message };

      }

      if (data.user) {
        const user: User = {
          id: data.user.id,
          email: data.user.email || '',
          name: data.user.user_metadata?.name || data.user.email || '',
          isEmailVerified: data.user.email_confirmed_at !== null,
          createdAt: new Date(data.user.created_at)
        };
        
        return { success: true, user };
      }


      return { success: false, error: 'Authentication failed' };
    } catch (error) {
      return { success: false, error: 'Network error occurred' };
    }
  }

  /**
   * Sign up with email, password, and name
   */
  static async signUp(email: string, password: string, name: string): Promise<AuthResponse> {

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {

          data: { name },
          emailRedirectTo: undefined, // Force OTP verification

        },
      });

      if (error) {

        if (error.message.includes('already registered')) {
          return { 
            success: false, 
            error: 'An account with this email already exists. Please sign in instead.' 
          };
        }
        return { success: false, error: error.message };

      }

      if (data.user) {
        // Check if email confirmation is required

        if (!data.session || !data.user.email_confirmed_at) {
          return { 
            success: true, 
            needsVerification: true,
            user: {
              id: data.user.id,
              email: data.user.email || '',
              name: data.user.user_metadata?.name || name,
              isEmailVerified: false,
              createdAt: new Date(data.user.created_at)
            }
          };
        } else {
          // User is immediately signed in
          const user: User = {
            id: data.user.id,
            email: data.user.email || '',
            name: data.user.user_metadata?.name || name,
            isEmailVerified: true,
            createdAt: new Date(data.user.created_at)
          };
          
          return { success: true, user };
        }
      }

      return { success: false, error: 'Registration failed' };
    } catch (error) {
      return { success: false, error: 'Network error occurred' };
    }
  }

  /**
   * Sign out current user
   */
  static async signOut(): Promise<void> {
    await supabase.auth.signOut();
  }

  /**
   * Get current session
   */
  static async getCurrentSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * Get current user
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      const session = await this.getCurrentSession();
      
      if (session?.user) {
        return {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.email || '',
          isEmailVerified: session.user.email_confirmed_at !== null,
          createdAt: new Date(session.user.created_at)
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Send verification code for email confirmation
   */
  static async sendVerificationCode(email: string): Promise<VerificationResponse> {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: undefined // Force OTP
        }
      });

      if (error) {
        if (error.message.includes('rate limit')) {
          return { 
            success: false, 
            message: 'Too many requests. Please wait before requesting another code.' 
          };
        }
        return { success: false, message: error.message };
      }

      return { 
        success: true, 
        message: 'Verification code sent! Please check your email.' 
      };
    } catch (error) {
      return { 
        success: false, 
        message: 'Network error. Please try again.' 
      };
    }
  }

  /**
   * Verify email with OTP code
   */
  static async verifyEmail(email: string, token: string): Promise<VerificationResponse> {
    try {

      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup'
      });

      if (error) {
        if (error.message.includes('expired')) {
          return { 
            success: false, 
            message: 'Verification code has expired. Please request a new one.' 
          };
        }
        if (error.message.includes('invalid')) {
          return { 
            success: false, 
            message: 'Invalid verification code. Please try again.' 
          };
        }
        return { success: false, message: error.message };
      }

      if (data.user && data.session) {
        return { 
          success: true, 
          message: 'Email verified successfully!' 
        };
      }

      return { success: false, message: 'Verification failed' };
    } catch (error) {
      return { 
        success: false, 
        message: 'Network error. Please try again.' 
      };
    }
  }

  /**
   * Send password reset email
   */
  static async sendPasswordReset(email: string): Promise<VerificationResponse> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: undefined // Force OTP
      });

      if (error) {
        if (error.message.includes('rate limit')) {
          return { 
            success: false, 
            message: 'Too many requests. Please wait before trying again.' 
          };
        }
        return { success: false, message: error.message };
      }

      return { 
        success: true, 
        message: 'Password reset code sent! Please check your email.' 
      };
    } catch (error) {
      return { 
        success: false, 
        message: 'Network error. Please try again.' 
      };

    }
  }

  /**
   * Verify password reset code
   */
  static async verifyPasswordReset(email: string, token: string): Promise<VerificationResponse> {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'recovery'
      });

      if (error) {
        if (error.message.includes('expired')) {
          return { 
            success: false, 
            message: 'Reset code has expired. Please request a new one.' 
          };
        }
        if (error.message.includes('invalid')) {
          return { 
            success: false, 
            message: 'Invalid reset code. Please try again.' 
          };
        }
        return { success: false, message: error.message };
      }

      if (data.user && data.session) {
        // Set the session for password reset
        await supabase.auth.setSession(data.session);
        return { 
          success: true, 
          message: 'Code verified! You can now reset your password.' 
        };
      }

      return { success: false, message: 'Verification failed' };
    } catch (error) {
      return { 
        success: false, 
        message: 'Network error. Please try again.' 
      };
    }
  }

  /**
   * Update user password
   */
  static async updatePassword(newPassword: string): Promise<VerificationResponse> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        if (error.message.includes('same as the old password')) {
          return { 
            success: false, 
            message: 'New password cannot be the same as your previous password.' 
          };
        }
        return { success: false, message: error.message };
      }

      return { 
        success: true, 
        message: 'Password updated successfully!' 
      };
    } catch (error) {
      return { 
        success: false, 
        message: 'Network error. Please try again.' 
      };
    }
  }

  /**
   * Listen to auth state changes
   */
  static onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}

