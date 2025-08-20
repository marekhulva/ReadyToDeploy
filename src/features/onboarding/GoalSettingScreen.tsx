import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { 
  Target, Calendar, Heart, TrendingUp, 
  Dumbbell, Brain, Briefcase, HeartHandshake, Lightbulb
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeInDown,
  Layout,
  runOnJS,
} from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import { HapticButton } from '../../ui/HapticButton';
import { LuxuryTheme } from '../../design/luxuryTheme';
import { OnboardingGoal } from './types';

const { width, height } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'fitness', label: 'Fitness', icon: Dumbbell, color: '#22C55E' },
  { id: 'mindfulness', label: 'Mindfulness', icon: Brain, color: '#60A5FA' },
  { id: 'productivity', label: 'Productivity', icon: Briefcase, color: '#A78BFA' },
  { id: 'health', label: 'Health', icon: HeartHandshake, color: '#EF4444' },
  { id: 'skills', label: 'Skills', icon: Lightbulb, color: '#F59E0B' },
] as const;

const GOAL_SUGGESTIONS = {
  fitness: ['Lose weight', 'Build muscle', 'Run a marathon', 'Improve flexibility'],
  mindfulness: ['Meditate daily', 'Reduce stress', 'Better sleep', 'Practice gratitude'],
  productivity: ['Complete project', 'Learn new skill', 'Build habits', 'Time management'],
  health: ['Lower blood pressure', 'Quit smoking', 'Eat healthier', 'Drink more water'],
  skills: ['Learn language', 'Master instrument', 'Code daily', 'Public speaking'],
};

interface Props {
  onSubmit: (goal: OnboardingGoal) => void;
  onBack: () => void;
}

export const GoalSettingScreen: React.FC<Props> = ({ onSubmit, onBack }) => {
  const [goal, setGoal] = useState<Partial<OnboardingGoal>>({
    category: 'fitness',
    targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // Skip category selection, start at goal
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    progressWidth.value = withTiming((currentStep + 1) * 33.33, { duration: 300 });
  }, [currentStep]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const handleCategorySelect = (categoryId: string) => {
    setGoal({ ...goal, category: categoryId as any });
    setTimeout(() => {
      setCurrentStep(1);
    }, 100);
  };

  const handleGoalTitleSubmit = () => {
    if (!goal.title || goal.title.trim().length === 0) {
      return;
    }
    
    // Skip the why step and submit directly
    const completeGoal: OnboardingGoal = {
      title: goal.title,
      category: goal.category as any,
      targetDate: goal.targetDate || new Date(),
      why: '', // Empty why since we're skipping it
      targetValue: goal.targetValue,
      unit: goal.unit,
      currentValue: goal.currentValue,
    };
    
    onSubmit(completeGoal);
  };

  const handleWhySubmit = () => {
    if (!goal.title || goal.title.trim().length === 0) {
      return;
    }
    
    if (!goal.why || goal.why.trim().length === 0) {
      return;
    }
    
    const completeGoal: OnboardingGoal = {
      title: goal.title,
      category: goal.category as any,
      targetDate: goal.targetDate || new Date(),
      why: goal.why,
      targetValue: goal.targetValue,
      unit: goal.unit,
      currentValue: goal.currentValue,
    };
    
    onSubmit(completeGoal);
  };

  const renderCategoryStep = () => (
    <ScrollView 
      style={styles.stepScrollView}
      contentContainerStyle={styles.stepScrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View 
        entering={FadeIn.duration(600)}
      >
        <View style={styles.stepHeader}>
          <Target color={LuxuryTheme.colors.primary.gold} size={32} />
          <Text style={styles.stepTitle}>What area of your life?</Text>
          <Text style={styles.stepSubtitle}>Choose your primary focus</Text>
        </View>

        <View style={styles.categoriesGrid}>
          {CATEGORIES.map((category, index) => (
            <Animated.View
              key={category.id}
              entering={FadeInDown.delay(index * 50).springify()}
              style={styles.categoryCardWrapper}
            >
              <HapticButton
                hapticType="light"
                onPress={() => handleCategorySelect(category.id)}
                style={[
                  styles.categoryCard,
                  goal.category === category.id && styles.categoryCardSelected,
                ]}
              >
                <LinearGradient
                  colors={
                    goal.category === category.id
                      ? [category.color + '20', category.color + '10']
                      : ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.01)']
                  }
                  style={StyleSheet.absoluteFillObject}
                />
                <category.icon
                  color={goal.category === category.id ? category.color : LuxuryTheme.colors.text.secondary}
                  size={28}
                />
                <Text style={[
                  styles.categoryLabel,
                  goal.category === category.id && { color: category.color }
                ]}>
                  {category.label}
                </Text>
              </HapticButton>
            </Animated.View>
          ))}
        </View>
      </Animated.View>
    </ScrollView>
  );

  const renderGoalStep = () => (
    <ScrollView 
      style={styles.stepScrollView}
      contentContainerStyle={styles.stepScrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View 
        entering={FadeIn.duration(600)}
      >
      <View style={styles.stepHeader}>
        <TrendingUp color={LuxuryTheme.colors.primary.gold} size={32} />
        <Text style={styles.stepTitle}>Define your goal</Text>
        <Text style={styles.stepSubtitle}>Be specific and measurable</Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.goalInput}
          placeholder="e.g., Lose 20 pounds"
          placeholderTextColor={LuxuryTheme.colors.text.muted}
          value={goal.title}
          onChangeText={(text) => setGoal({ ...goal, title: text })}
          autoFocus
          multiline
          maxLength={100}
        />
        
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Popular goals:</Text>
          <View style={styles.suggestionChips}>
            {GOAL_SUGGESTIONS[goal.category as keyof typeof GOAL_SUGGESTIONS]?.map((suggestion) => (
              <TouchableOpacity
                key={suggestion}
                onPress={() => setGoal({ ...goal, title: suggestion })}
                style={styles.suggestionChip}
              >
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.dateSection}>
          <Text style={styles.dateLabel}>Target Date</Text>
          <HapticButton
            hapticType="light"
            onPress={() => setShowDatePicker(true)}
            style={styles.dateButton}
          >
            <Calendar color={LuxuryTheme.colors.text.secondary} size={20} />
            <Text style={styles.dateText}>
              {goal.targetDate?.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </HapticButton>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={goal.targetDate || new Date()}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) setGoal({ ...goal, targetDate: date });
            }}
          />
        )}

        <HapticButton
          hapticType="medium"
          onPress={handleGoalTitleSubmit}
          style={[styles.continueButton, !goal.title && styles.continueButtonDisabled]}
          disabled={!goal.title}
        >
          <LinearGradient
            colors={[LuxuryTheme.colors.primary.gold, LuxuryTheme.colors.primary.champagne]}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
          <Text style={styles.continueButtonText}>Set Goal</Text>
        </HapticButton>
      </View>
      </Animated.View>
    </ScrollView>
  );

  const renderWhyStep = () => (
    <ScrollView 
      style={styles.stepScrollView}
      contentContainerStyle={styles.stepScrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View 
        entering={FadeIn.duration(600)}
      >
      <View style={styles.stepHeader}>
        <Heart color={LuxuryTheme.colors.primary.gold} size={32} />
        <Text style={styles.stepTitle}>Why this matters</Text>
        <Text style={styles.stepSubtitle}>Your deeper motivation</Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.whyPrompt}>
          When you achieve "{goal.title}", how will your life be different?
        </Text>
        
        <TextInput
          style={styles.whyInput}
          placeholder="This goal matters to me because..."
          placeholderTextColor={LuxuryTheme.colors.text.muted}
          value={goal.why}
          onChangeText={(text) => setGoal({ ...goal, why: text })}
          autoFocus
          multiline
          maxLength={500}
          textAlignVertical="top"
        />

        <View style={styles.whyTips}>
          <Text style={styles.whyTipsTitle}>Tips for a powerful why:</Text>
          <Text style={styles.whyTip}>• Connect to your values</Text>
          <Text style={styles.whyTip}>• Think about who you'll become</Text>
          <Text style={styles.whyTip}>• Consider impact on loved ones</Text>
          <Text style={styles.whyTip}>• Visualize the end result</Text>
        </View>

        <HapticButton
          hapticType="medium"
          onPress={handleWhySubmit}
          style={[styles.continueButton, !goal.why && styles.continueButtonDisabled]}
          disabled={!goal.why}
        >
          <LinearGradient
            colors={[LuxuryTheme.colors.primary.gold, LuxuryTheme.colors.primary.champagne]}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
          <Text style={styles.continueButtonText}>Set Goal</Text>
        </HapticButton>
      </View>
      </Animated.View>
    </ScrollView>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#000000', '#000000', '#000000']}
        style={StyleSheet.absoluteFillObject}
        locations={[0, 0.5, 1]}
      />

      <View style={styles.progressBar}>
        <Animated.View style={[styles.progressFill, progressStyle]}>
          <LinearGradient
            colors={[LuxuryTheme.colors.primary.gold, LuxuryTheme.colors.primary.champagne]}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </Animated.View>
      </View>

      <View style={styles.stepsContainer}>
        {/* Category step skipped - starting directly with goal */}
        {/* currentStep === 0 && renderCategoryStep() */}
        {currentStep === 1 && renderGoalStep()}
        {/* Why step removed - going directly from goal to milestones */}
        {/* currentStep === 2 && renderWhyStep() */}
      </View>

      {currentStep > 0 && (
        <HapticButton
          hapticType="light"
          onPress={() => {
            if (currentStep > 0) {
              setCurrentStep(currentStep - 1);
            } else {
              onBack();
            }
          }}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </HapticButton>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LuxuryTheme.colors.background.primary,
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginTop: 60,
  },
  progressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  stepsContainer: {
    flex: 1,
  },
  stepScrollView: {
    flex: 1,
  },
  stepScrollContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 100,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: LuxuryTheme.colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: LuxuryTheme.colors.text.tertiary,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: -6,
  },
  categoryCardWrapper: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  categoryCard: {
    height: 120,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: LuxuryTheme.colors.interactive.border,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  categoryCardSelected: {
    borderWidth: 2,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: LuxuryTheme.colors.text.secondary,
    marginTop: 8,
  },
  inputContainer: {
    flex: 1,
  },
  goalInput: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 20,
    fontSize: 18,
    color: LuxuryTheme.colors.text.primary,
    borderWidth: 1,
    borderColor: LuxuryTheme.colors.interactive.border,
    minHeight: 100,
  },
  suggestionsContainer: {
    marginTop: 24,
  },
  suggestionsTitle: {
    fontSize: 12,
    color: LuxuryTheme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  suggestionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: LuxuryTheme.colors.interactive.border,
  },
  suggestionText: {
    fontSize: 14,
    color: LuxuryTheme.colors.text.secondary,
  },
  dateSection: {
    marginTop: 32,
  },
  dateLabel: {
    fontSize: 12,
    color: LuxuryTheme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: LuxuryTheme.colors.interactive.border,
    gap: 12,
  },
  dateText: {
    fontSize: 16,
    color: LuxuryTheme.colors.text.primary,
    flex: 1,
  },
  whyPrompt: {
    fontSize: 16,
    color: LuxuryTheme.colors.text.secondary,
    marginBottom: 20,
    lineHeight: 24,
  },
  whyInput: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 20,
    fontSize: 16,
    color: LuxuryTheme.colors.text.primary,
    borderWidth: 1,
    borderColor: LuxuryTheme.colors.interactive.border,
    minHeight: 150,
  },
  whyTips: {
    marginTop: 24,
    padding: 16,
    backgroundColor: 'rgba(231, 180, 58, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(231, 180, 58, 0.2)',
  },
  whyTipsTitle: {
    fontSize: 12,
    color: LuxuryTheme.colors.primary.gold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    fontWeight: '600',
  },
  whyTip: {
    fontSize: 14,
    color: LuxuryTheme.colors.text.secondary,
    lineHeight: 22,
  },
  continueButton: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    overflow: 'hidden',
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  backButton: {
    position: 'absolute',
    top: 70,
    left: 24,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: LuxuryTheme.colors.text.secondary,
  },
});