import { StateCreator } from 'zustand';
import { supabase, supabaseHelpers, type Action } from '../../services/supabase';

export interface DailyAction {
  id: string;
  title: string;
  time?: string;
  completed: boolean;
  goalId?: string;
  goalTitle?: string;
  goalColor?: string;
  streak?: number;
}

export interface DailySlice {
  actions: DailyAction[];
  actionsLoading: boolean;
  actionsError: string | null;
  selectedDate: string;
  
  // Actions
  fetchDailyActions: (date?: string) => Promise<void>;
  addAction: (action: Omit<DailyAction, 'id' | 'completed'>) => Promise<void>;
  completeAction: (id: string) => Promise<void>;
  uncompleteAction: (id: string) => Promise<void>;
  deleteAction: (id: string) => Promise<void>;
  setSelectedDate: (date: string) => void;
}

export const createDailySlice: StateCreator<DailySlice> = (set, get) => ({
  actions: [],
  actionsLoading: false,
  actionsError: null,
  selectedDate: new Date().toISOString().split('T')[0],

  fetchDailyActions: async (date?: string) => {
    const targetDate = date || get().selectedDate;
    set({ actionsLoading: true, actionsError: null });
    
    try {
      const user = await supabaseHelpers.getUser();
      if (!user) {
        set({ actionsLoading: false, actionsError: 'Not authenticated' });
        return;
      }

      const { data, error } = await supabaseHelpers.getDailyActions(user.id, targetDate);
      
      if (error) {
        set({ actionsLoading: false, actionsError: error.message });
        return;
      }
      
      const actions: DailyAction[] = (data || []).map(a => ({
        id: a.id,
        title: a.title,
        time: a.time,
        completed: a.completed,
        goalId: a.goal_id,
        goalTitle: (a as any).goals?.title,
        goalColor: (a as any).goals?.color,
        streak: 0 // Calculate from streaks table if needed
      }));
      
      set({ actions, actionsLoading: false, actionsError: null });
    } catch (error: any) {
      set({ actionsLoading: false, actionsError: error.message });
    }
  },

  addAction: async (action: Omit<DailyAction, 'id' | 'completed'>) => {
    try {
      const user = await supabaseHelpers.getUser();
      if (!user) {
        set({ actionsError: 'Not authenticated' });
        return;
      }

      const { data, error } = await supabaseHelpers.createAction({
        user_id: user.id,
        title: action.title,
        time: action.time,
        goal_id: action.goalId,
        completed: false,
        date: get().selectedDate
      });
      
      if (error) {
        set({ actionsError: error.message });
        return;
      }
      
      if (data) {
        const newAction: DailyAction = {
          id: data.id,
          title: data.title,
          time: data.time,
          completed: false,
          goalId: data.goal_id,
          goalTitle: action.goalTitle,
          goalColor: action.goalColor
        };
        
        set(state => ({
          actions: [...state.actions, newAction].sort((a, b) => {
            if (!a.time || !b.time) return 0;
            return a.time.localeCompare(b.time);
          }),
          actionsError: null
        }));
      }
    } catch (error: any) {
      set({ actionsError: error.message });
    }
  },

  completeAction: async (id: string) => {
    try {
      const { data, error } = await supabaseHelpers.completeAction(id);
      
      if (error) {
        set({ actionsError: error.message });
        return;
      }
      
      set(state => ({
        actions: state.actions.map(a => 
          a.id === id ? { ...a, completed: true } : a
        ),
        actionsError: null
      }));
    } catch (error: any) {
      set({ actionsError: error.message });
    }
  },

  uncompleteAction: async (id: string) => {
    try {
      // Use the update method from supabase helpers
      const { data, error } = await supabase
        .from('actions')
        .update({ completed: false, completed_at: null })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        set({ actionsError: error.message });
        return;
      }
      
      set(state => ({
        actions: state.actions.map(a => 
          a.id === id ? { ...a, completed: false } : a
        ),
        actionsError: null
      }));
    } catch (error: any) {
      set({ actionsError: error.message });
    }
  },

  deleteAction: async (id: string) => {
    try {
      const { error } = await supabase
        .from('actions')
        .delete()
        .eq('id', id);
      
      if (error) {
        set({ actionsError: error.message });
        return;
      }
      
      set(state => ({
        actions: state.actions.filter(a => a.id !== id),
        actionsError: null
      }));
    } catch (error: any) {
      set({ actionsError: error.message });
    }
  },

  setSelectedDate: (date: string) => {
    set({ selectedDate: date });
    get().fetchDailyActions(date);
  }
});