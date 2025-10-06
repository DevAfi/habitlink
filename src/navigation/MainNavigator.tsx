// src/navigation/MainNavigator.tsx
import React, { useState } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { TouchableOpacity, Text, Alert } from "react-native";
import { useAuth } from "../context/AuthContext";
import HomeScreen from "../screens/habit/HomeScreen";
import FeedScreen from "../screens/FeedScreen";
import FriendsScreen from "../screens/FriendsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import AchievementsScreen from "../screens/AchievementsScreen";
import { theme } from "../utils/theme";

export type MainTabParamList = {
  Home: undefined;
  Feed: undefined;
  Friends: undefined;
  Achievements: undefined;
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
  const [signingOut, setSigningOut] = useState(false);
  
  const handleLogout = () => {
    console.log('🚪 Header LogoutButton handleLogout called!');
    
    // Try browser confirm first (works better in web)
    if (typeof window !== 'undefined' && window.confirm) {
      console.log('🌐 Using browser confirm dialog');
      const confirmed = window.confirm('Are you sure you want to sign out?');
      console.log('🤔 User confirmed:', confirmed);
      
      if (confirmed) {
        console.log('✅ Header sign out confirmed via browser confirm');
        performSignOut();
      } else {
        console.log('❌ Header sign out cancelled via browser confirm');
      }
      return;
    }
    
    // Fallback to Alert.alert
    console.log('📱 Using React Native Alert.alert');
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => console.log('❌ Header sign out cancelled via Alert')
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            console.log('✅ Header sign out confirmed via Alert');
            performSignOut();
          },
        },
      ]
    );
  };

  const performSignOut = async () => {
    try {
      console.log('✅ Header sign out confirmed, calling signOut function...');
      setSigningOut(true);
      await signOut();
      console.log('✅ Header sign out completed successfully');
    } catch (error) {
      console.error('❌ Header sign out failed:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={() => {
        console.log('🔥 Header button TouchableOpacity pressed!');
        handleLogout();
      }}
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
        {signingOut ? '⏳ Signing Out...' : '🚪 Sign Out'}
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
        name="Achievements"
        component={AchievementsScreen}
        options={{
          title: "Achievements",
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
