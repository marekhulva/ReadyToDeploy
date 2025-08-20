import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  interpolate,
  Easing,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { 
  Trophy, Flame, Target, TrendingUp, Star, 
  Award, Calendar, Users, Heart, MessageCircle,
  Lock, Camera, Mic, CheckCircle, Grid3x3,
  Bookmark, CheckCircle2
} from 'lucide-react-native';
import { LuxuryGradientBackground } from '../../ui/LuxuryGradientBackground';
import { GoldParticles } from '../../ui/GoldParticles';
import { useStore } from '../../state/rootStore';
import { PostCardEnhanced } from '../social/components/PostCardEnhanced';
import { ResetOnboardingButton } from '../onboarding/ResetButton';
import { LuxuryTheme } from '../../design/luxuryTheme';

const { width } = Dimensions.get('window');

// Define the action grid item type
interface GridAction {
  id: string;
  type: 'check' | 'photo' | 'audio' | 'milestone';
  title: string;
  completedAt: Date;
  mediaUrl?: string;
  isPrivate: boolean;
  category: string;
  streak?: number;
}

export const ProfileEnhanced = () => {
  const user = useStore(s => s.user);
  const goals = useStore(s => s.goals);
  const circleFeed = useStore(s => s.circleFeed);
  const completedActions = useStore(s => s.completedActions);
  const logout = useStore(s => s.logout);
  const [selectedAction, setSelectedAction] = useState<GridAction | null>(null);
  
  // Get user's own posts
  const userPosts = circleFeed.filter(post => post.user === (user?.name || 'User'));
  const pinnedPosts = userPosts.slice(0, 2); // First 2 as pinned
  const recentPosts = userPosts.slice(2, 5); // Next 3 as recent
  
  // Convert completed actions to grid format
  const gridActions: GridAction[] = completedActions.map((action) => ({
    id: action.id,
    type: action.type,
    title: action.title,
    completedAt: action.completedAt,
    mediaUrl: action.mediaUrl,
    isPrivate: action.isPrivate,
    category: action.category || 'fitness',
    streak: action.streak,
  }));
  
  // Add mock data if we don't have enough completed actions yet
  const mockData = Array(Math.max(0, 12 - gridActions.length)).fill(null).map((_, i) => ({
    id: `mock-${i}`,
    type: i % 3 === 0 ? 'photo' : i % 2 === 0 ? 'audio' : 'check' as const,
    title: ['Morning Workout', 'Meditation', 'Reading', 'Journaling'][i % 4],
    completedAt: new Date(Date.now() - i * 86400000),
    mediaUrl: i % 3 === 0 ? `https://picsum.photos/400/400?random=${i + 100}` : undefined,
    isPrivate: i % 4 === 0,
    category: ['fitness', 'mindfulness', 'learning', 'health'][i % 4],
    streak: Math.floor(Math.random() * 30),
  }));
  
  // Combine real and mock data, showing most recent first
  const allGridActions = [...gridActions, ...mockData]
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .slice(0, 12);
  
  const glowAnim = useSharedValue(0);
  const pulseAnim = useSharedValue(0);
  
  // Helper function to get category gradient colors - luxury aesthetic
  const getCategoryGradient = (category: string): string[] => {
    switch (category) {
      case 'fitness':
        return ['rgba(255, 215, 0, 0.15)', 'rgba(255, 215, 0, 0.05)']; // Gold fade
      case 'mindfulness':
        return ['rgba(192, 192, 192, 0.15)', 'rgba(192, 192, 192, 0.05)']; // Silver fade
      case 'health':
        return ['rgba(231, 180, 58, 0.15)', 'rgba(231, 180, 58, 0.05)']; // Champagne fade
      case 'learning':
        return ['rgba(229, 228, 226, 0.15)', 'rgba(229, 228, 226, 0.05)']; // Platinum fade
      default:
        return ['rgba(18, 23, 28, 0.9)', 'rgba(18, 23, 28, 0.7)']; // Deep black
    }
  };

  React.useEffect(() => {
    glowAnim.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    pulseAnim.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const profileGlowStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(glowAnim.value, [0, 1], [0.3, 0.6]),
    shadowRadius: interpolate(glowAnim.value, [0, 1], [20, 35]),
  }));

  const badgeAnimation = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulseAnim.value, [0, 1], [1, 1.1]) }],
  }));

  // Sample data for demonstration
  const achievements = [
    { icon: Flame, label: '30 Day Streak', color: LuxuryTheme.colors.primary.gold },
    { icon: Trophy, label: '10 Goals Completed', color: LuxuryTheme.colors.primary.silver },
    { icon: Star, label: 'Top Performer', color: LuxuryTheme.colors.primary.champagne },
  ];

  const activeGoals = goals.slice(0, 3).map(goal => ({
    ...goal,
    progress: Math.floor(Math.random() * 100),
  }));

  // Calculate real consistency based on today's completed actions
  const actions = useStore(s => s.actions);
  const todayCompleted = actions.filter(a => a.done).length;
  const todayTotal = actions.length;
  const calculatedConsistency = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;
  
  const stats = {
    inspirationGiven: 234,
    accountabilityScore: 92,
    consistencyRate: calculatedConsistency,
    totalDays: 127,
  };

  return (
    <View style={styles.container}>
      <LuxuryGradientBackground variant="mixed">
        <GoldParticles variant="mixed" particleCount={15} />
        
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* HERO SECTION - Personal Brand */}
          <Animated.View style={[styles.heroCard, profileGlowStyle, { shadowColor: LuxuryTheme.colors.primary.gold }]}>
            <BlurView intensity={40} tint="dark" style={styles.heroCardInner}>
              <LinearGradient
                colors={['rgba(255,215,0,0.1)', 'rgba(192,192,192,0.05)']}
                style={StyleSheet.absoluteFillObject}
              />
              
              {/* Avatar with luxury ring */}
              <View style={styles.avatarSection}>
                <LinearGradient
                  colors={[LuxuryTheme.colors.primary.gold, LuxuryTheme.colors.primary.silver, LuxuryTheme.colors.primary.champagne]}
                  style={styles.avatarRing}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {user?.name?.charAt(0) || 'U'}
                  </Text>
                </View>
                {/* Streak flame badge */}
                <View style={styles.streakBadge}>
                  <Flame size={16} color="#FFD700" />
                  <Text style={styles.streakNumber}>30</Text>
                </View>
              </View>

              <Text style={styles.profileName}>{user?.name || 'Achiever'}</Text>
              <Text style={styles.profileBio}>Building my best self, one day at a time ✨</Text>

              {/* Achievement Badges */}
              <View style={styles.achievementRow}>
                {achievements.map((achievement, index) => {
                  const Icon = achievement.icon;
                  return (
                    <Animated.View 
                      key={index} 
                      style={[styles.achievementBadge, index === 0 && badgeAnimation]}
                    >
                      <LinearGradient
                        colors={[`${achievement.color}20`, `${achievement.color}10`]}
                        style={StyleSheet.absoluteFillObject}
                      />
                      <Icon size={20} color={achievement.color} />
                      <Text style={styles.achievementLabel}>{achievement.label}</Text>
                    </Animated.View>
                  );
                })}
              </View>

              {/* Signature Stats */}
              <View style={styles.signatureStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.totalDays}</Text>
                  <Text style={styles.statLabel}>Days</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.consistencyRate}%</Text>
                  <Text style={styles.statLabel}>Consistency</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.accountabilityScore}</Text>
                  <Text style={styles.statLabel}>Score</Text>
                </View>
              </View>
            </BlurView>
          </Animated.View>

          {/* MY STORY - Pinned Posts Timeline */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Bookmark size={20} color="#FFD700" />
              <Text style={styles.sectionTitle}>My Story</Text>
            </View>

            {/* Pinned Posts */}
            <View style={styles.pinnedPostsContainer}>
              {pinnedPosts.length > 0 ? (
                pinnedPosts.map((post, index) => (
                  <Animated.View
                    key={post.id}
                    entering={FadeInDown.delay(index * 100).springify()}
                    style={styles.pinnedPost}
                  >
                    <BlurView intensity={20} tint="dark" style={styles.pinnedPostCard}>
                      <LinearGradient
                        colors={['rgba(255,215,0,0.08)', 'rgba(18,23,28,0.95)']}
                        style={StyleSheet.absoluteFillObject}
                      />
                      
                      {/* Post Header */}
                      <View style={styles.postHeader}>
                        <View style={styles.postTypeIcon}>
                          {post.type === 'checkin' ? <CheckCircle2 size={16} color="#FFD700" /> :
                           post.type === 'photo' ? <Camera size={16} color="#FFD700" /> :
                           post.type === 'audio' ? <Mic size={16} color="#FFD700" /> :
                           <Target size={16} color="#FFD700" />}
                        </View>
                        <Text style={styles.postDate}>
                          {new Date(post.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </Text>
                      </View>

                      {/* Post Content */}
                      <Text style={styles.postContent} numberOfLines={3}>
                        {post.content}
                      </Text>

                      {/* Post Stats */}
                      {post.reactions && Object.keys(post.reactions).length > 0 && (
                        <View style={styles.postStats}>
                          {Object.entries(post.reactions).map(([emoji, count]) => (
                            count > 0 && <Text key={emoji} style={styles.reactionEmoji}>{emoji} {count}</Text>
                          ))}
                          <Text style={styles.reactionCount}>
                            {Object.values(post.reactions).reduce((sum, count) => sum + count, 0)} reactions
                          </Text>
                        </View>
                      )}
                    </BlurView>
                  </Animated.View>
                ))
              ) : (
                <View style={styles.emptyPinnedPosts}>
                  <Text style={styles.emptyText}>Pin your favorite posts to showcase your journey</Text>
                </View>
              )}
            </View>

            {/* Recent Posts Preview */}
            {recentPosts.length > 0 && (
              <View style={styles.recentPostsPreview}>
                <Text style={styles.recentPostsLabel}>Recent Activity</Text>
                <View style={styles.recentPostsList}>
                  {recentPosts.map((post, index) => (
                    <View key={post.id} style={styles.recentPostItem}>
                      <View style={styles.recentPostDot} />
                      <Text style={styles.recentPostText} numberOfLines={1}>
                        {post.content}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* ACHIEVEMENT GRID - Instagram Style */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Grid3x3 size={20} color="#FFD700" />
              <Text style={styles.sectionTitle}>Achievement Gallery</Text>
              <View style={styles.gridStats}>
                <Text style={styles.gridStatsText}>{allGridActions.length} actions</Text>
              </View>
            </View>

            <View style={styles.achievementGrid}>
              {allGridActions.map((action, index) => (
                <Animated.View
                  key={action.id}
                  entering={FadeInDown.delay(index * 50).springify()}
                >
                  <Pressable
                    style={styles.gridItem}
                    onPress={() => setSelectedAction(action)}
                  >
                    {/* Background based on type */}
                    {action.type === 'photo' && action.mediaUrl ? (
                      <>
                        <Image source={{ uri: action.mediaUrl }} style={styles.gridImage} />
                        <LinearGradient
                          colors={['transparent', 'rgba(0,0,0,0.3)']}
                          style={styles.gridImageOverlay}
                        />
                      </>
                    ) : action.type === 'audio' ? (
                      <>
                        <LinearGradient
                          colors={['rgba(0,0,0,0.95)', 'rgba(18,23,28,0.9)']}
                          style={styles.gridGradient}
                        />
                        <View style={styles.gridBorder} />
                        <View style={styles.gridIconGlow}>
                          <Mic size={28} color={LuxuryTheme.colors.primary.silver} />
                        </View>
                        <Text style={styles.gridAudioDuration}>2:45</Text>
                      </>
                    ) : action.type === 'milestone' ? (
                      <>
                        <LinearGradient
                          colors={[LuxuryTheme.colors.primary.gold, LuxuryTheme.colors.primary.champagne]}
                          style={styles.gridGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        />
                        <View style={styles.gridIconContainer}>
                          <Trophy size={30} color="#000000" />
                        </View>
                        <Text style={styles.gridMilestoneText}>Day {action.streak}</Text>
                      </>
                    ) : (
                      <>
                        <LinearGradient
                          colors={['rgba(0,0,0,0.95)', 'rgba(18,23,28,0.9)']}
                          style={styles.gridGradient}
                        />
                        <View style={styles.gridBorder} />
                        <View style={styles.gridIconGlow}>
                          <CheckCircle size={28} color={LuxuryTheme.colors.primary.gold} />
                        </View>
                        <Text style={styles.gridActionTitle} numberOfLines={2}>
                          {action.title}
                        </Text>
                      </>
                    )}
                    
                    {/* Private lock icon */}
                    {action.isPrivate && (
                      <View style={styles.privateLock}>
                        <Lock size={12} color={LuxuryTheme.colors.primary.gold} />
                      </View>
                    )}
                    
                    {/* Streak badge for high streaks */}
                    {action.streak && action.streak >= 7 && (
                      <View style={styles.streakBadgeSmall}>
                        <Flame size={10} color="#FFD700" />
                        <Text style={styles.streakBadgeText}>{action.streak}</Text>
                      </View>
                    )}
                  </Pressable>
                </Animated.View>
              ))}
            </View>

            {/* View All Button */}
            <Pressable style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All Actions</Text>
            </Pressable>
          </View>

          {/* SOCIAL PROOF - Community Impact */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Users size={20} color="#E5E4E2" />
              <Text style={styles.sectionTitle}>Community Impact</Text>
            </View>

            <BlurView intensity={25} tint="dark" style={styles.impactCard}>
              <LinearGradient
                colors={['rgba(192,192,192,0.08)', 'rgba(255,215,0,0.03)']}
                style={StyleSheet.absoluteFillObject}
              />

              <View style={styles.impactGrid}>
                <View style={styles.impactItem}>
                  <Heart size={24} color="#FFD700" />
                  <Text style={styles.impactNumber}>{stats.inspirationGiven}</Text>
                  <Text style={styles.impactLabel}>Inspiration Given</Text>
                </View>
                
                <View style={styles.impactItem}>
                  <MessageCircle size={24} color="#C0C0C0" />
                  <Text style={styles.impactNumber}>89</Text>
                  <Text style={styles.impactLabel}>Supportive Comments</Text>
                </View>
                
                <View style={styles.impactItem}>
                  <Award size={24} color="#F7E7CE" />
                  <Text style={styles.impactNumber}>12</Text>
                  <Text style={styles.impactLabel}>Milestones Celebrated</Text>
                </View>
              </View>

              {/* Testimonial */}
              <View style={styles.testimonialCard}>
                <Text style={styles.testimonialText}>
                  "Your consistency inspires me every day! 🌟"
                </Text>
                <Text style={styles.testimonialAuthor}>- Jordan</Text>
              </View>
            </BlurView>
          </View>

          {/* Growth Visualization */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <TrendingUp size={20} color="#FFD700" />
              <Text style={styles.sectionTitle}>Growth Timeline</Text>
            </View>

            <BlurView intensity={20} tint="dark" style={styles.timelineCard}>
              <LinearGradient
                colors={['rgba(255,215,0,0.05)', 'rgba(192,192,192,0.05)']}
                style={StyleSheet.absoluteFillObject}
              />
              
              {/* Milestone Timeline */}
              <View style={styles.timeline}>
                <View style={styles.timelineItem}>
                  <View style={styles.timelineDot} />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineDate}>Today</Text>
                    <Text style={styles.timelineEvent}>30-day meditation streak! 🧘</Text>
                  </View>
                </View>
                
                <View style={styles.timelineItem}>
                  <View style={styles.timelineDot} />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineDate}>1 week ago</Text>
                    <Text style={styles.timelineEvent}>Completed first 5K run 🏃</Text>
                  </View>
                </View>
                
                <View style={styles.timelineItem}>
                  <View style={styles.timelineDot} />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineDate}>1 month ago</Text>
                    <Text style={styles.timelineEvent}>Started morning routine ☀️</Text>
                  </View>
                </View>
              </View>
            </BlurView>
          </View>
        </ScrollView>
      </LuxuryGradientBackground>
      <ResetOnboardingButton />
      
      {/* Logout Button */}
      <Pressable 
        style={styles.logoutButton}
        onPress={async () => {
          await logout();
        }}
      >
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },

  // Hero Section
  heroCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
  },
  heroCardInner: {
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.1)',
  },
  avatarSection: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    padding: 3,
  },
  avatar: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    backgroundColor: '#0A0A0A',
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFD700',
  },
  streakBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0A0A0A',
    borderRadius: 12,
    padding: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  streakNumber: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '700',
  },
  profileName: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  profileBio: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 20,
  },
  achievementRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  achievementBadge: {
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
    overflow: 'hidden',
  },
  achievementLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
  },
  signatureStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFD700',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(192,192,192,0.2)',
  },

  // Section Styles
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Journey Card
  journeyCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.1)',
    overflow: 'hidden',
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  goalItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255,215,0,0.05)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.1)',
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  goalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  goalTitle: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    flex: 1,
  },
  progressRing: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: 'rgba(255,215,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: 8,
  },
  progressArc: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: '#FFD700',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFD700',
  },
  goalCategory: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
  focusCard: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
    overflow: 'hidden',
  },
  focusLabel: {
    fontSize: 12,
    color: '#FFD700',
    marginBottom: 4,
  },
  focusText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },

  // Timeline Section
  pinnedSection: {
    marginBottom: 16,
  },
  pinnedLabel: {
    fontSize: 14,
    color: '#FFD700',
    marginBottom: 8,
    fontWeight: '600',
  },
  pinnedPost: {
    marginBottom: 8,
  },
  recentSection: {
    marginTop: 8,
  },
  recentLabel: {
    fontSize: 14,
    color: '#C0C0C0',
    marginBottom: 8,
    fontWeight: '600',
  },
  recentPost: {
    marginBottom: 8,
  },

  // Impact Section
  impactCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(192,192,192,0.1)',
    overflow: 'hidden',
  },
  impactGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  impactItem: {
    alignItems: 'center',
    gap: 4,
  },
  impactNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  impactLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
  testimonialCard: {
    backgroundColor: 'rgba(255,215,0,0.05)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.1)',
  },
  testimonialText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  testimonialAuthor: {
    fontSize: 12,
    color: '#FFD700',
    textAlign: 'right',
  },

  // Timeline
  timelineCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.1)',
    overflow: 'hidden',
  },
  timeline: {
    gap: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFD700',
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineDate: {
    fontSize: 12,
    color: '#C0C0C0',
    marginBottom: 2,
  },
  timelineEvent: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },

  // Achievement Grid Styles (Instagram-like)
  gridStats: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  gridStatsText: {
    fontSize: 11,
    color: '#FFD700',
    fontWeight: '600',
  },
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    marginBottom: 16,
  },
  gridItem: {
    width: 110,
    height: 110,
    backgroundColor: '#000000',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gridGradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridImageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gridBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.1)',
    borderRadius: 8,
  },
  gridIconGlow: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  gridIconContainer: {
    padding: 4,
  },
  gridActionTitle: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 6,
    letterSpacing: 0.2,
  },
  gridAudioDuration: {
    fontSize: 12,
    color: LuxuryTheme.colors.primary.silver,
    marginTop: 4,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  gridMilestoneText: {
    fontSize: 12,
    color: '#000000',
    fontWeight: '900',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  privateLock: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 10,
    padding: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  streakBadgeSmall: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 0.5,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  streakBadgeText: {
    fontSize: 10,
    color: '#FFD700',
    fontWeight: '700',
  },
  viewAllButton: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  viewAllText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  
  // Logout button styles
  logoutButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.3)',
  },
  logoutText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '600',
  },
  pinnedPostsContainer: {
    marginBottom: 16,
  },
  pinnedPost: {
    marginBottom: 12,
  },
  pinnedPostCard: {
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  postTypeIcon: {
    marginRight: 8,
  },
  postDate: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  postContent: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reactionEmoji: {
    fontSize: 16,
  },
  reactionCount: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginLeft: 8,
  },
  emptyPinnedPosts: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 14,
    textAlign: 'center',
  },
  recentPostsPreview: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
  },
  recentPostsLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  recentPostsList: {
    gap: 8,
  },
  recentPostItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recentPostDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFD700',
  },
  recentPostText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    flex: 1,
  },
});