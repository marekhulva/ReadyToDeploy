import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import Supabase slices
import { AuthSlice, createAuthSlice } from './slices/authSliceSupabase';
import { GoalsSlice, createGoalsSlice } from './slices/goalsSliceSupabase';
import { DailySlice, createDailySlice } from './slices/dailySliceSupabase';
import { SocialSlice, createSocialSlice } from './slices/socialSliceSupabase';

// Import original slices that don't need changes
import { VisualizationSlice, createVisualizationSlice } from './slices/visualizationSlice';
import { ProfileSlice, createProfileSlice } from './slices/profileSlice';

export type RootState = AuthSlice & 
  GoalsSlice & 
  DailySlice & 
  SocialSlice & 
  VisualizationSlice & 
  ProfileSlice;

const useStore = create<RootState>()(
  devtools(
    persist(
      (...a) => ({
        ...createAuthSlice(...a),
        ...createGoalsSlice(...a),
        ...createDailySlice(...a),
        ...createSocialSlice(...a),
        ...createVisualizationSlice(...a),
        ...createProfileSlice(...a),
      }),
      {
        name: 'best-app-storage',
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({
          // Only persist essential data
          isAuthenticated: state.isAuthenticated,
          user: state.user,
        }),
      }
    )
  )
);

export default useStore;