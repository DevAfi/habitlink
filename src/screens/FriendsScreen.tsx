// src/screens/FriendsScreen.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../utils/theme";

const FriendsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Friends Screen - Coming Soon</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
  text: {
    fontSize: 18,
    color: theme.colors.textLight,
  },
});

export default FriendsScreen;
