import { create } from 'zustand';
import { createAuthSlice, AuthSlice } from './slices/authSlice';
import { createDailySlice, DailySlice } from './slices/dailySlice';
import { createGoalsSlice, GoalsSlice } from './slices/goalsSlice';
import { createSocialSlice, SocialSlice } from './slices/socialSlice';
import { createUiSlice, UiSlice } from './slices/uiSlice';

type RootState = AuthSlice & DailySlice & GoalsSlice & SocialSlice & UiSlice;
export const useStore = create<RootState>()((...a) => ({
  ...createAuthSlice(...a),
  ...createUiSlice(...a),
  ...createGoalsSlice(...a),
  ...createDailySlice(...a),
  ...createSocialSlice(...a),
}));