import { supabase } from '../lib/supabase';
import { User } from '../types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  needsVerification?: boolean;
  errorMessage?: string;
}

class AuthService {
  async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        return null;
      }
      
      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  async login({ email, password }: LoginCredentials): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return {
          success: false,
          errorMessage: error.message,
        };
      }

      if (data.user) {
        const user: User = this.mapSupabaseUserToUser(data.user);
        return {
          success: true,
          user,
        };
      }

      return {
        success: false,
        errorMessage: 'Login failed',
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        errorMessage: 'An unexpected error occurred',
      };
    }
  }

  async register({ email, password, name }: RegisterCredentials): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) {
        return {
          success: false,
          errorMessage: error.message,
        };
      }

      if (data.user) {
        if (!data.session) {
          return {
            success: true,
            needsVerification: true,
          };
        }

        const user: User = this.mapSupabaseUserToUser(data.user);
        return {
          success: true,
          user,
        };
      }

      return {
        success: false,
        errorMessage: 'Registration failed',
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        errorMessage: 'An unexpected error occurred',
      };
    }
  }

  async logout(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  async deleteAccount(userId: string): Promise<AuthResult> {
    try {
      // Delete user's cards first
      const { error: cardsError } = await supabase
        .from('cards')
        .delete()
        .eq('user_id', userId);

      if (cardsError) {
        return {
          success: false,
          errorMessage: 'Failed to delete user data',
        };
      }

      // Note: In a real app, you'd need admin privileges to delete users
      // This is a simplified implementation
      await this.logout();

      return {
        success: true,
      };
    } catch (error) {
      console.error('Delete account error:', error);
      return {
        success: false,
        errorMessage: 'Failed to delete account',
      };
    }
  }

  private mapSupabaseUserToUser(supabaseUser: any): User {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: supabaseUser.user_metadata?.name || supabaseUser.email || '',
      isEmailVerified: supabaseUser.email_confirmed_at !== null,
      createdAt: new Date(supabaseUser.created_at),
    };
  }

  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const user = this.mapSupabaseUserToUser(session.user);
        callback(user);
      } else {
        callback(null);
      }
    });
  }
}

export const authService = new AuthService();