// src/screens/habit/AddHabitModal.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../utils/theme';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';

// Habit categories with icons and colors
const HABIT_CATEGORIES = [
  { id: 'health', name: 'Health & Fitness', icon: '💪', colors: ['#FF6B6B', '#FF8E8E'] },
  { id: 'mindfulness', name: 'Mindfulness', icon: '🧘', colors: ['#4ECDC4', '#45B7B8'] },
  { id: 'productivity', name: 'Productivity', icon: '⚡', colors: ['#FFD93D', '#FFA726'] },
  { id: 'learning', name: 'Learning', icon: '📚', colors: ['#9B59B6', '#8E44AD'] },
  { id: 'social', name: 'Social', icon: '👥', colors: ['#3498DB', '#2980B9'] },
  { id: 'creative', name: 'Creative', icon: '🎨', colors: ['#E91E63', '#C2185B'] },
  { id: 'personal', name: 'Personal Care', icon: '✨', colors: ['#FF9800', '#F57C00'] },
  { id: 'finance', name: 'Finance', icon: '💰', colors: ['#4CAF50', '#388E3C'] },
  { id: 'home', name: 'Home & Organization', icon: '🏠', colors: ['#795548', '#5D4037'] },
  { id: 'other', name: 'Other', icon: '🌟', colors: ['#607D8B', '#455A64'] },
];

// Habit types with descriptions
const HABIT_TYPES = [
  { id: 'binary', name: 'Yes/No', icon: '✅', description: 'Simple completion tracking' },
  { id: 'count', name: 'Count', icon: '🔢', description: 'Track quantities (e.g., 10 push-ups)' },
  { id: 'time', name: 'Duration', icon: '⏱️', description: 'Track time spent (e.g., 30 min meditation)' },
];

interface AddHabitModalProps {
  visible: boolean;
  onClose: () => void;
  onHabitAdded: () => void;
}

const AddHabitModal: React.FC<AddHabitModalProps> = ({ visible, onClose, onHabitAdded }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('other');
  const [selectedType, setSelectedType] = useState('binary');
  const [targetValue, setTargetValue] = useState('');
  const [targetUnit, setTargetUnit] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a habit name');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }

    setLoading(true);

    const habitData: any = {
      user_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      category: selectedCategory,
      habit_type: selectedType,
    };

    // Add target data based on habit type
    if (selectedType === 'count' || selectedType === 'time') {
      if (!targetValue.trim()) {
        Alert.alert('Error', 'Please enter a target value');
        return;
      }
      habitData.target_value = parseFloat(targetValue);
      habitData.target_unit = targetUnit.trim() || (selectedType === 'count' ? 'times' : 'minutes');
    }

    const { error } = await supabase
      .from('habits')
      .insert(habitData);

    setLoading(false);

    if (error) {
      Alert.alert('Error', 'Failed to create habit');
      console.error('Error creating habit:', error);
      return;
    }

    setTitle('');
    setDescription('');
    onHabitAdded();
    onClose();
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setSelectedCategory('other');
    setSelectedType('binary');
    setTargetValue('');
    setTargetUnit('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />

        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Habit</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Habit Name</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Morning meditation"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={title}
                  onChangeText={setTitle}
                  maxLength={60}
                />
              </View>
              <Text style={styles.charCount}>{title.length}/60</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Add details about your habit..."
                  placeholderTextColor={theme.colors.textSecondary}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  maxLength={200}
                  textAlignVertical="top"
                />
              </View>
              <Text style={styles.charCount}>{description.length}/200</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Category</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScroll}
                contentContainerStyle={styles.categoryContainer}
              >
                {HABIT_CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryItem,
                      selectedCategory === category.id && styles.categoryItemSelected
                    ]}
                    onPress={() => setSelectedCategory(category.id)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={
                        selectedCategory === category.id 
                          ? category.colors as [string, string, ...string[]]
                          : [theme.colors.backgroundLight, theme.colors.backgroundLight] as [string, string, ...string[]]
                      }
                      style={styles.categoryGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.categoryIcon}>{category.icon}</Text>
                      <Text style={[
                        styles.categoryName,
                        selectedCategory === category.id && styles.categoryNameSelected
                      ]}>
                        {category.name}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Habit Type</Text>
              <View style={styles.typeContainer}>
                {HABIT_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.typeItem,
                      selectedType === type.id && styles.typeItemSelected
                    ]}
                    onPress={() => {
                      setSelectedType(type.id);
                      setTargetValue('');
                      setTargetUnit('');
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.typeContent}>
                      <Text style={styles.typeIcon}>{type.icon}</Text>
                      <View style={styles.typeInfo}>
                        <Text style={[
                          styles.typeName,
                          selectedType === type.id && styles.typeNameSelected
                        ]}>
                          {type.name}
                        </Text>
                        <Text style={[
                          styles.typeDescription,
                          selectedType === type.id && styles.typeDescriptionSelected
                        ]}>
                          {type.description}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {(selectedType === 'count' || selectedType === 'time') && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Target</Text>
                <View style={styles.targetContainer}>
                  <View style={styles.targetInputWrapper}>
                    <TextInput
                      style={styles.targetInput}
                      placeholder="10"
                      placeholderTextColor={theme.colors.textSecondary}
                      value={targetValue}
                      onChangeText={setTargetValue}
                      keyboardType="numeric"
                      maxLength={10}
                    />
                  </View>
                  <View style={styles.targetUnitWrapper}>
                    <TextInput
                      style={styles.targetUnitInput}
                      placeholder={selectedType === 'count' ? 'times' : 'minutes'}
                      placeholderTextColor={theme.colors.textSecondary}
                      value={targetUnit}
                      onChangeText={setTargetUnit}
                      maxLength={20}
                    />
                  </View>
                </View>
                <Text style={styles.targetHint}>
                  {selectedType === 'count' 
                    ? 'e.g., "10 push-ups" or "5 glasses of water"'
                    : 'e.g., "30 minutes" or "1 hour"'
                  }
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.buttonWrapper, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={theme.gradients.purple}
                style={styles.button}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Creating...' : 'Create Habit'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 450,
    maxHeight: '90%',
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.4)',
  },
  scrollContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: theme.colors.textLight,
    fontWeight: '400',
  },
  form: {
    gap: 0,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textLight,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  inputWrapper: {
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  input: {
    height: 48,
    paddingHorizontal: 16,
    fontSize: 15,
    color: theme.colors.text,
  },
  textAreaWrapper: {
    height: 100,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  charCount: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  buttonWrapper: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0px 6px 24px rgba(107, 92, 231, 0.35)',
  },
  button: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: theme.colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  categoryScroll: {
    marginTop: 8,
  },
  categoryContainer: {
    paddingHorizontal: 4,
    gap: 12,
  },
  categoryItem: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryItemSelected: {
    borderColor: theme.colors.primary,
    boxShadow: '0px 4px 16px rgba(107, 92, 231, 0.3)',
  },
  categoryGradient: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  categoryIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  categoryNameSelected: {
    color: theme.colors.textOnPrimary,
  },
  typeContainer: {
    marginTop: 8,
    gap: 8,
  },
  typeItem: {
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: 16,
  },
  typeItemSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
  },
  typeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  typeInfo: {
    flex: 1,
  },
  typeName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  typeNameSelected: {
    color: theme.colors.primary,
  },
  typeDescription: {
    fontSize: 12,
    color: theme.colors.textLight,
  },
  typeDescriptionSelected: {
    color: theme.colors.textSecondary,
  },
  targetContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  targetInputWrapper: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  targetInput: {
    height: 48,
    paddingHorizontal: 16,
    fontSize: 15,
    color: theme.colors.text,
    textAlign: 'center',
  },
  targetUnitWrapper: {
    flex: 2,
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  targetUnitInput: {
    height: 48,
    paddingHorizontal: 16,
    fontSize: 15,
    color: theme.colors.text,
  },
  targetHint: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
});

export default AddHabitModal;