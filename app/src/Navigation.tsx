import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from './theme';

import DashboardScreen from './screens/DashboardScreen';
import RecordingScreen from './screens/RecordingScreen';
import LibraryScreen from './screens/LibraryScreen';
import TranscriptScreen from './screens/TranscriptScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function RecordButton({ focused }: { focused: boolean }) {
  return (
    <View style={[styles.recordTab, focused && styles.recordTabActive]}>
      <Ionicons name="mic" size={24} color={focused ? Colors.secondary : Colors.onSurfaceVariant} />
    </View>
  );
}

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.secondary,
        tabBarInactiveTintColor: Colors.onSurfaceVariant,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Library"
        component={LibraryScreen}
        options={{
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="folder-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Record"
        component={RecordingScreen}
        options={{
          tabBarIcon: ({ focused }) => <RecordButton focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Insights"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="analytics-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Account"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
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
    paddingBottom: 10,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  recordTab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  recordTabActive: {
    backgroundColor: Colors.secondary + '20',
  },
});
