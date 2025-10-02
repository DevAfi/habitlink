// src/navigation/MainNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import HomeScreen from '../screens/HomeScreen';
import FeedScreen from '../screens/FeedScreen';
import FriendsScreen from '../screens/FriendsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { theme } from '../utils/theme';

export type MainTabParamList = {
  Home: undefined;
  Feed: undefined;
  Friends: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

// Custom Tab Icon Component
const TabIcon = ({ 
  icon, 
  label, 
  focused, 
  badge 
}: { 
  icon: string; 
  label: string; 
  focused: boolean; 
  badge?: number; 
}) => (
  <View style={styles.tabIconContainer}>
    {focused ? (
      <LinearGradient
        colors={theme.gradients.primary}
        style={styles.tabIconGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.tabIconText}>{icon}</Text>
      </LinearGradient>
    ) : (
      <View style={styles.tabIconUnfocused}>
        <Text style={styles.tabIconTextUnfocused}>{icon}</Text>
      </View>
    )}
    <Text style={[
      styles.tabLabel,
      focused && styles.tabLabelFocused
    ]}>
      {label}
    </Text>
    {badge && badge > 0 && (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{badge}</Text>
      </View>
    )}
  </View>
);

const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          <LinearGradient
            colors={[theme.colors.surface, theme.colors.backgroundSecondary]}
            style={styles.tabBarBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
        ),
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon 
              icon="🏠" 
              label="Home" 
              focused={focused} 
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Feed" 
        component={FeedScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon 
              icon="📱" 
              label="Feed" 
              focused={focused} 
              badge={3}
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Friends" 
        component={FriendsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon 
              icon="👥" 
              label="Friends" 
              focused={focused} 
              badge={2}
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon 
              icon="👤" 
              label="Profile" 
              focused={focused} 
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    height: 90,
    paddingTop: 8,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderTopWidth: 0,
    elevation: 20,
    shadowColor: theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  tabBarBackground: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabIconGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    ...theme.shadows.md,
  },
  tabIconUnfocused: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    backgroundColor: theme.colors.accent,
  },
  tabIconText: {
    fontSize: 20,
  },
  tabIconTextUnfocused: {
    fontSize: 20,
    opacity: 0.7,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  tabLabelFocused: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: 8,
    backgroundColor: theme.colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  badgeText: {
    color: theme.colors.textOnPrimary,
    fontSize: 10,
    fontWeight: theme.fontWeight.bold,
  },
});

export default MainNavigator;