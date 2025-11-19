import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useExpenseStore } from '../store/expenseStore';
import { SwipeableCategoryItem } from '../components/SwipeableCategoryItem';
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
    <SwipeableCategoryItem
      category={item}
      amount={item.amount}
      percentage={item.percentage}
      expenseCount={item.expenseCount}
      onPress={() => handleEditCategory(item)}
      onEdit={() => handleEditCategory(item)}
      onDelete={() => handleDeleteCategory(item)}
    />
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
      </View>

      <FlatList
        data={categoryData}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
      
      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleAddCategory}>
        <Ionicons name="add" size={32} color={theme.colors.primary} />
      </TouchableOpacity>
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
  fab: {
    position: 'absolute',
    right: theme.spacing.lg,
    bottom: 100, // Above tab bar
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.text,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.medium,
    elevation: 8,
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: 100, // Extra space for tab bar
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