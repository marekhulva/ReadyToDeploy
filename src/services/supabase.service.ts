import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase project configuration
const SUPABASE_URL = 'https://ojusijzhshvviqjeyhyn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qdXNpanpoc2h2dmlxamV5aHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NjU3MjQsImV4cCI6MjA3MTE0MTcyNH0.rlQ9lIGzoaLTOW-5-W0G1J1A0WwvqZMnhGHW-FwV8GQ';

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

class SupabaseService {
  // Auth methods
  async signUp(email: string, password: string, name: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    });
    
    if (error) throw error;
    return data;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async getProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    // Get profile from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    return { ...user, ...profile };
  }

  // Goals methods
  async getGoals() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found in getGoals');
        return [];  // Return empty array instead of throwing
      }

      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching goals:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('getGoals error:', error);
      return [];  // Return empty array on error
    }
  }

  async createGoal(goal: {
    title: string;
    metric: string;
    deadline: string;
    category?: string;
    color?: string;
    why?: string;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('goals')
      .insert({
        ...goal,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateGoal(id: string, updates: any) {
    const { data, error } = await supabase
      .from('goals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteGoal(id: string) {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Actions methods
  async getDailyActions() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found in getDailyActions');
        return [];  // Return empty array instead of throwing
      }

      const today = new Date().toISOString().split('T')[0];  // YYYY-MM-DD format
      
      const { data, error } = await supabase
        .from('actions')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)  // Simple date equality
        .order('time', { ascending: true });

      if (error) {
        console.error('Error fetching daily actions:', error);
        throw error;
      }
      
      // Transform to camelCase
      return data?.map(action => ({
        ...action,
        goalId: action.goal_id,
        userId: action.user_id,
        completedAt: action.completed_at
      })) || [];
    } catch (error) {
      console.error('getDailyActions error:', error);
      return [];  // Return empty array on error
    }
  }

  async createAction(action: {
    title: string;
    time?: string;
    goalId?: string;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Remove goalId from action to avoid conflict
    const { goalId, ...actionData } = action;
    
    const { data, error } = await supabase
      .from('actions')
      .insert({
        ...actionData,
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],  // Just the date part YYYY-MM-DD
        completed: false,
        goal_id: goalId  // Map goalId to goal_id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async completeAction(id: string) {
    const { data, error } = await supabase
      .from('actions')
      .update({ 
        completed: true,
        completed_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateAction(id: string, updates: any) {
    const { data, error } = await supabase
      .from('actions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteAction(id: string) {
    const { error } = await supabase
      .from('actions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Posts methods
  async getFeed(type: 'circle' | 'follow' = 'circle') {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Must be authenticated to see feeds
    if (!user) {
      console.log('No authenticated user for feed');
      return [];
    }
    
    if (type === 'circle') {
      // Get posts from circle members only
      const { data: profile } = await supabase
        .from('profiles')
        .select('circle_id')
        .eq('id', user.id)
        .single();
      
      if (!profile?.circle_id) {
        return []; // No circle, no posts
      }

      // Get all circle member IDs
      const { data: members } = await supabase
        .from('circle_members')
        .select('user_id')
        .eq('circle_id', profile.circle_id);
      
      const memberIds = members?.map(m => m.user_id) || [];
      
      // Get posts from circle members with profile info
      const { data: posts, error } = await supabase
        .from('posts')
        .select(`
          *,
          reactions(emoji, user_id)
        `)
        .in('user_id', memberIds)
        .eq('visibility', 'circle')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Get profiles for all post authors
      const userIds = [...new Set(posts?.map(p => p.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', userIds);
      
      // Attach profile info to posts
      const postsWithProfiles = posts?.map(post => ({
        ...post,
        profiles: profiles?.find(p => p.id === post.user_id) || null
      })) || [];
      
      console.log('Circle feed:', { count: postsWithProfiles.length });
      return postsWithProfiles;
    } else {
      // Get posts from people you follow
      const { data: following } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user?.id);
      
      const followingIds = following?.map(f => f.following_id) || [];
      
      if (followingIds.length === 0) {
        return []; // Not following anyone
      }

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles(name, avatar_url),
          reactions(emoji, user_id)
        `)
        .in('user_id', followingIds)
        .eq('visibility', 'follow')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      console.log('Following feed:', { count: data?.length });
      return data || [];
    }
  }


  async createPost(post: {
    type: string;
    visibility: string;
    content: string;
    mediaUrl?: string;
    actionTitle?: string;
    goalTitle?: string;
    goalColor?: string;
    streak?: number;
    circleId?: string | null;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    
    // User must be authenticated to post
    if (!user) {
      throw new Error('You must be logged in to create posts');
    }
    
    const userId = user.id;

    // Map camelCase to snake_case for database
    const { mediaUrl, actionTitle, goalTitle, goalColor, circleId, ...postData } = post;
    
    const { data, error } = await supabase
      .from('posts')
      .insert({
        ...postData,
        user_id: userId,
        media_url: mediaUrl,  // Map mediaUrl to media_url
        action_title: actionTitle,  // Map actionTitle to action_title
        goal_title: goalTitle,  // Map goalTitle to goal_title
        goal_color: goalColor,  // Map goalColor to goal_color
        circle_id: circleId,  // Map circleId to circle_id
      })
      .select()
      .single();

    if (error) throw error;
    
    // Return the created post with proper field mapping back to camelCase
    return {
      ...data,
      mediaUrl: data.media_url,
      actionTitle: data.action_title,
      goalTitle: data.goal_title,
      goalColor: data.goal_color
    };
  }

  async reactToPost(postId: string, emoji: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('reactions')
      .upsert({
        post_id: postId,
        user_id: user.id,
        emoji,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Real-time subscriptions
  subscribeToFeed(callback: (payload: any) => void) {
    return supabase
      .channel('feed')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'posts' },
        callback
      )
      .subscribe();
  }

  // Circle methods
  async createCircle(name: string, description?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('circles')
      .insert({
        name,
        description,
        created_by: user.id
      })
      .select()
      .single();

    if (error) throw error;
    
    // Auto-join creator to circle
    await this.joinCircle(data.id);
    
    return data;
  }

  async joinCircleWithCode(inviteCode: string) {
    const { data, error } = await supabase
      .rpc('join_circle_with_code', { code: inviteCode });
    
    if (error) throw error;
    return data;
  }

  async joinCircle(circleId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('circle_members')
      .insert({
        circle_id: circleId,
        user_id: user.id
      });

    if (error) throw error;

    // Update user's current circle
    await supabase
      .from('profiles')
      .update({ circle_id: circleId })
      .eq('id', user.id);
  }

  async getMyCircle() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Get user's current circle
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('circle_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return null;
    }

    if (!profile?.circle_id) {
      console.log('User has no circle_id set in profile');
      return null;
    }

    // Get circle details (simplified query without nested joins)
    const { data: circle, error: circleError } = await supabase
      .from('circles')
      .select('*')
      .eq('id', profile.circle_id)
      .single();

    if (circleError) {
      console.error('Error fetching circle:', circleError);
      return null;
    }

    return circle;
  }

  async getCircleMembers(circleId: string) {
    console.log('Fetching members for circle:', circleId);
    
    // First get the member records
    const { data: members, error: membersError } = await supabase
      .from('circle_members')
      .select('user_id, role, joined_at')
      .eq('circle_id', circleId);

    if (membersError) {
      console.error('Error fetching circle members:', membersError);
      console.error('Failed query: SELECT user_id, role, joined_at FROM circle_members WHERE circle_id =', circleId);
      throw membersError;
    }

    if (!members || members.length === 0) {
      console.log('No members found for circle:', circleId);
      return [];
    }

    // Filter out null user_ids and get profiles for valid members
    const validMembers = members.filter(m => m.user_id !== null);
    const userIds = validMembers.map(m => m.user_id);
    
    console.log('Valid user IDs:', userIds);
    
    if (userIds.length === 0) {
      console.log('No valid user IDs found');
      return [];
    }
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, username, avatar_url')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    // Combine the data
    const membersWithProfiles = validMembers.map(member => {
      const profile = profiles?.find(p => p.id === member.user_id);
      return {
        user_id: member.user_id,
        role: member.role,
        joined_at: member.joined_at,
        profiles: profile || { name: 'Unknown', username: 'unknown', avatar_url: null }
      };
    });
    
    console.log('Fetched circle members with profiles:', membersWithProfiles);
    return membersWithProfiles;
  }

  // Following methods
  async followUser(userId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('follows')
      .insert({
        follower_id: user.id,
        following_id: userId
      });

    if (error) throw error;

    // Update counts
    await supabase.rpc('increment', { 
      table_name: 'profiles', 
      column_name: 'following_count',
      row_id: user.id 
    });
    
    await supabase.rpc('increment', { 
      table_name: 'profiles', 
      column_name: 'follower_count',
      row_id: userId 
    });
  }

  async unfollowUser(userId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', userId);

    if (error) throw error;
  }

  async getFollowing() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('follows')
      .select(`
        following_id,
        profiles!follows_following_id_fkey (
          id, name, username, avatar_url
        )
      `)
      .eq('follower_id', user.id);

    if (error) throw error;
    return data || [];
  }

  async getFollowers() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('follows')
      .select(`
        follower_id,
        profiles!follows_follower_id_fkey (
          id, name, username, avatar_url
        )
      `)
      .eq('following_id', user.id);

    if (error) throw error;
    return data || [];
  }
}

export const supabaseService = new SupabaseService();