// src/screens/HomeScreen.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useExpenseStore } from '../store/expenseStore';
import { SwipeableExpenseItem } from '../components/SwipeableExpenseItem';
import { groupExpensesByDate, formatDate, formatCurrency } from '../utils/dateUtils';
import { theme } from '../constants/theme';
import { RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type TimeFilter = 'all' | 'past' | 'today' | 'future';

export const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { expenses, deleteExpense, getMonthlyTotal, getCategoryById, initializeCategories } = useExpenseStore();
  
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const rotateAnim = React.useRef(new Animated.Value(0)).current;
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

  // Initialize categories on mount
  useEffect(() => {
    initializeCategories();
  }, []);

  // Filter expenses by time
  const filteredExpenses = React.useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    switch (timeFilter) {
      case 'past':
        return expenses.filter(e => new Date(e.date) < today);
      case 'today':
        return expenses.filter(e => {
          const expenseDate = new Date(e.date);
          return expenseDate >= today && expenseDate < tomorrow;
        });
      case 'future':
        return expenses.filter(e => new Date(e.date) >= tomorrow);
      default:
        return expenses;
    }
  }, [expenses, timeFilter]);

  const groupedExpenses = groupExpensesByDate(filteredExpenses);
  const monthlyTotal = getMonthlyTotal();

  const handleAddExpense = () => {
    // Subtle rotation animation on button press
    Animated.sequence([
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    navigation.navigate('AddExpense', {});
  };

  const handleEditExpense = (expenseId: string) => {
    const expense = expenses.find(e => e.id === expenseId);
    if (expense) {
      navigation.navigate('AddExpense', { expense });
    }
  };

  const getExpenseCountByFilter = (filter: TimeFilter): number => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    switch (filter) {
      case 'past':
        return expenses.filter(e => new Date(e.date) < today).length;
      case 'today':
        return expenses.filter(e => {
          const expenseDate = new Date(e.date);
          return expenseDate >= today && expenseDate < tomorrow;
        }).length;
      case 'future':
        return expenses.filter(e => new Date(e.date) >= tomorrow).length;
      default:
        return expenses.length;
    }
  };

  const renderHeader = () => {
    const spin = rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '90deg'],
    });

    return (
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSubtitle}>This Month</Text>
            <Text style={styles.headerAmount}>{formatCurrency(monthlyTotal)}</Text>
          </View>
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={handleAddExpense}
            activeOpacity={0.8}
          >
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Ionicons name="add" size={28} color={theme.colors.primary} />
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Time Filter Tabs */}
        <View style={styles.filterContainer}>
          {(['all', 'past', 'today', 'future'] as TimeFilter[]).map(filter => {
            const isActive = timeFilter === filter;
            const count = getExpenseCountByFilter(filter);
            const labels = {
              all: 'All',
              past: 'Past',
              today: 'Today',
              future: 'Future',
            };

            return (
              <TouchableOpacity
                key={filter}
                style={[styles.filterTab, isActive && styles.filterTabActive]}
                onPress={() => setTimeFilter(filter)}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {labels[filter]}
                </Text>
                <View style={[styles.filterBadge, isActive && styles.filterBadgeActive]}>
                  <Text style={[styles.filterBadgeText, isActive && styles.filterBadgeTextActive]}>
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="wallet-outline" size={64} color={theme.colors.textSecondary} />
      <Text style={styles.emptyText}>
        {timeFilter === 'all' ? 'No expenses yet' : `No ${timeFilter} expenses`}
      </Text>
      <Text style={styles.emptySubtext}>
        {timeFilter === 'all' 
          ? 'Tap + to add your first expense'
          : 'Try selecting a different filter'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        ListHeaderComponent={renderHeader}
        data={groupedExpenses}
        keyExtractor={item => item.date}
        renderItem={({ item }) => (
          <View style={styles.section}>
            <Text style={styles.dateHeader}>{formatDate(item.date)}</Text>
            {item.data.map(expense => {
              const category = getCategoryById(expense.categoryId);
              return (
                <SwipeableExpenseItem
                  key={expense.id}
                  expense={expense}
                  category={category}
                  onPress={() => handleEditExpense(expense.id)}
                  onEdit={() => handleEditExpense(expense.id)}
                  onDelete={() => deleteExpense(expense.id)}
                />
              );
            })}
          </View>
        )}
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
  headerContainer: {
    backgroundColor: theme.colors.surface,
    ...theme.shadows.small,
    marginBottom: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
  },
  headerSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  headerAmount: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.text,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.background,
    gap: theme.spacing.xs,
  },
  filterTabActive: {
    backgroundColor: theme.colors.text,
  },
  filterText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
  filterTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  filterBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeActive: {
    backgroundColor: theme.colors.primary + '30',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSecondary,
  },
  filterBadgeTextActive: {
    color: theme.colors.primary,
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingTop: 0,
    paddingBottom: theme.spacing.xxl,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  dateHeader: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    minHeight: 300,
  },
  emptyText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
  },
  emptySubtext: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
});