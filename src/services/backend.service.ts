// Unified backend service that switches between Supabase and custom backend
import { AppConfig, isSupabaseBackend } from '../config/app.config';
import { supabaseService } from './supabase.service';
import { apiService } from './api.service';

class BackendService {
  async signUp(email: string, password: string, name: string) {
    if (isSupabaseBackend()) {
      try {
        const result = await supabaseService.signUp(email, password, name);
        console.log('Supabase signup result:', result);
        
        // If user was created but no session (email confirmation might still be on)
        if (result.user && !result.session) {
          // Try to sign them in immediately since email confirmation is off
          try {
            const signInResult = await supabaseService.signIn(email, password);
            console.log('Auto sign-in after signup:', signInResult);
            
            if (signInResult.session) {
              return {
                success: true,
                data: {
                  user: {
                    id: signInResult.user?.id || result.user.id,
                    email: signInResult.user?.email || email,
                    name: name
                  },
                  token: signInResult.session.access_token
                }
              };
            }
          } catch (signInError) {
            console.log('Auto sign-in failed:', signInError);
          }
          
          return {
            success: false,
            error: 'Account created but could not sign in. Please try logging in.'
          };
        }
        
        // Normal flow if session exists
        if (result.session) {
          return {
            success: true,
            data: {
              user: {
                id: result.user?.id || '',
                email: result.user?.email || email,
                name: name
              },
              token: result.session.access_token
            }
          };
        }
        
        // No user and no session
        return {
          success: false,
          error: 'Sign up failed - no user created'
        };
      } catch (error: any) {
        console.error('Signup error:', error);
        return {
          success: false,
          error: error.message || 'Sign up failed'
        };
      }
    } else {
      return apiService.register(email, password, name);
    }
  }

  async signIn(email: string, password: string) {
    if (isSupabaseBackend()) {
      try {
        const result = await supabaseService.signIn(email, password);
        
        // Check if we actually got a session
        if (!result.session || !result.user) {
          return {
            success: false,
            error: 'Invalid email or password'
          };
        }
        
        return {
          success: true,
          data: {
            user: {
              id: result.user.id,
              email: result.user.email || email,
              name: result.user.user_metadata?.name || email.split('@')[0]
            },
            token: result.session.access_token
          }
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Sign in failed'
        };
      }
    } else {
      return apiService.login(email, password);
    }
  }

  async signOut() {
    if (isSupabaseBackend()) {
      await supabaseService.signOut();
    } else {
      await apiService.logout();
    }
  }

  async getProfile() {
    if (isSupabaseBackend()) {
      const user = await supabaseService.getProfile();
      return { success: true, data: user };
    } else {
      return apiService.getProfile();
    }
  }

  async getGoals() {
    if (isSupabaseBackend()) {
      const goals = await supabaseService.getGoals();
      return { success: true, data: goals };
    } else {
      return apiService.getGoals();
    }
  }

  async createGoal(goal: any) {
    if (isSupabaseBackend()) {
      const newGoal = await supabaseService.createGoal(goal);
      return { success: true, data: newGoal };
    } else {
      return apiService.createGoal(goal);
    }
  }

  async updateGoal(id: string, updates: any) {
    if (isSupabaseBackend()) {
      const updated = await supabaseService.updateGoal(id, updates);
      return { success: true, data: updated };
    } else {
      return apiService.updateGoal(id, updates);
    }
  }

  async deleteGoal(id: string) {
    if (isSupabaseBackend()) {
      await supabaseService.deleteGoal(id);
      return { success: true };
    } else {
      return apiService.deleteGoal(id);
    }
  }

  async getDailyActions() {
    if (isSupabaseBackend()) {
      const actions = await supabaseService.getDailyActions();
      return { success: true, data: actions };
    } else {
      return apiService.getDailyActions();
    }
  }

  async createAction(action: any) {
    if (isSupabaseBackend()) {
      const newAction = await supabaseService.createAction(action);
      return { success: true, data: newAction };
    } else {
      return apiService.createAction(action);
    }
  }

  async completeAction(id: string) {
    if (isSupabaseBackend()) {
      const completed = await supabaseService.completeAction(id);
      return { success: true, data: completed };
    } else {
      return apiService.completeAction(id);
    }
  }

  async updateAction(id: string, updates: any) {
    if (isSupabaseBackend()) {
      const updated = await supabaseService.updateAction(id, updates);
      return { success: true, data: updated };
    } else {
      return apiService.updateAction(id, updates);
    }
  }

  async deleteAction(id: string) {
    if (isSupabaseBackend()) {
      await supabaseService.deleteAction(id);
      return { success: true };
    } else {
      return apiService.deleteAction(id);
    }
  }

  async getFeed(type: 'circle' | 'follow' = 'circle') {
    if (isSupabaseBackend()) {
      const posts = await supabaseService.getFeed(type);
      return { success: true, data: posts };
    } else {
      return apiService.getFeed(type);
    }
  }

  async createPost(post: any) {
    if (isSupabaseBackend()) {
      const newPost = await supabaseService.createPost(post);
      return { success: true, data: newPost };
    } else {
      return apiService.createPost(post);
    }
  }

  async reactToPost(postId: string, emoji: string) {
    if (isSupabaseBackend()) {
      const reaction = await supabaseService.reactToPost(postId, emoji);
      return { success: true, data: reaction };
    } else {
      return apiService.reactToPost(postId, emoji);
    }
  }

  async getStreaks() {
    if (isSupabaseBackend()) {
      // Implement streaks in supabase if needed
      return { success: true, data: [] };
    } else {
      return apiService.getStreaks();
    }
  }

  // Circle methods
  async createCircle(name: string, description?: string) {
    if (isSupabaseBackend()) {
      const circle = await supabaseService.createCircle(name, description);
      return { success: true, data: circle };
    } else {
      // Custom backend doesn't have circles yet
      throw new Error('Circles not implemented in custom backend');
    }
  }

  async joinCircleWithCode(inviteCode: string) {
    if (isSupabaseBackend()) {
      const result = await supabaseService.joinCircleWithCode(inviteCode);
      return result; // Already returns {success, error, circle_id}
    } else {
      throw new Error('Circles not implemented in custom backend');
    }
  }

  async getMyCircle() {
    if (isSupabaseBackend()) {
      const circle = await supabaseService.getMyCircle();
      return { success: true, data: circle };
    } else {
      throw new Error('Circles not implemented in custom backend');
    }
  }

  async getCircleMembers(circleId: string) {
    if (isSupabaseBackend()) {
      const members = await supabaseService.getCircleMembers(circleId);
      return { success: true, data: members };
    } else {
      throw new Error('Circles not implemented in custom backend');
    }
  }

  // Following methods
  async followUser(userId: string) {
    if (isSupabaseBackend()) {
      await supabaseService.followUser(userId);
      return { success: true };
    } else {
      throw new Error('Following not implemented in custom backend');
    }
  }

  async unfollowUser(userId: string) {
    if (isSupabaseBackend()) {
      await supabaseService.unfollowUser(userId);
      return { success: true };
    } else {
      throw new Error('Following not implemented in custom backend');
    }
  }

  async getFollowing() {
    if (isSupabaseBackend()) {
      const following = await supabaseService.getFollowing();
      return { success: true, data: following };
    } else {
      throw new Error('Following not implemented in custom backend');
    }
  }

  async getFollowers() {
    if (isSupabaseBackend()) {
      const followers = await supabaseService.getFollowers();
      return { success: true, data: followers };
    } else {
      throw new Error('Following not implemented in custom backend');
    }
  }
}

export const backendService = new BackendService();