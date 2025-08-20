import React, { useState } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { CheckCircle2, House, BarChart3, User2 } from 'lucide-react-native';
import { DailyScreen } from './src/features/daily/DailyScreen';
import { SocialScreen } from './src/features/social/SocialScreen';
import { ProgressMVPEnhanced } from './src/features/progress/ProgressMVPEnhanced';
import { ProfileEnhanced } from './src/features/profile/ProfileEnhanced';
import { OnboardingFlow } from './src/features/onboarding';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: 'transparent', card: 'transparent', text: '#FFFFFF', border: 'transparent' },
};

const MainTabs = () => {
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
};

export const RootNav = () => {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(
    () => localStorage.getItem('onboarding_completed') === 'true'
  );

  // Quick reset with 'R' key for development
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        localStorage.removeItem('onboarding_completed');
        localStorage.removeItem('onboarding_milestones');
        setHasCompletedOnboarding(false);
      }
    };
    
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, []);

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!hasCompletedOnboarding ? (
          <Stack.Screen name="Onboarding">
            {() => (
              <OnboardingFlow 
                onComplete={() => setHasCompletedOnboarding(true)} 
              />
            )}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Main" component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};