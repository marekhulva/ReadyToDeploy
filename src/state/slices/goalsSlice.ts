import { StateCreator } from 'zustand';
import { backendService } from '../../services/backend.service';

export type Milestone = {
  id: string;
  title: string;
  targetDate: Date;
  targetValue?: number;
  unit?: string;
  completed: boolean;
  order: number;
};

export type Goal = {
  id: string; 
  title: string; 
  metric: string; 
  deadline: string; 
  why?: string;
  consistency: number; 
  status: 'On Track'|'Needs Attention'|'Critical';
  color: string;
  category?: 'fitness' | 'mindfulness' | 'productivity' | 'health' | 'skills' | 'other';
  milestones?: Milestone[];
};

export type GoalsSlice = {
  goals: Goal[];
  goalsLoading: boolean;
  goalsError: string | null;
  fetchGoals: () => Promise<void>;
  addGoal: (g: Partial<Goal>) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  updateGoalMilestones: (goalId: string, milestones: Milestone[]) => void;
  toggleMilestoneComplete: (goalId: string, milestoneId: string) => void;
};

export const createGoalsSlice: StateCreator<GoalsSlice> = (set, get) => ({
  goals: [],
  goalsLoading: false,
  goalsError: null,
  
  fetchGoals: async () => {
    set({ goalsLoading: true, goalsError: null });
    try {
      const response = await backendService.getGoals();
      if (response.success) {
        set({ goals: response.data || [], goalsLoading: false });
      } else {
        set({ goalsError: response.error, goalsLoading: false });
      }
    } catch (error: any) {
      set({ goalsError: error.message, goalsLoading: false });
    }
  },
  
  addGoal: async (goalData) => {
    try {
      const response = await backendService.createGoal({
        title: goalData.title || '',
        metric: goalData.metric || '',
        deadline: goalData.deadline || new Date().toISOString(),
        category: goalData.category,
        color: goalData.color || '#FFD700',
        why: goalData.why
      });
      
      if (response.success && response.data) {
        set((state) => ({ goals: [response.data, ...state.goals] }));
      }
    } catch (error) {
      console.error('Failed to add goal:', error);
    }
  },
  
  updateGoal: async (id, updates) => {
    set({ goalsLoading: true, goalsError: null });
    try {
      const response = await backendService.updateGoal(id, updates);
      if (response.success && response.data) {
        set((state) => ({
          goals: state.goals.map(g => 
            g.id === id ? { ...g, ...response.data } : g
          ),
          goalsLoading: false
        }));
      } else {
        set({ goalsError: response.error, goalsLoading: false });
      }
    } catch (error: any) {
      set({ goalsError: error.message, goalsLoading: false });
    }
  },

  deleteGoal: async (id) => {
    set({ goalsLoading: true, goalsError: null });
    try {
      const response = await backendService.deleteGoal(id);
      if (response.success) {
        set((state) => ({
          goals: state.goals.filter(g => g.id !== id),
          goalsLoading: false
        }));
      } else {
        set({ goalsError: response.error, goalsLoading: false });
      }
    } catch (error: any) {
      set({ goalsError: error.message, goalsLoading: false });
    }
  },

  updateGoalMilestones: (goalId, milestones) => 
    set((state) => ({
      goals: state.goals.map(g => 
        g.id === goalId ? { ...g, milestones } : g
      )
    })),
    
  toggleMilestoneComplete: (goalId, milestoneId) =>
    set((state) => ({
      goals: state.goals.map(g => 
        g.id === goalId 
          ? {
              ...g,
              milestones: g.milestones?.map(m =>
                m.id === milestoneId ? { ...m, completed: !m.completed } : m
              )
            }
          : g
      )
    })),
});