import React from 'react';
import { StatusBar, View } from 'react-native';
import { ThemeProvider } from './providers/ThemeProvider';
import { AppWithAuth } from './src/AppWithAuth';
import { WebContainer } from './src/components/WebContainer';

export default function App() {
  return (
    <ThemeProvider>
      <WebContainer>
        <View style={{ flex:1, backgroundColor:'#000' }}>
          <StatusBar barStyle="light-content" />
          <AppWithAuth />
        </View>
      </WebContainer>
    </ThemeProvider>
  );
}