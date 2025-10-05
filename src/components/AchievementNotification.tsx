import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';
import { Achievement } from '../types/types';

interface AchievementNotificationProps {
  achievement: Achievement;
  visible: boolean;
  onHide: () => void;
}

const { width } = Dimensions.get('window');

const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  achievement,
  visible,
  onHide
}) => {
  const slideAnim = useRef(new Animated.Value(-200)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: -200,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => onHide());
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return ['#6b7280', '#9ca3af'];
      case 'uncommon': return ['#10b981', '#34d399'];
      case 'rare': return ['#3b82f6', '#60a5fa'];
      case 'epic': return ['#8b5cf6', '#a78bfa'];
      case 'legendary': return ['#f59e0b', '#fbbf24'];
      default: return ['#6b7280', '#9ca3af'];
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: fadeAnim,
        },
      ]}
    >
      <LinearGradient
        colors={getRarityColor(achievement.rarity)}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{achievement.icon}</Text>
            <View style={styles.sparkle}>
              <Text style={styles.sparkleText}>✨</Text>
            </View>
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.achievementText}>Achievement Unlocked!</Text>
            <Text style={styles.title}>{achievement.title}</Text>
            <Text style={styles.points}>+{achievement.points} points</Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  gradient: {
    borderRadius: 16,
    padding: 16,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  icon: {
    fontSize: 24,
  },
  sparkle: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  sparkleText: {
    fontSize: 16,
  },
  textContainer: {
    flex: 1,
  },
  achievementText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textOnPrimary,
    marginVertical: 2,
  },
  points: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
});

export default AchievementNotification;
