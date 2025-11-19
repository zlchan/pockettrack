import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Category } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { formatCurrency } from '../utils/dateUtils';
import { theme } from '../constants/theme';

const SWIPE_THRESHOLD = 80;

interface SwipeableCategoryItemProps {
  category: Category;
  amount: number;
  percentage: number;
  expenseCount: number;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const SwipeableCategoryItem: React.FC<SwipeableCategoryItemProps> = ({
  category,
  amount,
  percentage,
  expenseCount,
  onPress,
  onEdit,
  onDelete,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow left swipe (negative dx)
        if (gestureState.dx < 0) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -SWIPE_THRESHOLD) {
          // Keep swiped open
          Animated.spring(translateX, {
            toValue: -140,
            useNativeDriver: true,
            bounciness: 0,
          }).start();
        } else {
          // Close swipe
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 8,
          }).start();
        }
      },
    })
  ).current;

  const closeSwipe = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 8,
    }).start();
  };

  const handleEdit = () => {
    if (category.isDefault) {
      Alert.alert('Cannot Edit', 'Default categories cannot be modified');
      return;
    }
    closeSwipe();
    setTimeout(onEdit, 300);
  };

  const handleDelete = () => {
    if (category.isDefault) {
      Alert.alert('Cannot Delete', 'Default categories cannot be deleted');
      return;
    }
    closeSwipe();
    setTimeout(onDelete, 300);
  };

  return (
    <View style={styles.container}>
      {/* Action Buttons (Behind) */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.editButton, category.isDefault && styles.disabledButton]} 
          onPress={handleEdit}
          disabled={category.isDefault}
        >
          <Ionicons name="create-outline" size={24} color="#FFFFFF" />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.deleteButton, category.isDefault && styles.disabledButton]} 
          onPress={handleDelete}
          disabled={category.isDefault}
        >
          <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Swipeable Content */}
      <Animated.View
        style={[
          styles.swipeableContent,
          {
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.content}
          onPress={onPress}
          onLongPress={!category.isDefault ? onEdit : undefined}
          activeOpacity={0.7}
        >
          <CategoryIcon icon={category.icon} color={category.color} size={48} />

          <View style={styles.textContent}>
            <View style={styles.nameRow}>
              <Text style={styles.categoryName}>{category.name}</Text>
              {category.isDefault && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultBadgeText}>Default</Text>
                </View>
              )}
            </View>
            {amount > 0 && (
              <>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(percentage, 100)}%`,
                        backgroundColor: category.color,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.percentage}>
                  {percentage.toFixed(1)}% · {expenseCount} expense
                  {expenseCount !== 1 ? 's' : ''}
                </Text>
              </>
            )}
          </View>

          <Text
            style={[
              styles.amount,
              { color: amount > 0 ? theme.colors.text : theme.colors.textSecondary },
            ]}
          >
            {formatCurrency(amount)}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
  },
  actionsContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    width: 70,
    height: '100%',
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 70,
    height: '100%',
    backgroundColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: theme.colors.border,
    opacity: 0.5,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    marginTop: 4,
  },
  swipeableContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.small,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  textContent: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  categoryName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    flex: 1,
  },
  defaultBadge: {
    backgroundColor: theme.colors.border,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    marginLeft: theme.spacing.xs,
  },
  defaultBadgeText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
    marginBottom: theme.spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.borderRadius.full,
  },
  percentage: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  amount: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    marginLeft: theme.spacing.md,
  },
});