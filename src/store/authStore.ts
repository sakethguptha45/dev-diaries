import { create } from 'zustand';
import { AuthState, User } from '../types';
import { authService } from '../services/auth.service';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: true,

  initialize: async () => {
    try {
      const session = await authService.getCurrentSession();
      
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
      authService.onAuthStateChange((user) => {
        set({ 
          user, 
          isAuthenticated: !!user, 
          loading: false 
        });
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
    const result = await authService.login({ email, password });
    
    if (result.success && result.user) {
      set({ 
        user: result.user, 
        isAuthenticated: true 
      });
      return true;
    }
    
    return false;
  },

  register: async (email: string, password: string, name: string) => {
    const result = await authService.register({ email, password, name });
    
    if (result.success && result.user) {
      set({ 
        user: result.user, 
        isAuthenticated: true 
      });
    }
    
    return result;
  },

  logout: async () => {
    await authService.logout();
    set({ 
      user: null, 
      isAuthenticated: false 
    });
  },

  deleteAccount: async () => {
    const { user } = get();
    if (!user) {
      return { success: false, errorMessage: 'No user logged in' };
    }

    const result = await authService.deleteAccount(user.id);
    
    if (result.success) {
      set({ 
        user: null, 
        isAuthenticated: false 
      });
    }
    
    return result;
  }
}));