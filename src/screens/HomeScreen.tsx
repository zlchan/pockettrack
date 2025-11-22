import React, { useEffect, useState, useMemo } from 'react';
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
import { UpcomingRecurringCard } from '../components/UpcomingRecurringCard';
import { groupExpensesByDate, formatDate, formatCurrency, getNextOccurrence } from '../utils/dateUtils';
import { theme } from '../constants/theme';
import { RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type TimeFilter = 'all' | 'past' | 'today' | 'future';

export const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { 
    expenses, 
    deleteExpense, 
    getMonthlyTotal, 
    getCategoryById, 
    initializeCategories,
    recurringExpenses,
  } = useExpenseStore();
  
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const rotateAnim = React.useRef(new Animated.Value(0)).current;
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

  // Initialize categories on mount
  useEffect(() => {
    initializeCategories();
    // Generate any pending recurring expenses
    const { generateRecurringExpenses } = useExpenseStore.getState();
    generateRecurringExpenses();
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

  // Calculate upcoming recurring expenses
  const upcomingRecurring = useMemo(() => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return recurringExpenses
      .filter(recurring => {
        if (!recurring.isActive) return false;
        if (recurring.endDate && new Date(recurring.endDate) < now) return false;
        return true;
      })
      .map(recurring => {
        const nextDate = getNextOccurrence(
          recurring.recurrenceType,
          recurring.startDate,
          recurring.lastGenerated
        );
        return { recurring, nextDate };
      })
      .filter(item => {
        if (!item.nextDate) return false;
        return item.nextDate <= thirtyDaysFromNow && item.nextDate >= now;
      })
      .sort((a, b) => a.nextDate!.getTime() - b.nextDate!.getTime())
      .slice(0, 5); // Show max 5 upcoming
  }, [recurringExpenses]);

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

  const handleEditRecurring = (recurringId: string) => {
    const recurring = recurringExpenses.find(r => r.id === recurringId);
    if (recurring) {
      navigation.navigate('ManageRecurring', { recurringExpense: recurring });
    }
  };

  const handleViewAllRecurring = () => {
    navigation.navigate('RecurringList' as never);
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
    return (
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSubtitle}>This Month</Text>
            <Text style={styles.headerAmount}>{formatCurrency(monthlyTotal)}</Text>
          </View>
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
        ListHeaderComponent={
          <>
            {renderHeader()}
            {upcomingRecurring.length > 0 && (
              <View style={styles.upcomingSection}>
                <View style={styles.upcomingSectionHeader}>
                  <View style={styles.upcomingTitleRow}>
                    <Ionicons name="time-outline" size={20} color={theme.colors.text} />
                    <Text style={styles.upcomingSectionTitle}>Upcoming Recurring</Text>
                  </View>
                  <TouchableOpacity onPress={handleViewAllRecurring}>
                    <Text style={styles.viewAllText}>View All</Text>
                  </TouchableOpacity>
                </View>
                {upcomingRecurring.map(({ recurring, nextDate }) => (
                  <UpcomingRecurringCard
                    key={recurring.id}
                    recurring={recurring}
                    category={getCategoryById(recurring.categoryId)}
                    nextDate={nextDate!}
                    onPress={() => handleEditRecurring(recurring.id)}
                  />
                ))}
              </View>
            )}
          </>
        }
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
      
      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={handleAddExpense}
        activeOpacity={0.8}
      >
        <Animated.View style={{ transform: [{ rotate: rotateAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '90deg'],
        }) }] }}>
          <Ionicons name="add" size={32} color={theme.colors.primary} />
        </Animated.View>
      </TouchableOpacity>
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
    paddingBottom: 100, // Extra space for tab bar
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
  upcomingSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  upcomingSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  upcomingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  upcomingSectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  viewAllText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
  },
});