import { StateCreator } from 'zustand';
import { apiService } from '../../services/api.service';

export type ActionItem = { 
  id: string; 
  title: string; 
  goalTitle?: string; 
  type:'commitment'|'performance'|'one-time'; 
  time?: string; 
  streak: number; 
  done?: boolean; 
};

export type CompletedAction = {
  id: string;
  actionId: string;
  title: string;
  goalTitle?: string;
  completedAt: Date;
  isPrivate: boolean;
  streak: number;
  type: 'check' | 'photo' | 'audio' | 'milestone';
  mediaUrl?: string;
  category?: string;
};

export type DailySlice = {
  actions: ActionItem[];
  completedActions: CompletedAction[];
  actionsLoading: boolean;
  actionsError: string | null;
  fetchDailyActions: () => Promise<void>;
  toggleAction: (id: string) => Promise<void>;
  addAction: (a: Partial<ActionItem>) => Promise<void>;
  updateAction: (id: string, updates: Partial<ActionItem>) => Promise<void>;
  deleteAction: (id: string) => Promise<void>;
  addCompletedAction: (ca: CompletedAction) => void;
};

export const createDailySlice: StateCreator<DailySlice> = (set, get) => ({
  actions: [],
  completedActions: [],
  actionsLoading: false,
  actionsError: null,
  
  fetchDailyActions: async () => {
    set({ actionsLoading: true, actionsError: null });
    try {
      const response = await apiService.getDailyActions();
      if (response.success) {
        const actions = (response.data || []).map((a: any) => ({
          id: a.id,
          title: a.title,
          goalTitle: a.goal?.title,
          type: 'commitment' as const,
          time: a.time,
          streak: 0,
          done: a.done
        }));
        set({ actions, actionsLoading: false });
      } else {
        set({ actionsError: response.error, actionsLoading: false });
      }
    } catch (error: any) {
      set({ actionsError: error.message, actionsLoading: false });
    }
  },
  
  toggleAction: async (id) => {
    try {
      const response = await apiService.completeAction(id);
      if (response.success) {
        set((s) => ({
          actions: s.actions.map(a => 
            a.id === id 
              ? { ...a, done: true, streak: a.streak + 1 } 
              : a
          )
        }));
      }
    } catch (error) {
      console.error('Failed to complete action:', error);
    }
  },
  
  addAction: async (actionData) => {
    try {
      const response = await apiService.createAction({
        title: actionData.title || '',
        time: actionData.time,
        goalId: undefined // Add goalId mapping if needed
      });
      
      if (response.success && response.data) {
        const newAction: ActionItem = {
          id: response.data.id,
          title: response.data.title,
          goalTitle: response.data.goal?.title,
          type: 'commitment',
          time: response.data.time,
          streak: 0,
          done: false
        };
        set((s) => ({ actions: [...s.actions, newAction] }));
      }
    } catch (error) {
      console.error('Failed to add action:', error);
    }
  },

  updateAction: async (id, updates) => {
    set({ actionsLoading: true, actionsError: null });
    try {
      const response = await apiService.updateAction(id, {
        title: updates.title,
        time: updates.time,
        goalId: undefined // Add goalId mapping if needed
      });
      
      if (response.success && response.data) {
        set((state) => ({
          actions: state.actions.map(a => 
            a.id === id ? { 
              ...a, 
              title: response.data.title,
              time: response.data.time,
              goalTitle: response.data.goal?.title 
            } : a
          ),
          actionsLoading: false
        }));
      } else {
        set({ actionsError: response.error, actionsLoading: false });
      }
    } catch (error: any) {
      set({ actionsError: error.message, actionsLoading: false });
    }
  },

  deleteAction: async (id) => {
    set({ actionsLoading: true, actionsError: null });
    try {
      const response = await apiService.deleteAction(id);
      if (response.success) {
        set((state) => ({
          actions: state.actions.filter(a => a.id !== id),
          actionsLoading: false
        }));
      } else {
        set({ actionsError: response.error, actionsLoading: false });
      }
    } catch (error: any) {
      set({ actionsError: error.message, actionsLoading: false });
    }
  },
  
  addCompletedAction: (ca) => set((s) => ({ 
    completedActions: [...s.completedActions, ca] 
  })),
});