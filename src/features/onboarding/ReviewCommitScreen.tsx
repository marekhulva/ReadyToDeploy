import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { 
  Trophy, Target, Flag, Zap, RefreshCw,
  Sparkles, CheckCircle, Calendar, Clock
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  FadeIn,
  FadeInDown,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { HapticButton } from '../../ui/HapticButton';
import { LuxuryTheme } from '../../design/luxuryTheme';
import { OnboardingGoal, Milestone, Action } from './types';
import * as Haptics from 'expo-haptics';
import ConfettiCannon from 'react-native-confetti-cannon';

const { width, height } = Dimensions.get('window');

interface Props {
  goal: OnboardingGoal;
  milestones: Milestone[];
  actions: Action[];
  onCommit: () => void;
  onBack: () => void;
}

export const ReviewCommitScreen: React.FC<Props> = ({ 
  goal, 
  milestones, 
  actions,
  onCommit,
  onBack 
}) => {
  const confettiRef = useRef<ConfettiCannon>(null);
  const pulseAnim = useSharedValue(1);
  const glowAnim = useSharedValue(0);
  const [hasCommitted, setHasCommitted] = useState(false);

  useEffect(() => {
    // Pulse animation for commit button
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Glow animation
    glowAnim.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const handleCommit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setHasCommitted(true);
    confettiRef.current?.start();
    
    setTimeout(() => {
      onCommit();
    }, 2000);
  };

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowAnim.value, [0, 1], [0.3, 0.6]),
  }));

  const commitmentCount = actions.filter(a => a.type === 'commitment').length;
  const oneTimeCount = actions.filter(a => a.type === 'one-time').length;
  const totalDays = Math.ceil(
    (goal.targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#000000', '#000000']}
        style={StyleSheet.absoluteFillObject}
        locations={[0, 0.5, 1]}
      />
      
      {/* Animated background particles */}
      <View style={StyleSheet.absoluteFillObject}>
        {[...Array(20)].map((_, i) => (
          <Animated.View
            key={i}
            entering={FadeIn.delay(i * 100).duration(1000)}
            style={[
              styles.particle,
              {
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }
            ]}
          />
        ))}
      </View>
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View entering={FadeIn.duration(800)} style={styles.header}>
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={[LuxuryTheme.colors.primary.gold, LuxuryTheme.colors.primary.champagne]}
              style={styles.iconGradient}
            >
              <Trophy color="#000" size={40} strokeWidth={2} />
            </LinearGradient>
          </View>
          
          <Text style={styles.title}>Your Success Blueprint</Text>
          <Text style={styles.subtitle}>
            Review your commitment to excellence
          </Text>
        </Animated.View>
        
        {/* Goal Card */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.card}>
          <LinearGradient
            colors={['rgba(231, 180, 58, 0.15)', 'rgba(231, 180, 58, 0.05)']}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.cardHeader}>
            <Target color={LuxuryTheme.colors.primary.gold} size={24} />
            <Text style={styles.cardTitle}>PRIMARY GOAL</Text>
          </View>
          <Text style={styles.goalText}>{goal.title}</Text>
          <View style={styles.goalMeta}>
            <Calendar color={LuxuryTheme.colors.text.tertiary} size={16} />
            <Text style={styles.goalMetaText}>
              {totalDays} days • By {goal.targetDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>
          <View style={styles.whyContainer}>
            <Text style={styles.whyLabel}>YOUR WHY</Text>
            <Text style={styles.whyText}>{goal.why}</Text>
          </View>
        </Animated.View>
        
        {/* Milestones Card */}
        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.card}>
          <View style={styles.cardHeader}>
            <Flag color={LuxuryTheme.colors.primary.silver} size={24} />
            <Text style={styles.cardTitle}>MILESTONES</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{milestones.length}</Text>
            </View>
          </View>
          
          <View style={styles.milestonesTimeline}>
            {milestones.slice(0, 3).map((milestone, index) => (
              <View key={milestone.id} style={styles.timelineItem}>
                <View style={styles.timelineDot} />
                {index < 2 && <View style={styles.timelineLine} />}
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>{milestone.title}</Text>
                  <Text style={styles.timelineDate}>
                    {milestone.targetDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
              </View>
            ))}
          </View>
          
          {milestones.length > 3 && (
            <Text style={styles.moreText}>+{milestones.length - 3} more milestones</Text>
          )}
        </Animated.View>
        
        {/* Actions Card */}
        <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.card}>
          <View style={styles.cardHeader}>
            <Zap color={LuxuryTheme.colors.primary.platinum} size={24} />
            <Text style={styles.cardTitle}>YOUR SYSTEM</Text>
          </View>
          
          <View style={styles.actionsGrid}>
            <View style={styles.actionStat}>
              <View style={styles.actionIconContainer}>
                <RefreshCw color={LuxuryTheme.colors.primary.gold} size={20} />
              </View>
              <Text style={styles.actionStatNumber}>{commitmentCount}</Text>
              <Text style={styles.actionStatLabel}>Daily Habits</Text>
            </View>
            
            <View style={styles.actionStat}>
              <View style={styles.actionIconContainer}>
                <Zap color={LuxuryTheme.colors.primary.gold} size={20} />
              </View>
              <Text style={styles.actionStatNumber}>{oneTimeCount}</Text>
              <Text style={styles.actionStatLabel}>One-Time Actions</Text>
            </View>
          </View>
          
          <View style={styles.actionsList}>
            {actions.slice(0, 4).map((action) => (
              <View key={action.id} style={styles.actionItem}>
                <View style={styles.actionDot} />
                <Text style={styles.actionText}>{action.title}</Text>
                {action.frequency && (
                  <Text style={styles.actionFreq}>
                    {action.frequency === 'daily' ? 'Daily' : 
                     action.daysPerWeek ? `${action.daysPerWeek}x/wk` : ''}
                  </Text>
                )}
              </View>
            ))}
          </View>
          
          {actions.length > 4 && (
            <Text style={styles.moreText}>+{actions.length - 4} more actions</Text>
          )}
        </Animated.View>
        
        {/* Commitment Statement */}
        <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.commitmentCard}>
          <LinearGradient
            colors={['rgba(231, 180, 58, 0.05)', 'rgba(231, 180, 58, 0.02)', 'rgba(231, 180, 58, 0.05)']}
            style={StyleSheet.absoluteFillObject}
          />
          
          <Sparkles color={LuxuryTheme.colors.primary.gold} size={20} />
          <Text style={styles.commitmentText}>
            I commit to this journey of transformation.{'\n'}
            I will show up, do the work, and become{'\n'}
            the person I'm meant to be.
          </Text>
        </Animated.View>
      </ScrollView>
      
      {/* Footer Actions */}
      <View style={styles.footer}>
        <HapticButton
          hapticType="light"
          onPress={onBack}
          style={styles.backButton}
          disabled={hasCommitted}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </HapticButton>
        
        <Animated.View style={[styles.commitButtonContainer, pulseStyle]}>
          <Animated.View style={[styles.commitGlow, glowStyle]} />
          <HapticButton
            hapticType="heavy"
            onPress={handleCommit}
            style={styles.commitButton}
            disabled={hasCommitted}
          >
            <LinearGradient
              colors={
                hasCommitted 
                  ? ['#22C55E', '#10B981']
                  : [LuxuryTheme.colors.primary.gold, LuxuryTheme.colors.primary.champagne]
              }
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
            {hasCommitted ? (
              <>
                <CheckCircle color="#000" size={24} strokeWidth={3} />
                <Text style={styles.commitButtonText}>Committed!</Text>
              </>
            ) : (
              <Text style={styles.commitButtonText}>Make Commitment</Text>
            )}
          </HapticButton>
        </Animated.View>
      </View>
      
      <ConfettiCannon
        ref={confettiRef}
        count={100}
        origin={{ x: width / 2, y: height / 2 }}
        fadeOut
        autoStart={false}
        explosionSpeed={500}
        fallSpeed={2000}
        colors={[
          LuxuryTheme.colors.primary.gold,
          LuxuryTheme.colors.primary.champagne,
          LuxuryTheme.colors.primary.silver,
          '#FFFFFF',
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LuxuryTheme.colors.background.primary,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  particle: {
    position: 'absolute',
    width: 2,
    height: 2,
    backgroundColor: LuxuryTheme.colors.primary.gold,
    opacity: 0.3,
    borderRadius: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: LuxuryTheme.colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: LuxuryTheme.colors.text.tertiary,
  },
  card: {
    backgroundColor: LuxuryTheme.colors.background.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: LuxuryTheme.colors.interactive.border,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: LuxuryTheme.colors.text.tertiary,
    letterSpacing: 1.5,
    flex: 1,
  },
  badge: {
    backgroundColor: 'rgba(231, 180, 58, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: LuxuryTheme.colors.primary.gold,
  },
  goalText: {
    fontSize: 20,
    fontWeight: '600',
    color: LuxuryTheme.colors.text.primary,
    marginBottom: 12,
    lineHeight: 28,
  },
  goalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  goalMetaText: {
    fontSize: 14,
    color: LuxuryTheme.colors.text.tertiary,
  },
  whyContainer: {
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
  },
  whyLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: LuxuryTheme.colors.primary.gold,
    letterSpacing: 1,
    marginBottom: 8,
  },
  whyText: {
    fontSize: 14,
    color: LuxuryTheme.colors.text.secondary,
    lineHeight: 20,
  },
  milestonesTimeline: {
    marginLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: LuxuryTheme.colors.primary.gold,
    marginTop: 4,
  },
  timelineLine: {
    position: 'absolute',
    left: 5.5,
    top: 20,
    width: 1,
    height: 32,
    backgroundColor: 'rgba(231, 180, 58, 0.3)',
  },
  timelineContent: {
    flex: 1,
    marginLeft: 16,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: LuxuryTheme.colors.text.primary,
    marginBottom: 2,
  },
  timelineDate: {
    fontSize: 12,
    color: LuxuryTheme.colors.text.tertiary,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  actionStat: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(231, 180, 58, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: LuxuryTheme.colors.text.primary,
  },
  actionStatLabel: {
    fontSize: 12,
    color: LuxuryTheme.colors.text.tertiary,
    marginTop: 4,
  },
  actionsList: {
    gap: 10,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: LuxuryTheme.colors.primary.silver,
  },
  actionText: {
    fontSize: 14,
    color: LuxuryTheme.colors.text.secondary,
    flex: 1,
  },
  actionFreq: {
    fontSize: 12,
    color: LuxuryTheme.colors.text.tertiary,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  moreText: {
    fontSize: 13,
    color: LuxuryTheme.colors.text.tertiary,
    fontStyle: 'italic',
    marginTop: 8,
  },
  commitmentCard: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: LuxuryTheme.colors.background.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(231, 180, 58, 0.2)',
    overflow: 'hidden',
    marginTop: 8,
  },
  commitmentText: {
    fontSize: 16,
    color: LuxuryTheme.colors.text.primary,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 12,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 20,
    gap: 12,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  backButton: {
    flex: 0.3,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: LuxuryTheme.colors.interactive.border,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: LuxuryTheme.colors.text.secondary,
  },
  commitButtonContainer: {
    flex: 0.7,
    position: 'relative',
  },
  commitGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 38,
    backgroundColor: LuxuryTheme.colors.primary.gold,
  },
  commitButton: {
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    gap: 8,
  },
  commitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
});