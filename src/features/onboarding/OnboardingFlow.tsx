import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { JourneySelectionScreen } from './JourneySelectionScreen';
import { GoalSettingScreen } from './GoalSettingScreen';
import { MilestonesScreen } from './MilestonesScreen';
import { ActionsCommitmentsScreen } from './ActionsCommitmentsScreen';
import { ReviewCommitScreen } from './ReviewCommitScreen';
import { 
  OnboardingState, 
  PurchasedProgram, 
  OnboardingGoal, 
  Milestone, 
  Action 
} from './types';
import { useStore } from '../../state/rootStore';

// Mock data for demo - replace with actual data from your backend
const MOCK_PURCHASED_PROGRAMS: PurchasedProgram[] = [
  {
    id: 'jj-basketball',
    name: "JJ's Elite Shooting Program",
    author: 'JJ Redick',
    authorImage: 'https://example.com/jj.jpg',
    coverImage: 'https://images.unsplash.com/photo-1546519638-68e109498ffc',
    description: 'Master your shooting form with NBA veteran JJ Redick',
    duration: '12 weeks',
    difficulty: 'intermediate',
    category: 'fitness',
    gradient: ['#FF6B6B', '#4ECDC4'],
    price: 99.99,
    purchasedAt: new Date('2024-01-15'),
  },
  {
    id: 'testosterone-program',
    name: 'Natural Testosterone Optimization',
    author: 'Dr. Andrew Huberman',
    authorImage: 'https://example.com/huberman.jpg',
    coverImage: 'https://images.unsplash.com/photo-1583521214690-73421a1829a9',
    description: 'Science-based protocol for optimizing testosterone naturally',
    duration: '8 weeks',
    difficulty: 'beginner',
    category: 'health',
    gradient: ['#667EEA', '#764BA2'],
    price: 149.99,
    purchasedAt: new Date('2024-02-01'),
  },
];

interface Props {
  onComplete: () => void;
}

export const OnboardingFlow: React.FC<Props> = ({ onComplete }) => {
  const [state, setState] = useState<OnboardingState>({
    currentStep: 0,
    totalSteps: 5,
    journeyType: null,
    milestones: [],
    actions: [],
    isCompleted: false,
  });

  const addGoal = useStore((state) => state.addGoal);

  const handleJourneySelection = (type: 'custom' | 'program', program?: PurchasedProgram) => {
    setState({
      ...state,
      journeyType: type,
      selectedProgram: program,
      currentStep: 1,
    });
  };

  const handleGoalSubmit = (goal: OnboardingGoal) => {
    setState({
      ...state,
      goal,
      currentStep: 2,
    });
  };

  const handleMilestonesSubmit = (milestones: Milestone[]) => {
    setState({
      ...state,
      milestones,
      currentStep: 3,
    });
  };

  const handleActionsSubmit = (actions: Action[]) => {
    setState({
      ...state,
      actions,
      currentStep: 4,
    });
  };

  const handleCommit = () => {
    // Save goal to store
    if (state.goal) {
      // Add the main goal
      addGoal({
        id: `goal-${Date.now()}`,
        title: state.goal.title,
        metric: state.goal.targetValue?.toString() || '',
        deadline: state.goal.targetDate.toISOString(),
        why: state.goal.why,
        consistency: 0,
        status: 'On Track',
        color: state.goal.category === 'fitness' ? '#22C55E' : 
               state.goal.category === 'mindfulness' ? '#60A5FA' : 
               state.goal.category === 'productivity' ? '#A78BFA' : '#FFD700',
        category: state.goal.category,
        milestones: state.milestones,
      });

      // Convert and add actions to daily actions
      const addAction = useStore.getState().addAction;
      state.actions.forEach((action) => {
        const dailyAction = {
          id: action.id,
          title: action.title,
          goalTitle: state.goal.title,
          type: action.type === 'one-time' ? 'one-time' as const : 'commitment' as const,
          time: action.timeOfDay,
          streak: 0,
          done: false,
        };
        addAction(dailyAction);
      });

      // Store milestones in localStorage for now (or create a milestone slice)
      localStorage.setItem('onboarding_milestones', JSON.stringify(state.milestones));
      localStorage.setItem('onboarding_completed', 'true');
    }
    
    setState({
      ...state,
      isCompleted: true,
    });
    
    onComplete();
  };

  const handleBack = () => {
    setState({
      ...state,
      currentStep: Math.max(0, state.currentStep - 1),
    });
  };

  // Render appropriate screen based on current step
  switch (state.currentStep) {
    case 0:
      return (
        <JourneySelectionScreen
          onSelectJourney={handleJourneySelection}
          purchasedPrograms={MOCK_PURCHASED_PROGRAMS}
        />
      );
    
    case 1:
      return (
        <GoalSettingScreen
          onSubmit={handleGoalSubmit}
          onBack={handleBack}
        />
      );
    
    case 2:
      return state.goal ? (
        <MilestonesScreen
          goal={state.goal}
          onSubmit={handleMilestonesSubmit}
          onBack={handleBack}
        />
      ) : null;
    
    case 3:
      return state.goal ? (
        <ActionsCommitmentsScreen
          goal={state.goal}
          onSubmit={handleActionsSubmit}
          onBack={handleBack}
        />
      ) : null;
    
    case 4:
      return state.goal ? (
        <ReviewCommitScreen
          goal={state.goal}
          milestones={state.milestones}
          actions={state.actions}
          onCommit={handleCommit}
          onBack={handleBack}
        />
      ) : null;
    
    default:
      return null;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});