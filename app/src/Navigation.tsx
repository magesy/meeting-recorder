import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
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
          tabBarIcon: ({ color }) => (
            <View style={[styles.recordBtn, { backgroundColor: color === Colors.secondary ? Colors.secondary + '20' : Colors.surfaceContainerLow }]}>
              <Ionicons name="mic" size={24} color={color} />
            </View>
          ),
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
    height: Platform.OS === 'android' ? 60 : 80,
    paddingBottom: Platform.OS === 'android' ? 8 : 20,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  recordBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
