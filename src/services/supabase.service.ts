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
    // Allow reading posts even if not authenticated for testing
    // if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles(name, avatar_url),
        reactions(emoji, user_id)
      `)
      .eq('visibility', type)
      .order('created_at', { ascending: false })
      .limit(50);

    console.log('getFeed query result:', { type, count: data?.length, error });
    if (error) throw error;
    
    // Transform snake_case to camelCase for frontend compatibility
    return data?.map(post => ({
      ...post,
      userId: post.user_id,
      mediaUrl: post.media_url,
      actionTitle: post.action_title,
      goalTitle: post.goal_title,
      goalColor: post.goal_color,
      createdAt: post.created_at,
      user: post.profiles || { name: 'Unknown User', avatar_url: null }  // Handle missing profile
    })) || [];
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
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    
    // For local testing, use a test user if not authenticated
    const userId = user?.id || '00000000-0000-0000-0000-000000000000';

    // Map camelCase to snake_case for database
    const { mediaUrl, actionTitle, goalTitle, goalColor, ...postData } = post;
    
    const { data, error } = await supabase
      .from('posts')
      .insert({
        ...postData,
        user_id: userId,
        media_url: mediaUrl,  // Map mediaUrl to media_url
        action_title: actionTitle,  // Map actionTitle to action_title
        goal_title: goalTitle,  // Map goalTitle to goal_title
        goal_color: goalColor,  // Map goalColor to goal_color
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
}

export const supabaseService = new SupabaseService();