import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { CheckCircle2, House, BarChart3, User2 } from 'lucide-react-native';

import { useStore } from './state/rootStore';
import { LoginScreen } from './features/auth/LoginScreen';
import { DailyScreen } from './features/daily/DailyScreen';
import { SocialScreen } from './features/social/SocialScreen';
import { ProgressMVPEnhanced } from './features/progress/ProgressMVPEnhanced';
import { ProfileEnhanced } from './features/profile/ProfileEnhanced';
import { OnboardingFlow } from './features/onboarding/OnboardingFlow';
import { ErrorBoundary } from './components/ErrorBoundary';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabs() {
  const { fetchGoals, fetchDailyActions, fetchFeeds } = useStore();
  
  // Fetch data when tabs mount
  useEffect(() => {
    fetchGoals();
    fetchDailyActions();
    fetchFeeds();
  }, []);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarBackground: () => (
          <BlurView intensity={80} tint="dark" style={{ flex: 1 }}>
            <LinearGradient
              colors={['rgba(255,215,0,0.1)', 'rgba(192,192,192,0.05)', 'rgba(255,215,0,0.1)']}
              style={{ flex: 1 }}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </BlurView>
        ),
        tabBarStyle: { 
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          height: 70,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.5)',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen name="Social" component={SocialScreen}
        options={{ 
          tabBarIcon: ({color,size,focused}) => (
            <View style={{
              padding: 8,
              borderRadius: 16,
              backgroundColor: focused ? 'rgba(192,192,192,0.15)' : 'transparent',
            }}>
              <House color={focused ? '#C0C0C0' : color} size={size}/>
            </View>
          )
        }} />
      <Tab.Screen name="Daily" component={DailyScreen}
        options={{ 
          tabBarIcon: ({color,size,focused}) => (
            <View style={{
              padding: 8,
              borderRadius: 16,
              backgroundColor: focused ? 'rgba(255,215,0,0.15)' : 'transparent',
            }}>
              <CheckCircle2 color={focused ? '#FFD700' : color} size={size}/>
            </View>
          )
        }} />
      <Tab.Screen name="Progress" component={ProgressMVPEnhanced}
        options={{ 
          tabBarIcon: ({color,size,focused}) => (
            <View style={{
              padding: 8,
              borderRadius: 16,
              backgroundColor: focused ? 'rgba(229,228,226,0.15)' : 'transparent',
            }}>
              <BarChart3 color={focused ? '#E5E4E2' : color} size={size}/>
            </View>
          )
        }} />
      <Tab.Screen name="Profile" component={ProfileEnhanced}
        options={{ 
          tabBarIcon: ({color,size,focused}) => (
            <View style={{
              padding: 8,
              borderRadius: 16,
              backgroundColor: focused ? 'rgba(255,215,0,0.15)' : 'transparent',
            }}>
              <User2 color={focused ? '#FFD700' : color} size={size}/>
            </View>
          )
        }} />
    </Tab.Navigator>
  );
}

export function AppWithAuth() {
  const { isAuthenticated, checkAuth, isOnboardingOpen, closeOnboarding } = useStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      await checkAuth();
      setIsLoading(false);
    };
    initAuth();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {isAuthenticated ? (
            <Stack.Screen name="Main" component={MainTabs} />
          ) : (
            <Stack.Screen name="Login" component={LoginScreen} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
      
      {/* Onboarding Overlay - using absolute positioning instead of Modal */}
      {isOnboardingOpen && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#000',
          zIndex: 9999,
        }}>
          <ErrorBoundary>
            <OnboardingFlow onComplete={closeOnboarding} />
          </ErrorBoundary>
        </View>
      )}
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F9FC',
  },
});