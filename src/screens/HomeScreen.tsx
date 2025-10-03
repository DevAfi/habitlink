// src/screens/HomeScreen.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { theme } from "../utils/theme";
import { useAuth } from "../context/AuthContext";

const HomeScreen = () => {
  const { signOut } = useAuth();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Good morning! 👋</Text>
        <Text style={styles.subtitle}>Let's build some great habits today</Text>
      </View>

      <TouchableOpacity onPress={signOut} style={styles.debugButton}>
        <Text style={styles.debugButtonText}>🚪 Sign Out (Debug)</Text>
      </TouchableOpacity>

      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Home Screen - Coming Soon</Text>
      </View>
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
  greeting: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.base,
    color: theme.colors.textLight,
  },
  debugButton: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.error,
    borderRadius: theme.borderRadius.sm,
    alignItems: "center",
  },
  debugButtonText: {
    color: theme.colors.textOnPrimary,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  placeholderText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.textLight,
  },
});

export default HomeScreen;
