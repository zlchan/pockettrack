import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Expense, Category } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { formatCurrency } from '../utils/dateUtils';
import { formatMultiCurrency } from '../utils/currencyUtils';
import { theme } from '../constants/theme';

interface ExpenseItemProps {
  expense: Expense;
  category?: Category;
  onPress: () => void;
  onDelete: () => void;
}

export const ExpenseItem: React.FC<ExpenseItemProps> = ({
  expense,
  category,
  onPress,
  onDelete,
}) => {
  const handleDelete = () => {
    Alert.alert(
      'Delete Expense',
      `Are you sure you want to delete "${expense.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: onDelete,
        },
      ]
    );
  };

  if (!category) return null;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <CategoryIcon icon={category.icon} color={category.color} size={48} />

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {expense.title}
        </Text>
        <View style={styles.metaRow}>
          {expense.recurringExpenseId && (
            <>
              <Ionicons name="repeat" size={12} color={theme.colors.textSecondary} />
              <Text style={styles.separator}>•</Text>
            </>
          )}
          <Text style={styles.categoryName}>{category.name}</Text>
          {expense.note && (
            <>
              <Text style={styles.separator}>•</Text>
              <Text style={styles.note} numberOfLines={1}>
                {expense.note}
              </Text>
            </>
          )}
        </View>
      </View>

      <View style={styles.right}>
        <Text style={styles.amount}>
          {formatMultiCurrency(expense.amount, expense.originalAmount, expense.originalCurrency)}
        </Text>
        <TouchableOpacity
          onPress={handleDelete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.deleteButton}
        >
          <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
        </TouchableOpacity>
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
    ...theme.shadows.small,
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
    flex: 1,
  },
  categoryName: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  separator: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginHorizontal: theme.spacing.xs,
  },
  note: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  right: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.expense,
    marginBottom: theme.spacing.xs,
  },
  deleteButton: {
    padding: theme.spacing.xs,
  },
});