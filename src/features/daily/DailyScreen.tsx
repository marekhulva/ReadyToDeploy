import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, Pressable, ActivityIndicator, Alert } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
  FadeInDown,
  FadeIn,
  withSpring,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useStore } from '../../state/rootStore';
import { RadialProgress } from '../../ui/RadialProgress';
import { HapticButton } from '../../ui/HapticButton';
import { ConfettiView } from '../../ui/ConfettiView';
import { DailyReviewModal } from './DailyReviewModalEnhanced';
import { ActionItem } from './ActionItem';
import { SocialSharePrompt } from '../social/SocialSharePrompt';
import { ShareComposer } from '../social/ShareComposer';
import { EmptyState } from '../../ui/EmptyState';
import { LuxuryTheme } from '../../design/luxuryTheme';
import { Sparkles, Zap, Trophy, TrendingUp, Clock, Calendar, Target } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

export const DailyScreen = () => {
  const actions = useStore(s=>s.actions);
  const actionsLoading = useStore(s=>s.actionsLoading);
  const actionsError = useStore(s=>s.actionsError);
  const fetchDailyActions = useStore(s=>s.fetchDailyActions);
  const openOnboarding = useStore(s=>s.openOnboarding);
  const completed = actions.filter(a=>a.done).length;
  const progress = actions.length ? (completed/actions.length)*100 : 0;
  const openReview = useStore(s=>s.openDailyReview);
  const [showSharePrompt, setShowSharePrompt] = useState(false);
  const allCompleted = actions.length > 0 && completed === actions.length;
  
  // Animations
  const pulseAnimation = useSharedValue(0);
  const progressScale = useSharedValue(0);
  const glowIntensity = useSharedValue(0);
  const heroCardScale = useSharedValue(0.95);
  const streakAnimation = useSharedValue(0);
  
  // Calculate streak (mock data for now)
  const currentStreak = 7;
  const bestStreak = 21;
  
  // Trigger share prompt at milestones
  useEffect(() => {
    if (progress >= 70 && progress < 100 && !showSharePrompt) {
      setTimeout(() => setShowSharePrompt(true), 2000);
    }
  }, [progress]);

  // Initial load animations
  useEffect(() => {
    heroCardScale.value = withSpring(1, { damping: 15, stiffness: 100 });
    progressScale.value = withDelay(200, withSpring(1, { damping: 12 }));
    
    // Streak fire animation
    if (currentStreak > 0) {
      streakAnimation.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1
      );
    }
  }, []);

  // Progress change animation
  useEffect(() => {
    glowIntensity.value = withSequence(
      withTiming(1, { duration: 300 }),
      withTiming(progress / 100, { duration: 500 })
    );
  }, [progress]);

  // Evening pulse for review
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 18) {
      pulseAnimation.value = withRepeat(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
  }, []);

  const heroCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heroCardScale.value }],
  }));

  const progressRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: progressScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(glowIntensity.value, [0, 1], [0.1, 0.4]),
    shadowRadius: interpolate(glowIntensity.value, [0, 1], [8, 24]),
  }));

  const streakGlowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(streakAnimation.value, [0, 1], [0.6, 1]),
    transform: [{ scale: interpolate(streakAnimation.value, [0, 1], [1, 1.1]) }],
  }));

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { greeting: 'Good Morning', emoji: '☀️' };
    if (hour < 18) return { greeting: 'Good Afternoon', emoji: '🌤' };
    return { greeting: 'Good Evening', emoji: '🌙' };
  };

  const { greeting, emoji } = getTimeOfDay();

  const handleRetry = async () => {
    try {
      await fetchDailyActions();
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh actions. Please try again.');
    }
  };

  // Show error state if there's an error
  if (actionsError && !actionsLoading) {
    return (
      <View style={styles.container}>
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000000' }]} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
          <Text style={styles.errorMessage}>{actionsError}</Text>
          <Pressable style={styles.retryButton} onPress={handleRetry}>
            <LinearGradient
              colors={[LuxuryTheme.colors.primary.gold, LuxuryTheme.colors.primary.champagne]}
              style={StyleSheet.absoluteFillObject}
            />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Pure Black Background */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000000' }]} />
      
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Date Display */}
        <Animated.View 
          entering={FadeInDown.duration(500).springify()}
          style={styles.greetingContainer}
        >
          <Text style={styles.date}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </Text>
        </Animated.View>

        {/* Hero Progress Card - Simplified */}
        <Animated.View 
          entering={FadeInDown.delay(100).springify()}
          style={[styles.heroCard, heroCardStyle]}
        >
          {/* Minimal gradient */}
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.03)', 'transparent']}
            style={StyleSheet.absoluteFillObject}
          />
          
          {/* Main Progress Ring */}
          <Animated.View style={[styles.progressRing, progressRingStyle]}>
            <RadialProgress 
              progress={progress} 
              size={120} 
              strokeWidth={5}
              color={progress === 100 ? '#FFD700' : '#FFFFFF'}
            />
          </Animated.View>
          
          {/* Quick Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{completed}</Text>
              <Text style={styles.statLabel}>Done</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            {/* Streak */}
            <View style={styles.statItem}>
              <Text style={[styles.statValue, styles.streakValue]}>{currentStreak}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{actions.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
          
          {/* Motivational Message */}
          <View style={styles.messageContainer}>
            {progress === 100 ? (
              <View style={styles.completionMessage}>
                <Text style={styles.completionText}>Complete ✓</Text>
              </View>
            ) : progress >= 80 ? (
              <Text style={styles.motivationText}>So close</Text>
            ) : progress >= 50 ? (
              <Text style={styles.motivationText}>Halfway there</Text>
            ) : progress > 0 ? (
              <Text style={styles.motivationText}>Good start</Text>
            ) : (
              <Text style={styles.motivationText}>Start your day</Text>
            )}
          </View>
        </Animated.View>


        {/* Actions List - The Core Loop */}
        <View style={styles.actionsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>TODAY'S MISSION</Text>
            {actions.length > 0 && (
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>{completed}/{actions.length}</Text>
              </View>
            )}
          </View>
          
          {actions.length > 0 ? (
            <View style={styles.actionsList}>
              {actions
                .sort((a, b) => {
                  // Sort by time (earliest first)
                  if (!a.time && !b.time) return 0;
                  if (!a.time) return 1; // Actions without time go to the end
                  if (!b.time) return -1;
                  
                  // Convert time strings (HH:MM) to comparable numbers
                  const timeA = a.time.split(':').map(Number);
                  const timeB = b.time.split(':').map(Number);
                  const minutesA = timeA[0] * 60 + timeA[1];
                  const minutesB = timeB[0] * 60 + timeB[1];
                  
                  return minutesA - minutesB;
                })
                .map((action, index) => (
                <Animated.View
                  key={action.id}
                  entering={FadeInDown.delay(250 + index * 50).springify()}
                >
                  <ActionItem 
                    id={action.id} 
                    title={action.title} 
                    goalTitle={action.goalTitle} 
                    done={action.done} 
                    streak={action.streak}
                    time={action.time}
                    type={action.type}
                  />
                </Animated.View>
              ))}
            </View>
          ) : (
            <EmptyState
              icon={Target}
              title="Ready to Start Your Day?"
              subtitle="Add your first daily action to begin building powerful habits"
              actionText="Start Onboarding"
              onAction={openOnboarding}
              illustration="glow"
              theme="gold"
            />
          )}
        </View>

        {/* Review CTA - Simplified */}
        <Animated.View 
          entering={FadeInDown.delay(400).springify()}
          style={styles.reviewContainer}
        >
          <HapticButton 
            onPress={openReview} 
            style={styles.reviewButton}
            hapticType="medium"
          >
            <Text style={styles.reviewText}>Review Day</Text>
          </HapticButton>
        </Animated.View>
      </ScrollView>

      <DailyReviewModal />
      <SocialSharePrompt
        visible={showSharePrompt}
        onClose={() => setShowSharePrompt(false)}
        progress={progress}
        completedActions={completed}
        totalActions={actions.length}
        streak={currentStreak}
      />
      <ShareComposer />
      <ConfettiView active={allCompleted} />
      
      {/* Loading Overlay */}
      {actionsLoading && (
        <View style={styles.loadingOverlay}>
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFillObject} />
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color={LuxuryTheme.colors.primary.gold} />
            <Text style={styles.loadingText}>Loading your actions...</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  glowOverlay: {
    ...StyleSheet.absoluteFillObject,
    shadowColor: '#FFD700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  greetingContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  date: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  heroCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
    overflow: 'hidden',
    alignItems: 'center',
  },
  progressRing: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  streakItem: {
    transform: [{ scale: 1.1 }],
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  streakValue: {
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  messageContainer: {
    width: '100%',
    alignItems: 'center',
  },
  completionMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  completionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
  },
  motivationText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  timePressureCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.1)',
  },
  timePressureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  timePressureTitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeRemaining: {
    fontSize: 24,
    fontWeight: '600',
    color: '#60A5FA',
    marginBottom: 12,
  },
  timePressureBar: {
    height: 4,
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  timePressureFill: {
    height: '100%',
    backgroundColor: '#60A5FA',
  },
  actionsContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 1.5,
  },
  sectionBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  sectionBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  actionsList: {
    gap: 8,
  },
  reviewContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  reviewButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    overflow: 'hidden',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContent: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  loadingText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 16,
    fontWeight: '500',
  },
});