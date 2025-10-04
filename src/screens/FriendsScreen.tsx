// src/screens/FriendsScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Animated,
  Dimensions,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../utils/theme";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../services/supabaseClient";

const { width, height } = Dimensions.get('window');

interface Friend {
  id: string;
  username: string;
  full_name: string;
  created_at: string;
  total_habits: number;
  total_completions: number;
  current_streak: number;
  longest_streak: number;
  is_friend: boolean;
  friendship_id?: string;
}

interface FriendRequest {
  id: string;
  from_user: Friend;
  to_user: Friend;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

const FriendsScreen = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'discover'>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];
  const glowAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    fetchFriendsData();
    
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous glow animation
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );
    glowAnimation.start();

    return () => glowAnimation.stop();
  }, []);

  const fetchFriendsData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch friends with stats (all friendships are accepted in your schema)
      const { data: friendsData, error: friendsError } = await supabase
        .from('friendships')
        .select(`
          id,
          friend_id,
          user_id,
          created_at
        `)
        .eq('user_id', user.id);

      if (friendsError) throw friendsError;

      // Also fetch friendships where user is the friend
      const { data: reverseFriendsData, error: reverseFriendsError } = await supabase
        .from('friendships')
        .select(`
          id,
          user_id,
          friend_id,
          created_at
        `)
        .eq('friend_id', user.id);

      if (reverseFriendsError) throw reverseFriendsError;

      // Fetch ALL users for discover section (excluding current user)
      const { data: suggestedData, error: suggestedError } = await supabase
        .from('users')
        .select('*')
        .neq('id', user.id);

      if (suggestedError) throw suggestedError;

      // Process friends data with stats (combine both directions)
      const allFriendships = [...(friendsData || []), ...(reverseFriendsData || [])];
      const uniqueFriendIds = [...new Set(allFriendships.map(f => f.friend_id === user.id ? f.user_id : f.friend_id))];
      
      const processedFriends = await Promise.all(
        uniqueFriendIds.map(async (friendId) => {
          // Fetch friend user data
          const { data: friendData } = await supabase
            .from('users')
            .select('*')
            .eq('id', friendId)
            .single();
          
          const stats = await getUserStats(friendId);
          const friendship = allFriendships.find(f => 
            (f.user_id === user.id && f.friend_id === friendId) ||
            (f.friend_id === user.id && f.user_id === friendId)
          );
          
          return {
            id: friendData?.id || friendId,
            username: friendData?.username || 'Unknown',
            full_name: friendData?.fullname || 'Unknown User',
            created_at: friendData?.created_at || new Date().toISOString(),
            ...stats,
            is_friend: true,
            friendship_id: friendship?.id,
          };
        })
      );

      // No friend requests in your schema (all friendships are accepted immediately)
      const processedRequests: FriendRequest[] = [];

      // Process suggested users with stats (exclude current friends)
      const friendIds = new Set(processedFriends.map(f => f.id));
      const suggestedUsers = (suggestedData || []).filter(user => !friendIds.has(user.id));
      
      const processedSuggested = await Promise.all(
        suggestedUsers.map(async (suggestedUser) => {
          const stats = await getUserStats(suggestedUser.id);
          return {
            id: suggestedUser.id,
            username: suggestedUser.username,
            full_name: suggestedUser.fullname,
            created_at: suggestedUser.created_at,
            ...stats,
            is_friend: false,
          };
        })
      );

      setFriends(processedFriends);
      setFriendRequests(processedRequests);
      setSuggestedUsers(processedSuggested);

    } catch (error) {
      console.error('Error fetching friends data:', error);
      Alert.alert('Error', 'Failed to load friends data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getUserStats = async (userId: string) => {
    try {
      // Get habits count
      const { count: habitsCount } = await supabase
        .from('habits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Get completions count
      const { count: completionsCount } = await supabase
        .from('completions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Calculate current streak (simplified)
      const { data: recentCompletions } = await supabase
        .from('completions')
        .select('completed_at')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(30);

      let currentStreak = 0;
      if (recentCompletions && recentCompletions.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let i = 0; i < 30; i++) {
          const checkDate = new Date(today);
          checkDate.setDate(today.getDate() - i);
          const dateStr = checkDate.toISOString().split('T')[0];
          
          const hasCompletion = recentCompletions.some(c => 
            c.completed_at.startsWith(dateStr)
          );
          
          if (hasCompletion) {
            currentStreak++;
          } else if (i > 0) {
            break;
          }
        }
      }

      return {
        total_habits: habitsCount || 0,
        total_completions: completionsCount || 0,
        current_streak: currentStreak,
        longest_streak: Math.floor(Math.random() * 50) + 5, // Placeholder for demo
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return {
        total_habits: 0,
        total_completions: 0,
        current_streak: 0,
        longest_streak: 0,
      };
    }
  };

  const sendFriendRequest = async (friendId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('friendships')
        .insert({
          user_id: user.id,
          friend_id: friendId,
        });

      if (error) throw error;

      Alert.alert('Success', 'Friend added!');
      fetchFriendsData();
    } catch (error) {
      console.error('Error adding friend:', error);
      Alert.alert('Error', 'Failed to add friend');
    }
  };

  const respondToFriendRequest = async (requestId: string, status: 'accepted' | 'rejected') => {
    // This function is not needed in your schema since all friendships are accepted immediately
    // But keeping it for interface compatibility
    console.log('Friend requests are automatically accepted in this schema');
  };

  const removeFriend = async (friendshipId: string) => {
    Alert.alert(
      'Remove Friend',
      'Are you sure you want to remove this friend?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('friendships')
                .delete()
                .eq('id', friendshipId);

              if (error) throw error;

              Alert.alert('Success', 'Friend removed');
              fetchFriendsData();
            } catch (error) {
              console.error('Error removing friend:', error);
              Alert.alert('Error', 'Failed to remove friend');
            }
          },
        },
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchFriendsData();
  };

  const filteredFriends = friends.filter(friend =>
    friend.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSuggested = suggestedUsers.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading friends... 👥</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Animated background glow */}
      <Animated.View 
        style={[
          styles.backgroundGlow,
          {
            opacity: glowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.2, 0.4],
            }),
          },
        ]}
      />

      {/* Header with Search */}
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.headerContent}>
          <Text style={styles.title}>👥 Friends</Text>
          <TouchableOpacity 
            onPress={() => setShowSearch(!showSearch)}
            style={styles.searchButton}
          >
            <Text style={styles.searchIcon}>🔍</Text>
          </TouchableOpacity>
        </View>
        
        {showSearch && (
          <Animated.View 
            style={[
              styles.searchContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <TextInput
              style={styles.searchInput}
              placeholder="Search friends..."
              placeholderTextColor={theme.colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </Animated.View>
        )}
      </Animated.View>

      {/* Tab Navigation */}
      <Animated.View 
        style={[
          styles.tabContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
            onPress={() => setActiveTab('friends')}
          >
            <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
              Friends ({friends.length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
            onPress={() => setActiveTab('requests')}
          >
            <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
              Requests ({friendRequests.length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'discover' && styles.activeTab]}
            onPress={() => setActiveTab('discover')}
          >
            <Text style={[styles.tabText, activeTab === 'discover' && styles.activeTabText]}>
              Discover
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Friends Tab */}
        {activeTab === 'friends' && (
          <Animated.View 
            style={[
              styles.tabContent,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {filteredFriends.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>👥</Text>
                <Text style={styles.emptyTitle}>No Friends Yet</Text>
                <Text style={styles.emptySubtitle}>
                  Start by discovering people and sending friend requests!
                </Text>
                <TouchableOpacity 
                  style={styles.discoverButton}
                  onPress={() => setActiveTab('discover')}
                >
                  <LinearGradient
                    colors={theme.gradients.purple as [string, string, ...string[]]}
                    style={styles.discoverButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.discoverButtonText}>🔍 Discover People</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.friendsList}>
                {filteredFriends.map((friend, index) => (
                  <Animated.View
                    key={friend.id}
                    style={[
                      styles.friendCard,
                      {
                        transform: [
                          {
                            translateY: slideAnim.interpolate({
                              inputRange: [0, 30],
                              outputRange: [0, 10 + index * 5],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <View style={styles.friendInfo}>
                      <View style={styles.friendAvatar}>
                        <Text style={styles.friendAvatarText}>
                          {friend.username.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.friendDetails}>
                        <Text style={styles.friendName}>{friend.full_name}</Text>
                        <Text style={styles.friendUsername}>@{friend.username}</Text>
                        <View style={styles.friendStats}>
                          <View style={styles.statItem}>
                            <Text style={styles.statValue}>{friend.total_habits}</Text>
                            <Text style={styles.statLabel}>Habits</Text>
                          </View>
                          <View style={styles.statItem}>
                            <Text style={styles.statValue}>{friend.current_streak}</Text>
                            <Text style={styles.statLabel}>Streak</Text>
                          </View>
                          <View style={styles.statItem}>
                            <Text style={styles.statValue}>{friend.total_completions}</Text>
                            <Text style={styles.statLabel}>Total</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeFriend(friend.friendship_id!)}
                    >
                      <Text style={styles.removeButtonText}>🗑️</Text>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            )}
          </Animated.View>
        )}

        {/* Friend Requests Tab */}
        {activeTab === 'requests' && (
          <Animated.View 
            style={[
              styles.tabContent,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {friendRequests.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📨</Text>
                <Text style={styles.emptyTitle}>No Friend Requests</Text>
                <Text style={styles.emptySubtitle}>
                  When people send you friend requests, they'll appear here.
                </Text>
              </View>
            ) : (
              <View style={styles.requestsList}>
                {friendRequests.map((request, index) => (
                  <Animated.View
                    key={request.id}
                    style={[
                      styles.requestCard,
                      {
                        transform: [
                          {
                            translateY: slideAnim.interpolate({
                              inputRange: [0, 30],
                              outputRange: [0, 10 + index * 5],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <View style={styles.requestInfo}>
                      <View style={styles.requestAvatar}>
                        <Text style={styles.requestAvatarText}>
                          {request.from_user.username.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.requestDetails}>
                        <Text style={styles.requestName}>{request.from_user.full_name}</Text>
                        <Text style={styles.requestUsername}>@{request.from_user.username}</Text>
                        <Text style={styles.requestDate}>
                          {new Date(request.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.requestActions}>
                      <TouchableOpacity
                        style={styles.acceptButton}
                        onPress={() => respondToFriendRequest(request.id, 'accepted')}
                      >
                        <Text style={styles.acceptButtonText}>✓</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.rejectButton}
                        onPress={() => respondToFriendRequest(request.id, 'rejected')}
                      >
                        <Text style={styles.rejectButtonText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </Animated.View>
                ))}
              </View>
            )}
          </Animated.View>
        )}

        {/* Discover Tab */}
        {activeTab === 'discover' && (
          <Animated.View 
            style={[
              styles.tabContent,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.discoverList}>
              {filteredSuggested.map((user, index) => (
                <Animated.View
                  key={user.id}
                  style={[
                    styles.discoverCard,
                    {
                      transform: [
                        {
                          translateY: slideAnim.interpolate({
                            inputRange: [0, 30],
                            outputRange: [0, 10 + index * 5],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <View style={styles.discoverInfo}>
                    <View style={styles.discoverAvatar}>
                      <Text style={styles.discoverAvatarText}>
                        {user.username.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.discoverDetails}>
                      <Text style={styles.discoverName}>{user.full_name}</Text>
                      <Text style={styles.discoverUsername}>@{user.username}</Text>
                      <View style={styles.discoverStats}>
                        <View style={styles.discoverStatItem}>
                          <Text style={styles.discoverStatValue}>{user.total_habits}</Text>
                          <Text style={styles.discoverStatLabel}>Habits</Text>
                        </View>
                        <View style={styles.discoverStatItem}>
                          <Text style={styles.discoverStatValue}>{user.current_streak}</Text>
                          <Text style={styles.discoverStatLabel}>Streak</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => sendFriendRequest(user.id)}
                  >
                    <Text style={styles.addButtonText}>+</Text>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  backgroundGlow: {
    position: 'absolute',
    width: width * 1.2,
    height: height * 1.2,
    borderRadius: (width * 1.2) / 2,
    backgroundColor: theme.colors.primary,
    top: -height * 0.1,
    left: -width * 0.1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    fontSize: 18,
    color: theme.colors.textLight,
    fontWeight: '600',
  },

  // Header
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchIcon: {
    fontSize: 18,
  },
  searchContainer: {
    marginTop: theme.spacing.md,
  },
  searchInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: 16,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  // Tabs
  tabContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textLight,
  },
  activeTabText: {
    color: theme.colors.textOnPrimary,
  },

  // Content
  scrollView: {
    flex: 1,
  },
  tabContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },

  // Empty States
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.textLight,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  discoverButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  discoverButtonGradient: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
  },
  discoverButtonText: {
    color: theme.colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '700',
  },

  // Friends List
  friendsList: {
    gap: theme.spacing.md,
  },
  friendCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  friendAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  friendUsername: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.sm,
  },
  friendStats: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 10,
    color: theme.colors.textLight,
    textTransform: 'uppercase',
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  removeButtonText: {
    fontSize: 16,
  },

  // Friend Requests
  requestsList: {
    gap: theme.spacing.md,
  },
  requestCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  requestAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  requestAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  requestDetails: {
    flex: 1,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  requestUsername: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginBottom: 2,
  },
  requestDate: {
    fontSize: 10,
    color: theme.colors.textSecondary,
  },
  requestActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  acceptButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: 18,
    color: theme.colors.textOnPrimary,
    fontWeight: '700',
  },
  rejectButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButtonText: {
    fontSize: 18,
    color: theme.colors.textOnPrimary,
    fontWeight: '700',
  },

  // Discover
  discoverList: {
    gap: theme.spacing.md,
  },
  discoverCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  discoverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  discoverAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  discoverAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  discoverDetails: {
    flex: 1,
  },
  discoverName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  discoverUsername: {
    fontSize: 12,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.sm,
  },
  discoverStats: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  discoverStatItem: {
    alignItems: 'center',
  },
  discoverStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  discoverStatLabel: {
    fontSize: 10,
    color: theme.colors.textLight,
    textTransform: 'uppercase',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 20,
    color: theme.colors.textOnPrimary,
    fontWeight: '700',
  },
});

export default FriendsScreen;
