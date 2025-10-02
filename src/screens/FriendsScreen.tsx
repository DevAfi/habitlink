// src/screens/FriendsScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';

const { width } = Dimensions.get('window');

interface Friend {
  id: string;
  name: string;
  username: string;
  avatar: string;
  status: 'online' | 'offline' | 'away';
  habits: number;
  streak: number;
  mutualFriends: number;
  isFriend: boolean;
}

const FriendsScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'discover'>('friends');

  const friends: Friend[] = [
    {
      id: '1',
      name: 'Alex Johnson',
      username: 'alexj',
      avatar: 'AJ',
      status: 'online',
      habits: 5,
      streak: 12,
      mutualFriends: 3,
      isFriend: true,
    },
    {
      id: '2',
      name: 'Sarah Chen',
      username: 'sarahc',
      avatar: 'SC',
      status: 'away',
      habits: 8,
      streak: 25,
      mutualFriends: 5,
      isFriend: true,
    },
    {
      id: '3',
      name: 'Mike Rodriguez',
      username: 'miker',
      avatar: 'MR',
      status: 'offline',
      habits: 3,
      streak: 7,
      mutualFriends: 2,
      isFriend: true,
    },
  ];

  const friendRequests: Friend[] = [
    {
      id: '4',
      name: 'Emma Wilson',
      username: 'emmaw',
      avatar: 'EW',
      status: 'online',
      habits: 6,
      streak: 15,
      mutualFriends: 4,
      isFriend: false,
    },
    {
      id: '5',
      name: 'David Kim',
      username: 'davidk',
      avatar: 'DK',
      status: 'offline',
      habits: 4,
      streak: 8,
      mutualFriends: 1,
      isFriend: false,
    },
  ];

  const discoverUsers: Friend[] = [
    {
      id: '6',
      name: 'Lisa Park',
      username: 'lisap',
      avatar: 'LP',
      status: 'online',
      habits: 7,
      streak: 20,
      mutualFriends: 2,
      isFriend: false,
    },
    {
      id: '7',
      name: 'Tom Anderson',
      username: 'toma',
      avatar: 'TA',
      status: 'away',
      habits: 5,
      streak: 18,
      mutualFriends: 3,
      isFriend: false,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return theme.colors.success;
      case 'away':
        return theme.colors.warning;
      case 'offline':
        return theme.colors.textLight;
      default:
        return theme.colors.textLight;
    }
  };

  const FriendCard = ({ friend, showActions = false }: { friend: Friend; showActions?: boolean }) => (
    <View style={styles.friendCard}>
      <View style={styles.friendHeader}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{friend.avatar}</Text>
          </View>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(friend.status) }]} />
        </View>
        
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{friend.name}</Text>
          <Text style={styles.friendUsername}>@{friend.username}</Text>
          <View style={styles.friendStats}>
            <Text style={styles.statText}>{friend.habits} habits</Text>
            <Text style={styles.statDivider}>•</Text>
            <Text style={styles.statText}>{friend.streak} day streak</Text>
            {friend.mutualFriends > 0 && (
              <>
                <Text style={styles.statDivider}>•</Text>
                <Text style={styles.statText}>{friend.mutualFriends} mutual</Text>
              </>
            )}
          </View>
        </View>

        {showActions && (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.acceptButton} activeOpacity={0.8}>
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.declineButton} activeOpacity={0.8}>
              <Text style={styles.declineButtonText}>Decline</Text>
            </TouchableOpacity>
          </View>
        )}

        {!showActions && !friend.isFriend && (
          <TouchableOpacity style={styles.addButton} activeOpacity={0.8}>
            <LinearGradient
              colors={theme.gradients.primary}
              style={styles.addButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const TabButton = ({ 
    title, 
    isActive, 
    onPress 
  }: { 
    title: string; 
    isActive: boolean; 
    onPress: () => void; 
  }) => (
    <TouchableOpacity 
      style={[styles.tabButton, isActive && styles.tabButtonActive]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const getCurrentData = () => {
    switch (activeTab) {
      case 'friends':
        return friends;
      case 'requests':
        return friendRequests;
      case 'discover':
        return discoverUsers;
      default:
        return friends;
    }
  };

  const getTabCount = () => {
    switch (activeTab) {
      case 'friends':
        return friends.length;
      case 'requests':
        return friendRequests.length;
      case 'discover':
        return discoverUsers.length;
      default:
        return 0;
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Friends</Text>
        <Text style={styles.subtitle}>Connect and stay motivated together</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search friends..."
            placeholderTextColor={theme.colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TabButton
          title={`Friends (${friends.length})`}
          isActive={activeTab === 'friends'}
          onPress={() => setActiveTab('friends')}
        />
        <TabButton
          title={`Requests (${friendRequests.length})`}
          isActive={activeTab === 'requests'}
          onPress={() => setActiveTab('requests')}
        />
        <TabButton
          title="Discover"
          isActive={activeTab === 'discover'}
          onPress={() => setActiveTab('discover')}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {getCurrentData().length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>No {activeTab} found</Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'friends' && "You haven't added any friends yet"}
              {activeTab === 'requests' && "No pending friend requests"}
              {activeTab === 'discover' && "No users to discover right now"}
            </Text>
          </View>
        ) : (
          getCurrentData().map((friend) => (
            <FriendCard 
              key={friend.id} 
              friend={friend} 
              showActions={activeTab === 'requests'} 
            />
          ))
        )}
      </View>

      {/* Quick Actions */}
      {activeTab === 'discover' && (
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionButton} activeOpacity={0.8}>
            <LinearGradient
              colors={theme.gradients.primary}
              style={styles.quickActionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.quickActionIcon}>👥</Text>
              <Text style={styles.quickActionText}>Find Friends</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.base,
    color: theme.colors.textLight,
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.fontSize.base,
    color: theme.colors.text,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  tabButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginHorizontal: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  tabButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  tabButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
  tabButtonTextActive: {
    color: theme.colors.textOnPrimary,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
  },
  friendCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  friendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: theme.spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textOnPrimary,
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: theme.borderRadius.full,
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  friendUsername: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  friendStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textLight,
  },
  statDivider: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textLight,
    marginHorizontal: theme.spacing.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  acceptButton: {
    backgroundColor: theme.colors.success,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  acceptButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textOnPrimary,
  },
  declineButton: {
    backgroundColor: theme.colors.error,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  declineButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textOnPrimary,
  },
  addButton: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  addButtonGradient: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  addButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textOnPrimary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  emptySubtitle: {
    fontSize: theme.fontSize.base,
    color: theme.colors.textLight,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  quickActions: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  quickActionButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  quickActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  quickActionIcon: {
    fontSize: 20,
    marginRight: theme.spacing.sm,
  },
  quickActionText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textOnPrimary,
  },
});

export default FriendsScreen;