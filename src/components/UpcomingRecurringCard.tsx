import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RecurringExpense, Category } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { formatCurrency } from '../utils/dateUtils';
import { theme } from '../constants/theme';

interface UpcomingRecurringCardProps {
  recurring: RecurringExpense;
  category?: Category;
  nextDate: Date;
  onPress: () => void;
}

export const UpcomingRecurringCard: React.FC<UpcomingRecurringCardProps> = ({
  recurring,
  category,
  nextDate,
  onPress,
}) => {
  const getTimeUntil = (): string => {
    const now = new Date();
    const diffTime = nextDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `In ${diffDays} days`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `In ${weeks} week${weeks > 1 ? 's' : ''}`;
    }
    return nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getRecurrenceIcon = (): string => {
    switch (recurring.recurrenceType) {
      case 'daily': return 'today-outline';
      case 'weekly': return 'calendar-outline';
      case 'monthly': return 'calendar';
      default: return 'repeat';
    }
  };

  if (!category) return null;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.iconContainer}>
        <CategoryIcon icon={category.icon} color={category.color} size={40} />
        <View style={[styles.recurringBadge, { backgroundColor: category.color }]}>
          <Ionicons name={getRecurrenceIcon() as any} size={12} color="#FFFFFF" />
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {recurring.title}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.timeUntil}>{getTimeUntil()}</Text>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.category}>{category.name}</Text>
        </View>
      </View>

      <View style={styles.right}>
        <Text style={styles.amount}>{formatCurrency(recurring.amount)}</Text>
        <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.text,
    ...theme.shadows.small,
  },
  iconContainer: {
    position: 'relative',
  },
  recurringBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  content: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeUntil: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
  },
  separator: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginHorizontal: 4,
  },
  category: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  right: {
    alignItems: 'flex-end',
    marginLeft: theme.spacing.sm,
  },
  amount: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.expense,
    marginBottom: 2,
  },
});