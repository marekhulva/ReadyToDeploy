import { StateCreator } from 'zustand';
import { apiService } from '../../services/api.service';
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
  token: string | null;
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
  token: null,
  loading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const response = await apiService.login(email, password);
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        
        // Save to storage
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('user', JSON.stringify(user));
        
        set({
          isAuthenticated: true,
          user,
          token,
          loading: false,
          error: null
        });
        
        return true;
      } else {
        set({
          loading: false,
          error: response.error || 'Login failed'
        });
        return false;
      }
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
      const response = await apiService.register(email, password, name);
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        
        // Save to storage
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('user', JSON.stringify(user));
        
        set({
          isAuthenticated: true,
          user,
          token,
          loading: false,
          error: null
        });
        
        return true;
      } else {
        set({
          loading: false,
          error: response.error || 'Registration failed'
        });
        return false;
      }
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || 'Registration failed'
      });
      return false;
    }
  },

  logout: async () => {
    await apiService.logout();
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    
    set({
      isAuthenticated: false,
      user: null,
      token: null,
      error: null
    });
  },

  checkAuth: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');
      
      if (token && userStr) {
        const user = JSON.parse(userStr);
        set({
          isAuthenticated: true,
          user,
          token
        });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    }
  },

  clearError: () => set({ error: null })
});