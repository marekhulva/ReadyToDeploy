import { StateCreator } from 'zustand';
import { supabaseHelpers, type Goal } from '../../services/supabase';

export type GoalStatus = 'active' | 'completed' | 'paused' | 'archived';

export interface GoalType {
  id: string;
  title: string;
  metric: string;
  deadline: string;
  category?: string;
  color?: string;
  why?: string;
  progress?: number;
  status?: GoalStatus;
  milestones?: Milestone[];
}

export interface Milestone {
  id: string;
  title: string;
  targetDate: string;
  completed: boolean;
}

export interface GoalsSlice {
  goals: GoalType[];
  goalsLoading: boolean;
  goalsError: string | null;
  
  // Actions
  fetchGoals: () => Promise<void>;
  addGoal: (goal: Omit<GoalType, 'id'>) => Promise<void>;
  updateGoal: (id: string, updates: Partial<GoalType>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  updateProgress: (id: string, progress: number) => Promise<void>;
}

export const createGoalsSlice: StateCreator<GoalsSlice> = (set, get) => ({
  goals: [],
  goalsLoading: false,
  goalsError: null,

  fetchGoals: async () => {
    set({ goalsLoading: true, goalsError: null });
    
    try {
      const user = await supabaseHelpers.getUser();
      if (!user) {
        set({ goalsLoading: false, goalsError: 'Not authenticated' });
        return;
      }

      const { data, error } = await supabaseHelpers.getGoals(user.id);
      
      if (error) {
        set({ goalsLoading: false, goalsError: error.message });
        return;
      }
      
      const goals: GoalType[] = (data || []).map(g => ({
        id: g.id,
        title: g.title,
        metric: g.metric,
        deadline: g.deadline,
        category: g.category,
        color: g.color,
        why: g.why,
        progress: g.progress,
        status: (g.status as GoalStatus) || 'active',
        milestones: []
      }));
      
      set({ goals, goalsLoading: false, goalsError: null });
    } catch (error: any) {
      set({ goalsLoading: false, goalsError: error.message });
    }
  },

  addGoal: async (goal: Omit<GoalType, 'id'>) => {
    try {
      const user = await supabaseHelpers.getUser();
      if (!user) {
        set({ goalsError: 'Not authenticated' });
        return;
      }

      const { data, error } = await supabaseHelpers.createGoal({
        user_id: user.id,
        title: goal.title,
        metric: goal.metric,
        deadline: goal.deadline,
        category: goal.category,
        color: goal.color || '#FFD700',
        why: goal.why,
        progress: goal.progress || 0,
        status: goal.status || 'active'
      });
      
      if (error) {
        set({ goalsError: error.message });
        return;
      }
      
      if (data) {
        const newGoal: GoalType = {
          id: data.id,
          title: data.title,
          metric: data.metric,
          deadline: data.deadline,
          category: data.category,
          color: data.color,
          why: data.why,
          progress: data.progress,
          status: data.status as GoalStatus,
          milestones: []
        };
        
        set(state => ({
          goals: [...state.goals, newGoal],
          goalsError: null
        }));
      }
    } catch (error: any) {
      set({ goalsError: error.message });
    }
  },

  updateGoal: async (id: string, updates: Partial<GoalType>) => {
    try {
      const { data, error } = await supabaseHelpers.updateGoal(id, updates);
      
      if (error) {
        set({ goalsError: error.message });
        return;
      }
      
      set(state => ({
        goals: state.goals.map(g => 
          g.id === id ? { ...g, ...updates } : g
        ),
        goalsError: null
      }));
    } catch (error: any) {
      set({ goalsError: error.message });
    }
  },

  deleteGoal: async (id: string) => {
    try {
      const { error } = await supabaseHelpers.deleteGoal(id);
      
      if (error) {
        set({ goalsError: error.message });
        return;
      }
      
      set(state => ({
        goals: state.goals.filter(g => g.id !== id),
        goalsError: null
      }));
    } catch (error: any) {
      set({ goalsError: error.message });
    }
  },

  updateProgress: async (id: string, progress: number) => {
    try {
      const { error } = await supabaseHelpers.updateGoal(id, { progress });
      
      if (error) {
        set({ goalsError: error.message });
        return;
      }
      
      set(state => ({
        goals: state.goals.map(g => 
          g.id === id ? { ...g, progress } : g
        ),
        goalsError: null
      }));
    } catch (error: any) {
      set({ goalsError: error.message });
    }
  }
});