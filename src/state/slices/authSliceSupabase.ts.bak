import { StateCreator } from 'zustand';
import { supabase, supabaseHelpers } from '../../services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type User = {
  id: string;
  email: string;
  name: string;
  avatar?: string;
};

export type AuthSlice = {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
};

export const createAuthSlice: StateCreator<AuthSlice> = (set, get) => ({
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabaseHelpers.signIn(email, password);
      
      if (error) {
        set({
          loading: false,
          error: error.message
        });
        return false;
      }
      
      if (data?.user) {
        // Get user profile
        const { data: profile } = await supabaseHelpers.getProfile(data.user.id);
        
        const user: User = {
          id: data.user.id,
          email: data.user.email || '',
          name: profile?.name || data.user.email?.split('@')[0] || 'User',
          avatar: profile?.avatar
        };
        
        set({
          isAuthenticated: true,
          user,
          loading: false,
          error: null
        });
        
        return true;
      }
      
      return false;
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || 'Login failed'
      });
      return false;
    }
  },

  register: async (email: string, password: string, name: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabaseHelpers.signUp(email, password, name);
      
      if (error) {
        set({
          loading: false,
          error: error.message
        });
        return false;
      }
      
      if (data?.user) {
        const user: User = {
          id: data.user.id,
          email: data.user.email || '',
          name: name,
          avatar: undefined
        };
        
        set({
          isAuthenticated: true,
          user,
          loading: false,
          error: null
        });
        
        return true;
      }
      
      return false;
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || 'Registration failed'
      });
      return false;
    }
  },

  logout: async () => {
    await supabaseHelpers.signOut();
    
    set({
      isAuthenticated: false,
      user: null,
      error: null
    });
  },

  checkAuth: async () => {
    try {
      const user = await supabaseHelpers.getUser();
      
      if (user) {
        // Get user profile
        const { data: profile } = await supabaseHelpers.getProfile(user.id);
        
        const userData: User = {
          id: user.id,
          email: user.email || '',
          name: profile?.name || user.email?.split('@')[0] || 'User',
          avatar: profile?.avatar
        };
        
        set({
          isAuthenticated: true,
          user: userData
        });
      } else {
        set({
          isAuthenticated: false,
          user: null
        });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      set({
        isAuthenticated: false,
        user: null
      });
    }
  },

  clearError: () => set({ error: null })
});