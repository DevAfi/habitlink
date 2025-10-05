// src/navigation/MainNavigator.tsx
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { TouchableOpacity, Text, Alert } from "react-native";
import { useAuth } from "../context/AuthContext";
import HomeScreen from "../screens/habit/HomeScreen";
import FeedScreen from "../screens/FeedScreen";
import FriendsScreen from "../screens/FriendsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import { theme } from "../utils/theme";

export type MainTabParamList = {
  Home: undefined;
  Feed: undefined;
  Friends: undefined;
  Profile: undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  Notifications: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Logout button component for header
const LogoutButton = () => {
  const { signOut } = useAuth();
  
  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: signOut,
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      onPress={handleLogout}
      style={{
        marginRight: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}
      activeOpacity={0.7}
    >
      <Text style={{ 
        color: theme.colors.text, 
        fontSize: 14, 
        fontWeight: '600' 
      }}>
        🚪 Sign Out
      </Text>
    </TouchableOpacity>
  );
};

const ProfileStack = () => {
  return (
    <Stack.Navigator 
      id={undefined}
      screenOptions={{ 
        headerShown: true,
        headerStyle: {
          backgroundColor: '#0a0e1a', // Dark background
        },
        headerTitleStyle: {
          color: '#f5f5f7', // Light text
          fontSize: 18,
          fontWeight: '600',
        },
        headerTintColor: '#f5f5f7', // Light text for back button
      }}
    >
      <Stack.Screen 
        name="ProfileMain" 
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{ 
          title: 'Notifications',
        }}
      />
    </Stack.Navigator>
  );
};

const MainNavigator = () => {
  return (
    <Tab.Navigator
      id={undefined}
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#0a0e1a', // Dark background
        },
        headerTitleStyle: {
          color: '#f5f5f7', // Light text
          fontSize: 18,
          fontWeight: '600',
        },
        headerTintColor: '#f5f5f7', // Light text for back button
        tabBarStyle: {
          backgroundColor: '#0a0e1a', // Dark background
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#6b5ce7", // Purple accent
        tabBarInactiveTintColor: "#6b7280", // Muted gray
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "My Habits",
          headerRight: () => <LogoutButton />,
        }}
      />
      <Tab.Screen
        name="Feed"
        component={FeedScreen}
        options={{
          title: "Activity Feed",
        }}
      />
      <Tab.Screen
        name="Friends"
        component={FriendsScreen}
        options={{
          title: "Friends",
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          title: "Profile",
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
