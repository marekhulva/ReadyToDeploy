import { StateCreator } from 'zustand';
import { supabase, supabaseHelpers, type Post, type Reaction } from '../../services/supabase';

export type PostType = 'checkin' | 'status' | 'photo' | 'audio' | 'goal';
export type VisibilityType = 'circle' | 'follow' | 'public';

export interface SocialPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  type: PostType;
  visibility: VisibilityType;
  content: string;
  mediaUrl?: string;
  actionTitle?: string;
  goalTitle?: string;
  goalColor?: string;
  streak?: number;
  createdAt: string;
  reactions: {
    emoji: string;
    users: Array<{ id: string; name: string }>;
  }[];
}

export interface SocialSlice {
  posts: SocialPost[];
  postsLoading: boolean;
  postsError: string | null;
  feedType: 'circle' | 'follow' | 'public';
  
  // Actions
  fetchFeed: (type?: 'circle' | 'follow' | 'public') => Promise<void>;
  createPost: (post: {
    type: PostType;
    visibility: VisibilityType;
    content: string;
    mediaUrl?: string;
    actionTitle?: string;
    goalTitle?: string;
    goalColor?: string;
    streak?: number;
  }) => Promise<void>;
  addReaction: (postId: string, emoji: string) => Promise<void>;
  setFeedType: (type: 'circle' | 'follow' | 'public') => void;
}

export const createSocialSlice: StateCreator<SocialSlice> = (set, get) => ({
  posts: [],
  postsLoading: false,
  postsError: null,
  feedType: 'circle',

  fetchFeed: async (type?: 'circle' | 'follow' | 'public') => {
    const feedType = type || get().feedType;
    set({ postsLoading: true, postsError: null });
    
    try {
      const user = await supabaseHelpers.getUser();
      if (!user) {
        set({ postsLoading: false, postsError: 'Not authenticated' });
        return;
      }

      const { data, error } = await supabaseHelpers.getFeed(user.id, feedType);
      
      if (error) {
        set({ postsLoading: false, postsError: error.message });
        return;
      }
      
      // Transform the data to match our SocialPost interface
      const posts: SocialPost[] = (data || []).map(post => {
        // Group reactions by emoji
        const reactionGroups: { [emoji: string]: Array<{ id: string; name: string }> } = {};
        
        if (post.reactions) {
          post.reactions.forEach((reaction: any) => {
            if (!reactionGroups[reaction.emoji]) {
              reactionGroups[reaction.emoji] = [];
            }
            if (reaction.user) {
              reactionGroups[reaction.emoji].push({
                id: reaction.user.id,
                name: reaction.user.name || 'User'
              });
            }
          });
        }
        
        return {
          id: post.id,
          userId: post.user_id,
          userName: post.user?.name || 'Unknown User',
          userAvatar: post.user?.avatar,
          type: post.type as PostType,
          visibility: post.visibility as VisibilityType,
          content: post.content,
          mediaUrl: post.media_url,
          actionTitle: post.action_title,
          goalTitle: post.goal_title,
          goalColor: post.goal_color,
          streak: post.streak,
          createdAt: post.created_at,
          reactions: Object.entries(reactionGroups).map(([emoji, users]) => ({
            emoji,
            users
          }))
        };
      });
      
      set({ posts, postsLoading: false, postsError: null });
    } catch (error: any) {
      set({ postsLoading: false, postsError: error.message });
    }
  },

  createPost: async (post) => {
    try {
      const user = await supabaseHelpers.getUser();
      if (!user) {
        set({ postsError: 'Not authenticated' });
        return;
      }

      const { data, error } = await supabaseHelpers.createPost({
        user_id: user.id,
        ...post
      });
      
      if (error) {
        set({ postsError: error.message });
        return;
      }
      
      if (data) {
        const newPost: SocialPost = {
          id: data.id,
          userId: data.user_id,
          userName: data.user?.name || user.email?.split('@')[0] || 'User',
          userAvatar: data.user?.avatar,
          type: data.type as PostType,
          visibility: data.visibility as VisibilityType,
          content: data.content,
          mediaUrl: data.media_url,
          actionTitle: data.action_title,
          goalTitle: data.goal_title,
          goalColor: data.goal_color,
          streak: data.streak,
          createdAt: data.created_at,
          reactions: []
        };
        
        set(state => ({
          posts: [newPost, ...state.posts],
          postsError: null
        }));
      }
    } catch (error: any) {
      set({ postsError: error.message });
    }
  },

  addReaction: async (postId: string, emoji: string) => {
    try {
      const user = await supabaseHelpers.getUser();
      if (!user) {
        set({ postsError: 'Not authenticated' });
        return;
      }

      // Check if user already reacted with this emoji
      const post = get().posts.find(p => p.id === postId);
      const existingReaction = post?.reactions.find(r => 
        r.emoji === emoji && r.users.some(u => u.id === user.id)
      );

      if (existingReaction) {
        // Remove reaction
        const { error } = await supabase
          .from('reactions')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .eq('emoji', emoji);
        
        if (error) {
          set({ postsError: error.message });
          return;
        }
        
        // Update local state
        set(state => ({
          posts: state.posts.map(p => {
            if (p.id === postId) {
              const reactions = p.reactions.map(r => {
                if (r.emoji === emoji) {
                  return {
                    ...r,
                    users: r.users.filter(u => u.id !== user.id)
                  };
                }
                return r;
              }).filter(r => r.users.length > 0);
              
              return { ...p, reactions };
            }
            return p;
          }),
          postsError: null
        }));
      } else {
        // Add reaction
        const { data, error } = await supabaseHelpers.addReaction(postId, user.id, emoji);
        
        if (error) {
          set({ postsError: error.message });
          return;
        }
        
        // Update local state
        const profile = await supabaseHelpers.getProfile(user.id);
        const userName = profile.data?.name || user.email?.split('@')[0] || 'User';
        
        set(state => ({
          posts: state.posts.map(p => {
            if (p.id === postId) {
              const existingReactionIndex = p.reactions.findIndex(r => r.emoji === emoji);
              
              if (existingReactionIndex >= 0) {
                const reactions = [...p.reactions];
                reactions[existingReactionIndex] = {
                  ...reactions[existingReactionIndex],
                  users: [...reactions[existingReactionIndex].users, { id: user.id, name: userName }]
                };
                return { ...p, reactions };
              } else {
                return {
                  ...p,
                  reactions: [...p.reactions, { emoji, users: [{ id: user.id, name: userName }] }]
                };
              }
            }
            return p;
          }),
          postsError: null
        }));
      }
    } catch (error: any) {
      set({ postsError: error.message });
    }
  },

  setFeedType: (type: 'circle' | 'follow' | 'public') => {
    set({ feedType: type });
    get().fetchFeed(type);
  }
});