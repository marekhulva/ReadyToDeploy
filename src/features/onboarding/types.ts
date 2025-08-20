export type JourneyType = 'custom' | 'program';

export interface PurchasedProgram {
  id: string;
  name: string;
  author: string;
  authorImage: string;
  coverImage: string;
  description: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: 'fitness' | 'mindfulness' | 'productivity' | 'health' | 'skills';
  gradient: string[];
  price: number;
  purchasedAt: Date;
}

export interface OnboardingGoal {
  title: string;
  category: 'fitness' | 'mindfulness' | 'productivity' | 'health' | 'skills' | 'other';
  targetDate: Date;
  targetValue?: number;
  unit?: string;
  why: string;
  currentValue?: number;
}

export interface Milestone {
  id: string;
  title: string;
  targetDate: Date;
  targetValue?: number;
  unit?: string;
  completed: boolean;
  order: number;
}

export interface Action {
  id: string;
  type: 'one-time' | 'commitment';
  title: string;
  description?: string;
  category: 'fitness' | 'mindfulness' | 'productivity' | 'health' | 'skills' | 'other';
  icon: string;
  
  // For commitments
  frequency?: 'daily' | 'weekly' | 'monthly';
  daysPerWeek?: number;
  specificDays?: number[]; // 0-6 for Sunday-Saturday
  timeOfDay?: string; // HH:MM format
  duration?: number; // in minutes
  
  // For one-time actions
  dueDate?: Date;
  
  reminder?: boolean;
  reminderTime?: string; // HH:MM format
}

export interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  journeyType: JourneyType | null;
  selectedProgram?: PurchasedProgram;
  goal?: OnboardingGoal;
  milestones: Milestone[];
  actions: Action[];
  isCompleted: boolean;
}