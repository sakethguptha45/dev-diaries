import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState, User } from '../types';

// Mock email service
const sendVerificationEmail = async (email: string, code: string): Promise<boolean> => {
  // Simulate email sending delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // In a real app, you would use a service like EmailJS, SendGrid, etc.
  console.log(`Verification email sent to ${email} with code: ${code}`);
  
  // For demo purposes, show an alert with the verification code
  alert(`Demo: Verification code sent to ${email}\nCode: ${code}\n\nIn production, this would be sent via email.`);
  
  return true;
};

// Mock user data for MVP
const mockUsers: { email: string; password: string; user: User }[] = [
  {
    email: 'demo@devdiaries.com',
    password: 'password123',
    user: {
      id: '1',
      email: 'demo@devdiaries.com',
      name: 'Demo User',
      isEmailVerified: true,
      createdAt: new Date('2024-01-01')
    }
  }
];

// Store verification codes separately for better tracking
const verificationCodes: { [email: string]: string } = {};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      pendingVerification: false,
      verificationEmail: '',

      login: async (email: string, password: string): Promise<boolean> => {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const mockUser = mockUsers.find(u => u.email === email && u.password === password);
        
        if (mockUser) {
          if (!mockUser.user.isEmailVerified) {
            // Generate new verification code for unverified users
            const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            verificationCodes[email] = verificationCode;
            mockUser.user.verificationCode = verificationCode;
            
            await sendVerificationEmail(email, verificationCode);
            
            set({ 
              pendingVerification: true, 
              verificationEmail: email,
              user: null,
              isAuthenticated: false 
            });
            return false;
          }
          
          set({ 
            user: mockUser.user, 
            isAuthenticated: true,
            pendingVerification: false,
            verificationEmail: ''
          });
          return true;
        }
        
        return false;
      },

      register: async (email: string, password: string, name: string): Promise<{ success: boolean; needsVerification?: boolean }> => {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if user already exists
        const existingUser = mockUsers.find(u => u.email === email);
        if (existingUser) {
          return { success: false };
        }
        
        // Generate verification code
        const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        const newUser: User = {
          id: Math.random().toString(36).substring(7),
          email,
          name,
          isEmailVerified: false,
          verificationCode,
          createdAt: new Date()
        };
        
        // Store verification code
        verificationCodes[email] = verificationCode;
        
        mockUsers.push({ email, password, user: newUser });
        
        // Send verification email
        await sendVerificationEmail(email, verificationCode);
        
        set({ 
          pendingVerification: true, 
          verificationEmail: email,
          user: null,
          isAuthenticated: false 
        });
        
        return { success: true, needsVerification: true };
      },

      verifyEmail: async (code: string): Promise<boolean> => {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { verificationEmail } = get();
        
        if (!verificationEmail) {
          console.error('No verification email found');
          return false;
        }
        
        // Get the stored verification code
        const storedCode = verificationCodes[verificationEmail];
        const inputCode = code.trim().toUpperCase();
        
        console.log('Verification attempt:', {
          email: verificationEmail,
          storedCode,
          inputCode,
          match: storedCode === inputCode
        });
        
        if (storedCode && storedCode === inputCode) {
          // Find and update the user
          const userEntry = mockUsers.find(u => u.email === verificationEmail);
          
          if (userEntry) {
            userEntry.user.isEmailVerified = true;
            userEntry.user.verificationCode = undefined;
            
            // Clear the verification code
            delete verificationCodes[verificationEmail];
            
            // IMPORTANT: Set authentication state immediately
            set({ 
              user: userEntry.user, 
              isAuthenticated: true,
              pendingVerification: false,
              verificationEmail: ''
            });
            
            return true;
          }
        }
        
        return false;
      },

      resendVerification: async (): Promise<boolean> => {
        const { verificationEmail } = get();
        
        if (!verificationEmail) {
          return false;
        }
        
        const userEntry = mockUsers.find(u => u.email === verificationEmail);
        
        if (userEntry && !userEntry.user.isEmailVerified) {
          const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
          
          // Update both storage locations
          verificationCodes[verificationEmail] = newCode;
          userEntry.user.verificationCode = newCode;
          
          await sendVerificationEmail(verificationEmail, newCode);
          return true;
        }
        
        return false;
      },

      logout: () => {
        set({ 
          user: null, 
          isAuthenticated: false,
          pendingVerification: false,
          verificationEmail: ''
        });
      }
    }),
    {
      name: 'auth-store',
      partialize: (state) => {
        // Only persist authenticated users, not pending verification states
        if (state.isAuthenticated && state.user) {
          return { 
            user: state.user, 
            isAuthenticated: state.isAuthenticated,
            pendingVerification: false,
            verificationEmail: ''
          };
        }
        // Don't persist anything if not authenticated
        return {
          user: null,
          isAuthenticated: false,
          pendingVerification: false,
          verificationEmail: ''
        };
      },
      // Add version to force reset of old data
      version: 1,
      migrate: (persistedState: any, version: number) => {
        // Reset any old verification states
        if (version === 0) {
          return {
            user: persistedState.isAuthenticated ? persistedState.user : null,
            isAuthenticated: persistedState.isAuthenticated || false,
            pendingVerification: false,
            verificationEmail: ''
          };
        }
        return persistedState;
      }
    }
  )
);