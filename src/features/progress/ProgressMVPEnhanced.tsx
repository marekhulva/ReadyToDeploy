import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  interpolate,
  FadeInDown,
  FadeIn,
  Easing,
} from 'react-native-reanimated';
import { 
  Target, Trophy, Flame, Calendar, CheckCircle, 
  Circle, ChevronDown, ChevronUp, AlertCircle, Clock,
  Gamepad2, TrendingUp, X, Check, Minus, Edit3, MoreVertical
} from 'lucide-react-native';
import { useStore } from '../../state/rootStore';
import { LuxuryTheme } from '../../design/luxuryTheme';
import Svg, { Circle as SvgCircle, Defs, LinearGradient as SvgGradient, Stop, G, Line, Text as SvgText } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { GoalEditModal } from './GoalEditModal';
import { Goal } from '../../state/slices/goalsSlice';
import { EmptyState } from '../../ui/EmptyState';

const { width } = Dimensions.get('window');

const AnimatedSvgCircle = Animated.createAnimatedComponent(SvgCircle);

export const ProgressMVPEnhanced = () => {
  const goals = useStore(s => s.goals);
  const goalsLoading = useStore(s => s.goalsLoading);
  const goalsError = useStore(s => s.goalsError);
  const fetchGoals = useStore(s => s.fetchGoals);
  const openOnboarding = useStore(s => s.openOnboarding);
  const actions = useStore(s => s.actions);
  const completedActions = useStore(s => s.completedActions);
  const toggleMilestoneComplete = useStore(s => s.toggleMilestoneComplete);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  
  // Calculate overall metrics
  const totalActionsThisWeek = actions.length * 7;
  const completedThisWeek = actions.filter(a => a.done).length;
  const overallConsistency = totalActionsThisWeek > 0 
    ? Math.round((completedThisWeek / totalActionsThisWeek) * 100) 
    : 0;
  
  // Calculate total score
  const streakBonus = actions.reduce((sum, a) => sum + (a.streak || 0), 0) * 5;
  const milestoneBonus = goals.length * 100;
  const actionPoints = completedThisWeek * 10;
  const totalScore = actionPoints + streakBonus + milestoneBonus;
  
  // Animation values for enhanced dual ring
  const outerRingAnim = useSharedValue(0);
  const innerRingAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.9);
  const glowAnim = useSharedValue(0);
  
  useEffect(() => {
    // Animate rings with improved timing
    outerRingAnim.value = withTiming(overallConsistency / 100, { 
      duration: 650,
      easing: Easing.out(Easing.cubic)
    });
    
    innerRingAnim.value = withDelay(100, withTiming(Math.min(totalScore / 1000, 1), { 
      duration: 650,
      easing: Easing.out(Easing.cubic)
    }));
    
    scaleAnim.value = withSpring(1, { 
      damping: 22,
      stiffness: 180
    });
    
    // Glow pulse animation
    glowAnim.value = withSequence(
      withTiming(1, { duration: 400 }),
      withTiming(0.3, { duration: 600 })
    );
    
    // Haptic feedback when ring settles
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 650);
  }, [overallConsistency, totalScore]);
  
  const dualRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));
  
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowAnim.value,
  }));
  
  const toggleGoalExpansion = (goalId: string) => {
    Haptics.selectionAsync();
    setExpandedGoal(expandedGoal === goalId ? null : goalId);
  };

  const handleEditGoal = (goal: Goal) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEditingGoal(goal);
  };

  const handleRetryGoals = async () => {
    try {
      await fetchGoals();
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh goals. Please try again.');
    }
  };
  
  // Helper functions for goal data
  const getGoalConsistency = (goalId: string) => {
    return 75 + Math.floor(Math.random() * 20);
  };
  
  const getGoalStreak = (goalId: string) => {
    return Math.floor(Math.random() * 15) + 1;
  };
  
  const getMilestoneProgress = (goal: any) => {
    // Use actual milestones from the goal if available
    if (goal.milestones && goal.milestones.length > 0) {
      const milestones = goal.milestones.map((m: any, index: number) => {
        const targetDate = new Date(m.targetDate);
        const daysUntil = Math.ceil((targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        const isNext = !m.completed && goal.milestones.slice(0, index).every((prev: any) => prev.completed);
        
        return {
          id: m.id,
          name: m.title,
          description: m.targetValue ? `${m.targetValue} ${m.unit || ''}` : `By ${targetDate.toLocaleDateString()}`,
          requirement: daysUntil > 0 ? `${daysUntil} days remaining` : 'Due',
          achieved: m.completed,
          isNext,
          order: m.order
        };
      });
      
      const current = milestones.filter((m: any) => m.achieved).length;
      const next = milestones.find((m: any) => m.isNext);
      
      return {
        current,
        total: milestones.length,
        milestones,
        next: next ? next.name : "All milestones achieved!",
        nextRequirement: next ? next.requirement : "",
        progress: (current / milestones.length) * 100,
      };
    }
    
    // Fallback to default milestones if none exist
    const defaultMilestones = [
      { 
        id: 'default-1', 
        name: "First Week", 
        description: "Complete 7 days",
        requirement: "7-day streak",
        achieved: false,
        isNext: true
      },
      { 
        id: 'default-2', 
        name: "Two Weeks Strong", 
        description: "14 consecutive days",
        requirement: "14-day streak",
        achieved: false 
      },
      { 
        id: 'default-3', 
        name: "Habit Formed", 
        description: "21 days completed",
        requirement: "21-day streak",
        achieved: false
      },
    ];
    
    return {
      current: 0,
      total: defaultMilestones.length,
      milestones: defaultMilestones,
      next: defaultMilestones[0].name,
      nextRequirement: defaultMilestones[0].requirement,
      progress: 0,
    };
  };
  
  const getWeekSchedule = () => {
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const today = new Date().getDay();
    const adjustedToday = today === 0 ? 6 : today - 1; // Adjust for Monday start
    
    return days.map((day, i) => ({
      day,
      isToday: i === adjustedToday,
      hasAction: i === 0 || i === 2 || i === 4 || i === 6,
      isCompleted: i < adjustedToday && (i === 0 || i === 2),
      isMissed: i === 3 && i < adjustedToday,
      isOptional: i === 5,
    }));
  };
  
  const getSparklineData = () => {
    // Mock 7-day consistency data
    return [65, 70, 68, 75, 80, 85, overallConsistency];
  };
  
  // Show error state if there's an error
  if (goalsError && !goalsLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Unable to Load Goals</Text>
          <Text style={styles.errorMessage}>{goalsError}</Text>
          <Pressable style={styles.retryButton} onPress={handleRetryGoals}>
            <LinearGradient
              colors={[LuxuryTheme.colors.primary.gold, LuxuryTheme.colors.primary.champagne]}
              style={StyleSheet.absoluteFillObject}
            />
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Pure black background with subtle vignette */}
      <LinearGradient
        colors={['#000000', '#000000', '#0A0A0A']}
        style={StyleSheet.absoluteFillObject}
        locations={[0, 0.5, 1]}
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Enhanced Header Widget with Dual Ring */}
        <Animated.View 
          style={[styles.headerWidget, dualRingStyle]}
          entering={FadeInDown.duration(600).springify()}
        >
          <BlurView intensity={12} tint="dark" style={styles.glassCard}>
            {/* Subtle metallic gradient background */}
            <LinearGradient
              colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)']}
              style={StyleSheet.absoluteFillObject}
            />
            
            {/* Enhanced Dual Ring Visual */}
            <View style={styles.dualRingContainer}>
              <Svg width={240} height={240} style={styles.svgContainer}>
                <Defs>
                  {/* Conic gradient for outer ring */}
                  <SvgGradient id="outerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#FFD700" stopOpacity="0.9" />
                    <Stop offset="50%" stopColor="#C0C0C0" stopOpacity="0.7" />
                    <Stop offset="100%" stopColor="#FFD700" stopOpacity="0.9" />
                  </SvgGradient>
                </Defs>
                
                {/* Tick marker at 100% */}
                <Line
                  x1="120"
                  y1="30"
                  x2="120"
                  y2="40"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="2"
                />
                
                {/* Outer Ring - Consistency with gradient */}
                <AnimatedSvgCircle
                  cx="120"
                  cy="120"
                  r="85"
                  stroke="url(#outerGradient)"
                  strokeWidth="14"
                  fill="none"
                  strokeDasharray="534"
                  strokeDashoffset={outerRingAnim}
                  strokeLinecap="round"
                  transform="rotate(-90 120 120)"
                  animatedProps={useAnimatedStyle(() => ({
                    strokeDashoffset: 534 - (534 * outerRingAnim.value),
                  }))}
                />
                
                {/* Inner Ring - Score (thin, subtle) */}
                <AnimatedSvgCircle
                  cx="120"
                  cy="120"
                  r="70"
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="440"
                  strokeDashoffset={innerRingAnim}
                  strokeLinecap="round"
                  transform="rotate(-90 120 120)"
                  animatedProps={useAnimatedStyle(() => ({
                    strokeDashoffset: 440 - (440 * innerRingAnim.value),
                  }))}
                />
                
                {/* Faint gold glow in center */}
                <Animated.View style={[styles.centerGlow, glowStyle]}>
                  <SvgCircle
                    cx="120"
                    cy="120"
                    r="60"
                    fill="rgba(255,215,0,0.05)"
                  />
                </Animated.View>
              </Svg>
              
              {/* Enhanced Center Metrics Display */}
              <View style={styles.centerMetrics}>
                <Text style={styles.consistencyValue}>{overallConsistency}%</Text>
                <Text style={styles.consistencyLabel}>CONSISTENCY</Text>
                
                <View style={styles.scoreContainer}>
                  <Gamepad2 size={14} color="rgba(255,255,255,0.7)" style={{ marginRight: 6 }} />
                  <Text style={styles.scoreValue}>{totalScore.toLocaleString()}</Text>
                </View>
                <Text style={styles.scoreLabel}>TOTAL SCORE</Text>
              </View>
            </View>
            
            {/* Legend Pills */}
            <View style={styles.legendRow}>
              <View style={styles.legendPill}>
                <Text style={styles.legendEmoji}>🎯</Text>
                <Text style={styles.legendText}>Pride Metric</Text>
              </View>
              <View style={styles.legendPill}>
                <Text style={styles.legendEmoji}>🎮</Text>
                <Text style={styles.legendText}>Gamified Score</Text>
              </View>
            </View>
          </BlurView>
        </Animated.View>
        
        {/* Active Goals Section */}
        <View style={styles.goalsSection}>
          <Text style={styles.sectionTitle}>ACTIVE GOALS</Text>
          
          {goals.length === 0 ? (
            <EmptyState
              icon={Trophy}
              title="Set Your First Goal"
              subtitle="Create meaningful goals to track your progress and celebrate achievements"
              actionText="Start Goal Setup"
              onAction={openOnboarding}
              illustration="glow"
              theme="gold"
            />
          ) : (
            goals.map((goal, index) => {
              const isExpanded = expandedGoal === goal.id;
              const goalConsistency = getGoalConsistency(goal.id);
              const goalStreak = getGoalStreak(goal.id);
              const milestones = getMilestoneProgress(goal);
              const weekSchedule = getWeekSchedule();
              const sparklineData = getSparklineData();
              const goalColor = goal.color || '#FFD700';
              
              return (
                <Animated.View
                  key={goal.id}
                  entering={FadeInDown.delay(120 + index * 60).springify()}
                  style={styles.goalCard}
                >
                  <BlurView intensity={12} tint="dark" style={styles.glassCard}>
                    <LinearGradient
                      colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.03)']}
                      style={StyleSheet.absoluteFillObject}
                    />
                    
                    {/* Enhanced Goal Header */}
                    <Pressable 
                      onPress={() => toggleGoalExpansion(goal.id)}
                      style={styles.goalHeader}
                    >
                      <View style={styles.goalTitleRow}>
                        {/* Goal icon with glow ring */}
                        <View style={[styles.goalAvatar, { shadowColor: goalColor }]}>
                          <Target size={20} color={goalColor} />
                        </View>
                        <Text style={styles.goalName}>{goal.title}</Text>
                      </View>
                      
                      <View style={styles.headerRight}>
                        {/* Progress badge */}
                        <View style={styles.progressBadge}>
                          <Trophy size={12} color="#FFD700" />
                          <Text style={styles.progressBadgeText}>
                            {milestones.current}/{milestones.total}
                          </Text>
                        </View>
                        
                        {/* Edit button */}
                        <Pressable 
                          style={styles.editButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleEditGoal(goal);
                          }}
                        >
                          <Edit3 size={16} color="rgba(255,255,255,0.6)" />
                        </Pressable>
                        
                        {isExpanded ? (
                          <ChevronUp size={20} color="rgba(255,255,255,0.5)" />
                        ) : (
                          <ChevronDown size={20} color="rgba(255,255,255,0.5)" />
                        )}
                      </View>
                    </Pressable>
                    
                    {/* Enhanced Milestone Rail with Clear Labels */}
                    <View style={styles.milestoneRail}>
                      {/* Milestone Header */}
                      <View style={styles.milestoneHeader}>
                        <Text style={styles.milestoneTitle}>MILESTONES</Text>
                        <View style={styles.milestoneProgress}>
                          <Text style={styles.milestoneProgressText}>
                            {milestones.current} of {milestones.total}
                          </Text>
                        </View>
                      </View>
                      
                      {/* Visual Milestone Timeline */}
                      <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        style={styles.milestoneScroll}
                      >
                        <View style={styles.milestoneTimeline}>
                          {milestones.milestones.map((milestone, i) => {
                            const isAchieved = milestone.achieved;
                            const isNext = milestone.isNext;
                            
                            return (
                              <Pressable 
                                key={milestone.id} 
                                style={styles.milestoneItem}
                                onPress={() => {
                                  if (milestone.isNext && !milestone.achieved) {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    toggleMilestoneComplete(goal.id, milestone.id);
                                  }
                                }}
                              >
                                {/* Milestone Node */}
                                <View style={styles.milestoneNodeContainer}>
                                  {i > 0 && (
                                    <View style={[
                                      styles.milestoneConnector,
                                      isAchieved && { backgroundColor: goalColor }
                                    ]} />
                                  )}
                                  
                                  {isAchieved ? (
                                    <View style={[styles.achievedNode, { backgroundColor: goalColor }]}>
                                      <Trophy size={12} color="#000" />
                                    </View>
                                  ) : isNext ? (
                                    <Animated.View 
                                      style={[
                                        styles.nextNode, 
                                        { borderColor: goalColor }
                                      ]}
                                    >
                                      <View style={[styles.pulseDot, { backgroundColor: goalColor }]} />
                                    </Animated.View>
                                  ) : (
                                    <View style={styles.futureNode}>
                                      <Text style={styles.futureNodeNumber}>{i + 1}</Text>
                                    </View>
                                  )}
                                  
                                  {i < milestones.milestones.length - 1 && (
                                    <View style={[
                                      styles.milestoneConnectorRight,
                                      milestone.achieved && { backgroundColor: goalColor }
                                    ]} />
                                  )}
                                </View>
                                
                                {/* Milestone Details */}
                                <View style={[
                                  styles.milestoneDetails,
                                  isNext && styles.milestoneDetailsNext
                                ]}>
                                  <Text style={[
                                    styles.milestoneName,
                                    isAchieved && styles.milestoneNameAchieved,
                                    isNext && styles.milestoneNameNext
                                  ]}>
                                    {milestone.name}
                                  </Text>
                                  <Text style={styles.milestoneRequirement}>
                                    {milestone.requirement}
                                  </Text>
                                  {isAchieved && (
                                    <View style={styles.achievedBadge}>
                                      <Check size={10} color="#06FFA5" />
                                      <Text style={styles.achievedText}>Achieved</Text>
                                    </View>
                                  )}
                                  {isNext && (
                                    <View style={styles.nextBadge}>
                                      <Text style={styles.nextBadgeText}>IN PROGRESS</Text>
                                    </View>
                                  )}
                                </View>
                              </Pressable>
                            );
                          })}
                        </View>
                      </ScrollView>
                      
                      {/* Current Focus Card */}
                      {milestones.nextRequirement && (
                        <View style={styles.currentFocusCard}>
                          <View style={styles.currentFocusHeader}>
                            <Target size={14} color="#FFD700" />
                            <Text style={styles.currentFocusLabel}>Current Focus</Text>
                          </View>
                          <Text style={styles.currentFocusTitle}>{milestones.next}</Text>
                          <Text style={styles.currentFocusRequirement}>
                            Requirement: {milestones.nextRequirement}
                          </Text>
                        </View>
                      )}
                    </View>
                    
                    {/* Enhanced Stats Row with Glass Tiles */}
                    <View style={styles.statsRow}>
                      {/* Consistency Tile with Sparkline */}
                      <View style={styles.statTile}>
                        <Text style={styles.statValue}>{goalConsistency}%</Text>
                        <Text style={styles.statLabel}>Consistency</Text>
                        {/* Mini sparkline */}
                        <View style={styles.sparkline}>
                          {sparklineData.map((value, i) => (
                            <View 
                              key={i} 
                              style={[
                                styles.sparklineBar,
                                { height: (value / 100) * 20, backgroundColor: goalColor }
                              ]} 
                            />
                          ))}
                        </View>
                      </View>
                      
                      {/* Streak Tile with Grace Period */}
                      <View style={styles.statTile}>
                        <View style={styles.streakHeader}>
                          <Flame size={16} color="#FFD700" />
                          <Text style={styles.statValue}>{goalStreak}</Text>
                        </View>
                        <Text style={styles.statLabel}>Streak</Text>
                        <Text style={styles.graceText}>Grace 13/14</Text>
                      </View>
                    </View>
                    
                    {/* Enhanced Week Schedule with Pills */}
                    <View style={styles.weekSchedule}>
                      <Text style={styles.weekLabel}>THIS WEEK</Text>
                      <View style={styles.weekPills}>
                        {weekSchedule.map((day, i) => (
                          <Pressable 
                            key={i} 
                            style={[
                              styles.dayPill,
                              day.hasAction && day.isCompleted && styles.dayCompleted,
                              day.hasAction && !day.isCompleted && !day.isMissed && styles.dayScheduled,
                              day.isMissed && styles.dayMissed,
                              day.isOptional && styles.dayOptional,
                              day.isToday && styles.dayToday,
                            ]}
                            onLongPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              // Show action sheet
                            }}
                          >
                            <Text style={[
                              styles.dayText,
                              (day.isCompleted || day.isToday) && styles.dayTextActive
                            ]}>
                              {day.day}
                            </Text>
                            {day.hasAction && day.isCompleted && (
                              <Check size={10} color={goalColor} />
                            )}
                            {day.isMissed && (
                              <X size={10} color="#FF6B6B" />
                            )}
                            {day.isOptional && !day.isCompleted && (
                              <Minus size={8} color="rgba(255,255,255,0.3)" />
                            )}
                          </Pressable>
                        ))}
                      </View>
                    </View>
                    
                    {/* Expanded Content */}
                    {isExpanded && (
                      <Animated.View 
                        entering={FadeIn.duration(220)}
                        style={styles.expandedContent}
                      >
                        {/* Additional expanded content here */}
                      </Animated.View>
                    )}
                  </BlurView>
                </Animated.View>
              );
            })
          )}
        </View>
      </ScrollView>
      
      {/* Goal Edit Modal */}
      <GoalEditModal
        visible={editingGoal !== null}
        goal={editingGoal}
        onClose={() => setEditingGoal(null)}
      />
      
      {/* Loading Overlay */}
      {goalsLoading && (
        <View style={styles.loadingOverlay}>
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFillObject} />
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color={LuxuryTheme.colors.primary.gold} />
            <Text style={styles.loadingText}>Loading your goals...</Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  
  // Enhanced Header Widget
  headerWidget: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
  },
  glassCard: {
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    overflow: 'hidden',
    // Enhanced shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  dualRingContainer: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  svgContainer: {
    position: 'absolute',
  },
  centerGlow: {
    position: 'absolute',
    width: 240,
    height: 240,
  },
  centerMetrics: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  consistencyValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(255,215,0,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  consistencyLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.72)',
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  scoreLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.56)',
    fontWeight: '500',
    letterSpacing: 0.6,
    marginTop: 2,
  },
  
  // Legend Pills
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
  },
  legendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  legendEmoji: {
    fontSize: 12,
  },
  legendText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  
  // Goals Section
  goalsSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.72)',
    letterSpacing: 1,
    marginBottom: 12,
  },
  
  // Goal Cards
  goalCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    // Card shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  goalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  goalAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  goalName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,215,0,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressBadgeText: {
    fontSize: 11,
    color: '#FFD700',
    fontWeight: '600',
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  // Enhanced Milestone Rail
  milestoneRail: {
    marginBottom: 16,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  milestoneTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.72)',
    letterSpacing: 0.8,
  },
  milestoneProgress: {
    backgroundColor: 'rgba(255,215,0,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  milestoneProgressText: {
    fontSize: 11,
    color: '#FFD700',
    fontWeight: '600',
  },
  milestoneScroll: {
    marginBottom: 12,
  },
  milestoneTimeline: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  milestoneItem: {
    width: 120,
    marginRight: 16,
  },
  milestoneNodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    height: 32,
  },
  achievedNode: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD700',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  nextNode: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,215,0,0.05)',
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  futureNode: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  futureNodeNumber: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '600',
  },
  milestoneConnector: {
    position: 'absolute',
    left: -16,
    width: 16,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  milestoneConnectorRight: {
    position: 'absolute',
    right: -16,
    width: 16,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  milestoneDetails: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  milestoneDetailsNext: {
    backgroundColor: 'rgba(255,215,0,0.05)',
    borderColor: 'rgba(255,215,0,0.2)',
  },
  milestoneName: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 4,
  },
  milestoneNameAchieved: {
    color: 'rgba(255,255,255,0.9)',
  },
  milestoneNameNext: {
    color: '#FFD700',
  },
  milestoneRequirement: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 6,
  },
  achievedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  achievedText: {
    fontSize: 10,
    color: '#06FFA5',
    fontWeight: '600',
  },
  nextBadge: {
    backgroundColor: 'rgba(255,215,0,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  nextBadgeText: {
    fontSize: 9,
    color: '#FFD700',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  currentFocusCard: {
    backgroundColor: 'rgba(255,215,0,0.08)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
    marginTop: 8,
  },
  currentFocusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  currentFocusLabel: {
    fontSize: 10,
    color: '#FFD700',
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  currentFocusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  currentFocusRequirement: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  
  // Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statTile: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.56)',
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  graceText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    fontStyle: 'italic',
    marginTop: 4,
  },
  sparkline: {
    flexDirection: 'row',
    gap: 2,
    height: 20,
    alignItems: 'flex-end',
    marginTop: 8,
  },
  sparklineBar: {
    width: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
  },
  
  // Week Schedule
  weekSchedule: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 12,
  },
  weekLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.56)',
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  weekPills: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  dayPill: {
    flex: 1,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  dayCompleted: {
    backgroundColor: 'rgba(255,215,0,0.15)',
    borderColor: 'rgba(255,215,0,0.3)',
  },
  dayScheduled: {
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  dayMissed: {
    backgroundColor: 'rgba(255,107,107,0.1)',
    borderColor: 'rgba(255,107,107,0.3)',
  },
  dayOptional: {
    borderStyle: 'dotted',
  },
  dayToday: {
    borderBottomWidth: 2,
    borderBottomColor: '#FFD700',
  },
  dayText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
  },
  dayTextActive: {
    color: 'rgba(255,255,255,0.9)',
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  hollowRing: {
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    marginBottom: 16,
  },
  startButton: {
    backgroundColor: 'rgba(255,215,0,0.1)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  startButtonText: {
    color: '#FFD700',
    fontWeight: '600',
    fontSize: 14,
  },
  
  // Expanded Content
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
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