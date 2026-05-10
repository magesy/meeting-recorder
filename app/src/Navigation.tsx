import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Colors, Radius } from './theme';

import DashboardScreen from './screens/DashboardScreen';
import RecordingScreen from './screens/RecordingScreen';
import LibraryScreen from './screens/LibraryScreen';
import TranscriptScreen from './screens/TranscriptScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={[styles.tabItem, focused && styles.tabItemActive]}>
      <Text style={styles.tabEmoji}>{emoji}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Home" focused={focused} /> }}
      />
      <Tab.Screen
        name="Library"
        component={LibraryScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📁" label="Library" focused={focused} /> }}
      />
      <Tab.Screen
        name="Record"
        component={RecordingScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🎙" label="Record" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={HomeTabs} />
        <Stack.Screen name="Transcript" component={TranscriptScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: '#e4e2e3',
    height: 70,
    paddingBottom: 8,
  },
  tabItem: { alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.md },
  tabItemActive: { backgroundColor: Colors.secondary + '15' },
  tabEmoji: { fontSize: 20 },
  tabLabel: { fontSize: 11, color: Colors.onSurfaceVariant, marginTop: 2 },
  tabLabelActive: { color: Colors.secondary, fontWeight: '600' },
});
