import { create } from 'zustand';
import { AuthState, User } from '../types';
import { supabase } from '../lib/supabase';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: true,

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
        
        set({ 
          user, 
          isAuthenticated: true 
        });
        return { success: true, needsVerification: false };
      }

      return { success: false, errorMessage: 'Registration failed. Please try again.' };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, errorMessage: 'An error occurred. Please try again.' };
    }
  },

  logout: async () => {
    try {
      await supabase.auth.signOut();
      set({ 
        user: null, 
        isAuthenticated: false 
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
}));