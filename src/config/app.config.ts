// App Configuration
// Switch between different backend implementations

export const AppConfig = {
  // Set to 'supabase' to use Supabase BaaS
  // Set to 'custom' to use custom Node.js backend
  backend: 'custom' as 'supabase' | 'custom',
  
  // Supabase configuration
  supabase: {
    url: 'https://ojusijzhshvviqjeyhyn.supabase.co',
    // TODO: Add your anon key here
    anonKey: 'YOUR_SUPABASE_ANON_KEY',
  },
  
  // Custom backend configuration
  customBackend: {
    url: 'http://localhost:3001',
  },
};

// Helper to check which backend is active
export const isSupabaseBackend = () => AppConfig.backend === 'supabase';
export const isCustomBackend = () => AppConfig.backend === 'custom';