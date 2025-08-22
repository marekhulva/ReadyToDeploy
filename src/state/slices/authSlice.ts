import { StateCreator } from 'zustand';
import { backendService } from '../../services/backend.service';
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
  updateAvatar: (avatarUri: string) => Promise<boolean>;
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
      const response = await backendService.signIn(email, password);
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        
        // Save to storage (only if we have valid values)
        if (token) {
          await AsyncStorage.setItem('token', token);
        }
        if (user) {
          await AsyncStorage.setItem('user', JSON.stringify(user));
        }
        
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
      const response = await backendService.signUp(email, password, name);
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        
        // Save to storage (only if we have valid values)
        if (token) {
          await AsyncStorage.setItem('token', token);
        }
        if (user) {
          await AsyncStorage.setItem('user', JSON.stringify(user));
        }
        
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
    await backendService.signOut();
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

  clearError: () => set({ error: null }),
  
  updateAvatar: async (avatarUri: string) => {
    try {
      // For now, store locally in state and AsyncStorage
      const currentUser = get().user;
      if (!currentUser) return false;
      
      const updatedUser = { ...currentUser, avatar: avatarUri };
      
      // Update state
      set({ user: updatedUser });
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      
      // TODO: Upload to backend when API is ready
      // const response = await backendService.updateAvatar(avatarUri);
      // if (response.success) { ... }
      
      return true;
    } catch (error) {
      console.error('Failed to update avatar:', error);
      return false;
    }
  }
});