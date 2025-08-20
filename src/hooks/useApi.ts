import { useState, useCallback } from 'react';
import { apiService } from '../services/api.service';

export function useApi<T = any>(
  apiFunction: (...args: any[]) => Promise<any>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(
    async (...args: any[]) => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiFunction(...args);
        setData(response.data || response);
        return response;
      } catch (err: any) {
        const errorMessage = err.message || 'An error occurred';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    loading,
    error,
    data,
    execute,
    reset,
  };
}

// Specific hooks for common operations
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiService.login(email, password);
    if (result.success) {
      setIsAuthenticated(true);
    }
    return result;
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const result = await apiService.register(email, password, name);
    if (result.success) {
      setIsAuthenticated(true);
    }
    return result;
  }, []);

  const logout = useCallback(async () => {
    await apiService.logout();
    setIsAuthenticated(false);
  }, []);

  return {
    isAuthenticated,
    login,
    register,
    logout,
  };
}

export function useGoals() {
  const { loading, error, data, execute } = useApi(apiService.getGoals.bind(apiService));

  return {
    goals: data,
    loading,
    error,
    fetchGoals: execute,
    createGoal: apiService.createGoal.bind(apiService),
    updateGoal: apiService.updateGoal.bind(apiService),
    deleteGoal: apiService.deleteGoal.bind(apiService),
  };
}

export function useDailyActions() {
  const { loading, error, data, execute } = useApi(apiService.getDailyActions.bind(apiService));

  return {
    actions: data,
    loading,
    error,
    fetchActions: execute,
    createAction: apiService.createAction.bind(apiService),
    completeAction: apiService.completeAction.bind(apiService),
  };
}