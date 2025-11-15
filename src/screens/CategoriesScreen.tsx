// src/screens/CategoriesScreen.tsx

import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useExpenseStore } from '../store/expenseStore';
import { CategoryIcon } from '../components/CategoryIcon';
import { formatCurrency } from '../utils/dateUtils';
import { theme } from '../constants/theme';
import { RootStackParamList, Category } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const CategoriesScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { categories, getTotalByCategory, getMonthlyTotal, deleteCategory, getExpensesByCategory } = useExpenseStore();
  const monthlyTotal = getMonthlyTotal();

  const categoryData = categories.map(cat => ({
    ...cat,
    amount: getTotalByCategory(cat.id),
    percentage: monthlyTotal > 0 
      ? (getTotalByCategory(cat.id) / monthlyTotal) * 100 
      : 0,
    expenseCount: getExpensesByCategory(cat.id).length,
  })).sort((a, b) => b.amount - a.amount);

  const handleAddCategory = () => {
    navigation.navigate('ManageCategory', {});
  };

  const handleEditCategory = (category: Category) => {
    if (category.isDefault) {
      Alert.alert('Cannot Edit', 'Default categories cannot be modified');
      return;
    }
    navigation.navigate('ManageCategory', { category });
  };

  const handleDeleteCategory = (category: Category) => {
    if (category.isDefault) {
      Alert.alert('Cannot Delete', 'Default categories cannot be deleted');
      return;
    }

    const expenseCount = getExpensesByCategory(category.id).length;

    if (expenseCount === 0) {
      Alert.alert(
        'Delete Category',
        `Delete "${category.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => deleteCategory(category.id, false),
          },
        ]
      );
    } else {
      Alert.alert(
        'Delete Category',
        `"${category.name}" has ${expenseCount} expense${expenseCount > 1 ? 's' : ''}. What would you like to do?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Move to Other',
            onPress: () => deleteCategory(category.id, false),
          },
          {
            text: 'Delete All',
            style: 'destructive',
            onPress: () => deleteCategory(category.id, true),
          },
        ]
      );
    }
  };

  const renderItem = ({ item }: { item: typeof categoryData[0] }) => (
    <TouchableOpacity 
      style={styles.item}
      onPress={() => handleEditCategory(item)}
      onLongPress={() => handleDeleteCategory(item)}
    >
      <CategoryIcon icon={item.icon} color={item.color} size={48} />
      
      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text style={styles.categoryName}>{item.name}</Text>
          {!item.isDefault && (
            <TouchableOpacity
              onPress={() => handleDeleteCategory(item)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="trash-outline" size={16} color={theme.colors.error} />
            </TouchableOpacity>
          )}
        </View>
        {item.amount > 0 && (
          <>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${Math.min(item.percentage, 100)}%`, backgroundColor: item.color }
                ]} 
              />
            </View>
            <Text style={styles.percentage}>
              {item.percentage.toFixed(1)}% · {item.expenseCount} expense{item.expenseCount !== 1 ? 's' : ''}
            </Text>
          </>
        )}
      </View>

      <Text style={[styles.amount, { color: item.amount > 0 ? theme.colors.text : theme.colors.textSecondary }]}>
        {formatCurrency(item.amount)}
      </Text>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No categories yet</Text>
      <Text style={styles.emptySubtext}>
        Tap + to create your first category
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Categories</Text>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>This Month</Text>
            <Text style={styles.totalAmount}>{formatCurrency(monthlyTotal)}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAddCategory}>
          <Ionicons name="add" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={categoryData}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.small,
  },
  headerTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  totalLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  totalAmount: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.text,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  listContent: {
    padding: theme.spacing.lg,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
  },
  content: {
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl * 2,
  },
  emptyText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  emptySubtext: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
  },
});