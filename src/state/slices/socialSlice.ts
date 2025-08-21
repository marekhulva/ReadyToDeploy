import { StateCreator } from 'zustand';
import { apiService } from '../../services/api.service';

export type PostType = 'checkin'|'status'|'photo'|'audio'|'goal';
export type Visibility = 'circle'|'follow';

export type Post = {
  id: string;
  user: string;
  avatar?: string;              // emoji or URL
  type: PostType;
  visibility: Visibility;
  content: string;              // status/insight or caption
  time: string;                 // "2h"
  timestamp?: string;           // ISO date string for sorting
  reactions: Record<string, number>;
  userReacted?: boolean;  // Track if current user reacted
  comments?: number;
  // media
  photoUri?: string;
  audioUri?: string;
  // check-in metadata
  actionTitle?: string;
  goal?: string;
  streak?: number;
  goalColor?: string;           // hex used for chip/glow
  // New streak metrics
  streakMetrics?: {
    graceStreak?: { done: number; window: number; label: string };
    recovery?: { isComeback: boolean; label?: string };
    momentum?: { score: number; trend: 'up' | 'down' | 'stable' };
    monthProgress?: { completed: number; total: number };
    intensity?: 'Low' | 'Medium' | 'High';
  };
  // Social proof
  socialProof?: {
    inspired?: number;  // "3 people boosted their streak after seeing this"
    milestone?: string; // "First 7-day streak!"
  };
};

export type SocialSlice = {
  circleFeed: Post[]; 
  followFeed: Post[];
  feedLoading: boolean;
  feedError: string | null;
  fetchFeeds: () => Promise<void>;
  react: (id:string, emoji:string, which:Visibility) => Promise<void>;
  addPost: (p:Partial<Post>) => Promise<void>;
};

export const createSocialSlice: StateCreator<SocialSlice> = (set) => ({
  circleFeed: [],
  followFeed: [],
  feedLoading: false,
  feedError: null,
  
  fetchFeeds: async () => {
    set({ feedLoading: true, feedError: null });
    try {
      // Fetch both feeds in parallel
      const [circleResponse, followResponse] = await Promise.all([
        apiService.getFeed('circle'),
        apiService.getFeed('follow')
      ]);
      
      // Transform API data to match our Post type
      const transformPost = (post: any): Post => {
        // Calculate time ago
        const timeAgo = (date: string) => {
          const diff = Date.now() - new Date(date).getTime();
          const minutes = Math.floor(diff / (1000 * 60));
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const days = Math.floor(hours / 24);
          
          if (minutes < 1) return 'now';
          if (minutes < 60) return `${minutes}m`;
          if (hours < 24) return `${hours}h`;
          return `${days}d`;
        };
        
        // Parse reactions from database format
        const reactions: Record<string, number> = {};
        if (post.reactions) {
          post.reactions.forEach((r: any) => {
            reactions[r.emoji] = (reactions[r.emoji] || 0) + 1;
          });
        }
        
        return {
          id: post.id,
          user: post.user?.name || 'Anonymous',
          avatar: post.user?.avatar || '👤',
          type: post.type as PostType,
          visibility: post.visibility as Visibility,
          content: post.content,
          time: timeAgo(post.createdAt),
          timestamp: post.createdAt, // Include timestamp for consistent sorting
          reactions,
          photoUri: post.type === 'photo' ? post.mediaUrl : undefined,
          audioUri: post.type === 'audio' ? post.mediaUrl : undefined,
          actionTitle: post.actionTitle,
          goal: post.goalTitle,
          streak: post.streak,
          goalColor: post.goalColor
        };
      };
      
      if (circleResponse.success) {
        const circlePosts = (circleResponse.data || []).map(transformPost);
        set({ circleFeed: circlePosts });
      }
      
      if (followResponse.success) {
        const followPosts = (followResponse.data || []).map(transformPost);
        set({ followFeed: followPosts });
      }
      
      set({ feedLoading: false });
    } catch (error: any) {
      set({ feedError: error.message, feedLoading: false });
    }
  },
  
  react: async (id, emoji, which) => {
    // Toggle reaction - if user already reacted, remove it, otherwise add it
    const currentFeed = which === 'circle' ? 'circleFeed' : 'followFeed';
    const currentPost = set.getState()[currentFeed].find(p => p.id === id);
    const hasReacted = currentPost?.userReacted || false;
    
    // Optimistically update UI first
    set((s) => ({
      [currentFeed]: 
        s[currentFeed].map(p => 
          p.id === id 
            ? { 
                ...p, 
                reactions: { 
                  ...p.reactions, 
                  [emoji]: hasReacted 
                    ? Math.max(0, (p.reactions[emoji] || 0) - 1)
                    : (p.reactions[emoji] || 0) + 1
                },
                userReacted: !hasReacted
              } 
            : p
        )
    }));

    try {
      const response = await apiService.reactToPost(id, emoji);
      if (!response.success) {
        // Revert optimistic update on failure
        set((s) => ({
          [currentFeed]: 
            s[currentFeed].map(p => 
              p.id === id 
                ? { 
                    ...p, 
                    reactions: { 
                      ...p.reactions, 
                      [emoji]: hasReacted 
                        ? (p.reactions[emoji] || 0) + 1  // Revert removal
                        : Math.max(0, (p.reactions[emoji] || 0) - 1)  // Revert addition
                    },
                    userReacted: hasReacted
                  } 
                : p
            )
        }));
        console.error('Failed to react to post:', response.error);
      }
    } catch (error) {
      // Revert optimistic update on error
      set((s) => ({
        [currentFeed]: 
          s[currentFeed].map(p => 
            p.id === id 
              ? { 
                  ...p, 
                  reactions: { 
                    ...p.reactions, 
                    [emoji]: hasReacted 
                      ? (p.reactions[emoji] || 0) + 1  // Revert removal
                      : Math.max(0, (p.reactions[emoji] || 0) - 1)  // Revert addition
                  },
                  userReacted: hasReacted
                } 
              : p
          )
      }));
      console.error('Failed to react to post:', error);
    }
  },
  
  addPost: async (postData) => {
    set({ feedError: null });
    
    // Create optimistic post
    const now = new Date();
    const optimisticPost: Post = {
      id: `temp-${Date.now()}`,
      user: 'You',
      avatar: '👤',
      type: postData.type || 'status',
      visibility: postData.visibility || 'circle',
      content: postData.content || '',
      time: 'now',
      timestamp: now.toISOString(), // Add timestamp for sorting
      reactions: {},
      photoUri: postData.photoUri,
      audioUri: postData.audioUri,
      actionTitle: postData.actionTitle,
      goal: postData.goal,
      streak: postData.streak,
      goalColor: postData.goalColor
    };

    // Optimistically add to feed
    set((s) => {
      if (optimisticPost.visibility === 'circle') {
        return { circleFeed: [optimisticPost, ...s.circleFeed] };
      }
      return { followFeed: [optimisticPost, ...s.followFeed] };
    });

    try {
      const response = await apiService.createPost({
        type: postData.type || 'status',
        visibility: postData.visibility || 'circle',
        content: postData.content || '',
        mediaUrl: postData.photoUri || postData.audioUri,
        actionTitle: postData.actionTitle,
        goalTitle: postData.goal,
        goalColor: postData.goalColor,
        streak: postData.streak
      });
      
      if (response.success && response.data) {
        // Replace optimistic post with real post
        const realPost: Post = {
          id: response.data.id,
          user: response.data.user?.name || 'You',
          avatar: response.data.user?.avatar || '👤',
          type: response.data.type,
          visibility: response.data.visibility,
          content: response.data.content,
          time: 'now',
          timestamp: response.data.createdAt || new Date().toISOString(), // Include timestamp
          reactions: {},
          photoUri: response.data.type === 'photo' ? response.data.mediaUrl : undefined,
          audioUri: response.data.type === 'audio' ? response.data.mediaUrl : undefined,
          actionTitle: response.data.actionTitle,
          goal: response.data.goalTitle,
          streak: response.data.streak,
          goalColor: response.data.goalColor
        };
        
        set((s) => {
          if (realPost.visibility === 'circle') {
            return { 
              circleFeed: s.circleFeed.map(p => 
                p.id === optimisticPost.id ? realPost : p
              )
            };
          }
          return { 
            followFeed: s.followFeed.map(p => 
              p.id === optimisticPost.id ? realPost : p
            )
          };
        });
      } else {
        // Remove optimistic post on failure
        set((s) => {
          if (optimisticPost.visibility === 'circle') {
            return { circleFeed: s.circleFeed.filter(p => p.id !== optimisticPost.id) };
          }
          return { followFeed: s.followFeed.filter(p => p.id !== optimisticPost.id) };
        });
        set({ feedError: response.error || 'Failed to create post' });
      }
    } catch (error: any) {
      // Remove optimistic post on error
      set((s) => {
        if (optimisticPost.visibility === 'circle') {
          return { circleFeed: s.circleFeed.filter(p => p.id !== optimisticPost.id) };
        }
        return { followFeed: s.followFeed.filter(p => p.id !== optimisticPost.id) };
      });
      set({ feedError: error.message || 'Failed to create post' });
      console.error('Failed to create post:', error);
    }
  },
});