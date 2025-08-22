import { StateCreator } from 'zustand';
import { backendService } from '../../services/backend.service';
import { AuthSlice } from './authSlice';

export type PostType = 'checkin'|'status'|'photo'|'audio'|'goal';
export type Visibility = 'circle'|'follow';

export type Comment = {
  id: string;
  postId: string;
  user: string;
  avatar?: string;
  content: string;
  time: string;
  timestamp: string;
};

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
  comments?: Comment[];         // Array of comments
  commentCount?: number;        // Total comment count
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
  addComment: (postId: string, content: string, which: Visibility) => Promise<void>;
  loadComments: (postId: string, which: Visibility) => Promise<void>;
};

export const createSocialSlice: StateCreator<
  SocialSlice & AuthSlice,
  [],
  [],
  SocialSlice
> = (set, get) => ({
  circleFeed: [],
  followFeed: [],
  feedLoading: false,
  feedError: null,
  
  fetchFeeds: async () => {
    set({ feedLoading: true, feedError: null });
    try {
      // Get current user from auth slice
      const currentUser = get().user;
      const currentUserId = currentUser?.id;
      
      // Fetch both feeds in parallel
      const [circleResponse, followResponse] = await Promise.all([
        backendService.getFeed('circle'),
        backendService.getFeed('follow')
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
        
        // Check if this post is from the current user
        const isCurrentUser = post.userId === currentUserId;
        
        // Debug audio posts
        if (post.type === 'audio') {
          console.log('Audio post from backend:', {
            id: post.id,
            type: post.type,
            mediaUrl: post.mediaUrl,
            content: post.content
          });
        }
        
        return {
          id: post.id,
          user: isCurrentUser ? 'You' : (post.user?.name || 'Anonymous'),
          avatar: isCurrentUser ? (currentUser?.avatar || '👤') : (post.user?.avatar || '👤'),
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
    const currentPost = get()[currentFeed].find(p => p.id === id);
    const hasReacted = currentPost?.userReacted || false;
    
    // Optimistically update UI first
    set((s) => ({
      [currentFeed]: 
        s[currentFeed].map(p => 
          p.id === id 
            ? { 
                ...p, 
                reactions: { 
                  ...(p.reactions || {}), 
                  [emoji]: hasReacted 
                    ? Math.max(0, ((p.reactions || {})[emoji] || 0) - 1)
                    : ((p.reactions || {})[emoji] || 0) + 1
                },
                userReacted: !hasReacted
              } 
            : p
        )
    }));

    try {
      const response = await backendService.reactToPost(id, emoji);
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
    
    // Get current user from auth state
    const currentUser = get().user;
    
    // Create optimistic post
    const now = new Date();
    const optimisticPost: Post = {
      id: `temp-${Date.now()}`,
      user: 'You',
      avatar: currentUser?.avatar || '👤',
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
      const response = await backendService.createPost({
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
        // Replace optimistic post with real post - always show "You" for current user's posts
        const realPost: Post = {
          id: response.data.id,
          user: 'You',
          avatar: currentUser?.avatar || response.data.user?.avatar || '👤',
          type: response.data.type,
          visibility: response.data.visibility,
          content: response.data.content,
          time: 'now',
          timestamp: response.data.createdAt || response.data.created_at || new Date().toISOString(), // Include timestamp
          reactions: {},
          photoUri: response.data.type === 'photo' ? (response.data.mediaUrl || response.data.media_url) : undefined,
          audioUri: response.data.type === 'audio' ? (response.data.mediaUrl || response.data.media_url) : undefined,
          actionTitle: response.data.actionTitle || response.data.action_title,
          goal: response.data.goalTitle || response.data.goal_title,
          streak: response.data.streak,
          goalColor: response.data.goalColor || response.data.goal_color
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
  
  addComment: async (postId, content, which) => {
    // Get current user from auth state
    const currentUser = get().user;
    const currentFeed = which === 'circle' ? 'circleFeed' : 'followFeed';
    
    // Create optimistic comment
    const optimisticComment: Comment = {
      id: `temp-${Date.now()}`,
      postId,
      user: 'You',
      avatar: currentUser?.avatar || '👤',
      content,
      time: 'now',
      timestamp: new Date().toISOString(),
    };
    
    // Optimistically update UI
    set((s) => ({
      [currentFeed]: s[currentFeed].map(p => 
        p.id === postId 
          ? {
              ...p,
              comments: [...(p.comments || []), optimisticComment],
              commentCount: (p.commentCount || 0) + 1,
            }
          : p
      )
    }));
    
    try {
      // TODO: Implement backend API call
      // const response = await backendService.addComment(postId, content);
      // if (response.success && response.data) {
      //   // Replace optimistic comment with real comment
      // }
      
      // For now, just keep the optimistic update
      console.log('Comment added:', { postId, content });
    } catch (error) {
      // Revert optimistic update on error
      set((s) => ({
        [currentFeed]: s[currentFeed].map(p => 
          p.id === postId 
            ? {
                ...p,
                comments: (p.comments || []).filter(c => c.id !== optimisticComment.id),
                commentCount: Math.max(0, (p.commentCount || 0) - 1),
              }
            : p
        )
      }));
      console.error('Failed to add comment:', error);
    }
  },
  
  loadComments: async (postId, which) => {
    try {
      // TODO: Implement backend API call to load all comments
      // const response = await backendService.getComments(postId);
      // if (response.success && response.data) {
      //   const currentFeed = which === 'circle' ? 'circleFeed' : 'followFeed';
      //   set((s) => ({
      //     [currentFeed]: s[currentFeed].map(p => 
      //       p.id === postId 
      //         ? { ...p, comments: response.data }
      //         : p
      //     )
      //   }));
      // }
      
      console.log('Loading comments for post:', postId);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  },
});