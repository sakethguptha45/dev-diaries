import { supabase } from '../lib/supabase';
import { User } from '../types';

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
}

interface AuthResult {
  success: boolean;
  user?: User;
  needsVerification?: boolean;
  errorMessage?: string;
}

export const authService = {
  async getCurrentSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  },

  async login({ email, password }: LoginData): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        return { success: false, errorMessage: error.message };
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

      return { success: false, errorMessage: 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, errorMessage: 'An error occurred during login' };
    }
  },

  async register({ email, password, name }: RegisterData): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
        },
      });

      if (error) {
        console.error('Registration error:', error);
        return { success: false, errorMessage: error.message };
      }

      if (data.user) {
        // Check if email confirmation is required
        if (!data.session) {
          return { success: true, needsVerification: true };
        }

        const user: User = {
          id: data.user.id,
          email: data.user.email || '',
          name: data.user.user_metadata?.name || name,
          isEmailVerified: data.user.email_confirmed_at !== null,
          createdAt: new Date(data.user.created_at)
        };
        
        return { success: true, user };
      }

      return { success: false, errorMessage: 'Registration failed' };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, errorMessage: 'An error occurred during registration' };
    }
  },

  async logout(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  async deleteAccount(userId: string): Promise<{ success: boolean; errorMessage?: string }> {
    try {
      // First delete all user's cards (handled by foreign key cascade)
      const { error: cardsError } = await supabase
        .from('cards')
        .delete()
        .eq('user_id', userId);

      if (cardsError) {
        console.error('Error deleting user cards:', cardsError);
        return { success: false, errorMessage: 'Failed to delete user data' };
      }

      // Delete the user account
      const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

      if (deleteError) {
        console.error('Error deleting user account:', deleteError);
        return { success: false, errorMessage: 'Failed to delete account' };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete account error:', error);
      return { success: false, errorMessage: 'An error occurred while deleting account' };
    }
  },

  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const user: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.email || '',
          isEmailVerified: session.user.email_confirmed_at !== null,
          createdAt: new Date(session.user.created_at)
        };
        callback(user);
      } else {
        callback(null);
      }
    });
  }
};