import React from 'react';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const PlaceholderScreen = ({ name }: { name: string }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: 18, color: '#6b7280' }}>{name} - Coming Soon</Text>
  </View>
);

const HomeScreen = () => <PlaceholderScreen name="Home" />;
const FeedScreen = () => <PlaceholderScreen name="Feed" />;
const FriendsScreen = () => <PlaceholderScreen name="Friends" />;
const ProfileScreen = () => <PlaceholderScreen name="Profile" />;

export type MainTabParamList = {
  Home: undefined;
  Feed: undefined;
  Friends: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#10b981',
        tabBarInactiveTintColor: '#9ca3af',
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'My Habits' }} />
      <Tab.Screen name="Feed" component={FeedScreen} options={{ title: 'Activity Feed' }} />
      <Tab.Screen name="Friends" component={FriendsScreen} options={{ title: 'Friends' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
};

export default MainNavigator;