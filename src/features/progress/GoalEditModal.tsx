import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { X, Save, Trash2, Target, Calendar } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import { HapticButton } from '../../ui/HapticButton';
import { LuxuryTheme } from '../../design/luxuryTheme';
import { useStore } from '../../state/rootStore';
import { Goal } from '../../state/slices/goalsSlice';
import * as Haptics from 'expo-haptics';

interface GoalEditModalProps {
  visible: boolean;
  goal: Goal | null;
  onClose: () => void;
}

const CATEGORIES = [
  { id: 'fitness', label: 'Fitness', color: '#22C55E' },
  { id: 'mindfulness', label: 'Mindfulness', color: '#60A5FA' },
  { id: 'productivity', label: 'Productivity', color: '#A78BFA' },
  { id: 'health', label: 'Health', color: '#EF4444' },
  { id: 'skills', label: 'Skills', color: '#F59E0B' },
  { id: 'other', label: 'Other', color: '#6B7280' },
] as const;

export const GoalEditModal: React.FC<GoalEditModalProps> = ({ visible, goal, onClose }) => {
  const { updateGoal, deleteGoal, goalsLoading } = useStore();
  const [title, setTitle] = useState('');
  const [metric, setMetric] = useState('');
  const [deadline, setDeadline] = useState(new Date());
  const [why, setWhy] = useState('');
  const [category, setCategory] = useState<string>('fitness');
  const [color, setColor] = useState('#FFD700');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const modalScale = useSharedValue(0);

  useEffect(() => {
    if (visible && goal) {
      // Populate form with goal data
      setTitle(goal.title || '');
      setMetric(goal.metric || '');
      setDeadline(new Date(goal.deadline || new Date()));
      setWhy(goal.why || '');
      setCategory(goal.category || 'fitness');
      setColor(goal.color || '#FFD700');
      
      modalScale.value = withSpring(1, { damping: 15, stiffness: 100 });
    } else {
      modalScale.value = withTiming(0, { duration: 200 });
    }
  }, [visible, goal]);

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: modalScale.value }],
    opacity: modalScale.value,
  }));

  const handleSave = async () => {
    if (!goal || !title.trim() || !metric.trim()) {
      Alert.alert('Missing Information', 'Please fill in the goal title and metric.');
      return;
    }

    const updates = {
      title: title.trim(),
      metric: metric.trim(),
      deadline: deadline.toISOString(),
      why: why.trim(),
      category: category as any,
      color,
    };

    try {
      await updateGoal(goal.id, updates);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onClose();
    } catch (error) {
      console.error('Failed to update goal:', error);
      Alert.alert('Error', 'Failed to update goal. Please try again.');
    }
  };

  const handleDelete = () => {
    if (!goal) return;

    Alert.alert(
      'Delete Goal',
      `Are you sure you want to delete "${goal.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGoal(goal.id);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              onClose();
            } catch (error) {
              console.error('Failed to delete goal:', error);
              Alert.alert('Error', 'Failed to delete goal. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDeadline(selectedDate);
    }
  };

  if (!visible || !goal) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        
        <Animated.View style={[styles.modal, modalStyle]}>
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFillObject} />
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Edit Goal</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={LuxuryTheme.colors.text.primary} />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.content}
          >
            {/* Goal Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Goal Title</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="What do you want to achieve?"
                placeholderTextColor={LuxuryTheme.colors.text.muted}
                multiline
                maxLength={100}
              />
            </View>

            {/* Metric */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Success Metric</Text>
              <TextInput
                style={styles.input}
                value={metric}
                onChangeText={setMetric}
                placeholder="How will you measure success?"
                placeholderTextColor={LuxuryTheme.colors.text.muted}
                multiline
                maxLength={150}
              />
            </View>

            {/* Deadline */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Target Deadline</Text>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar size={16} color={LuxuryTheme.colors.primary.gold} />
                <Text style={styles.dateText}>
                  {deadline.toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Category */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryButton,
                      category === cat.id && styles.categoryButtonActive,
                      { borderColor: cat.color }
                    ]}
                    onPress={() => {
                      setCategory(cat.id);
                      setColor(cat.color);
                      Haptics.selectionAsync();
                    }}
                  >
                    <Text style={[
                      styles.categoryText,
                      category === cat.id && styles.categoryTextActive
                    ]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Why */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Why This Matters (Optional)</Text>
              <TextInput
                style={[styles.input, styles.whyInput]}
                value={why}
                onChangeText={setWhy}
                placeholder="What's your motivation?"
                placeholderTextColor={LuxuryTheme.colors.text.muted}
                multiline
                maxLength={200}
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity 
                style={[styles.button, styles.deleteButton]} 
                onPress={handleDelete}
                disabled={goalsLoading}
              >
                <Trash2 size={18} color="#ef4444" />
                <Text style={[styles.buttonText, styles.deleteButtonText]}>Delete</Text>
              </TouchableOpacity>

              <HapticButton
                style={[styles.button, styles.saveButton]}
                onPress={handleSave}
                disabled={goalsLoading || !title.trim() || !metric.trim()}
                hapticType="medium"
              >
                <LinearGradient
                  colors={[LuxuryTheme.colors.primary.gold, LuxuryTheme.colors.primary.champagne]}
                  style={StyleSheet.absoluteFillObject}
                />
                <Save size={18} color="#000" />
                <Text style={styles.saveButtonText}>
                  {goalsLoading ? 'Saving...' : 'Save'}
                </Text>
              </HapticButton>
            </View>
          </KeyboardAvoidingView>

          {/* Date Picker */}
          {showDatePicker && (
            <DateTimePicker
              value={deadline}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modal: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '85%',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: LuxuryTheme.colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: LuxuryTheme.colors.text.secondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    color: LuxuryTheme.colors.text.primary,
    fontSize: 16,
    minHeight: 44,
  },
  whyInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  dateText: {
    color: LuxuryTheme.colors.primary.gold,
    fontSize: 16,
    fontWeight: '500',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  categoryButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: LuxuryTheme.colors.text.tertiary,
  },
  categoryTextActive: {
    color: LuxuryTheme.colors.text.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  saveButton: {
    overflow: 'hidden',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButtonText: {
    color: '#ef4444',
  },
  saveButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});