import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExpenseStore } from '../store/expenseStore';
import { FilterTabs, FilterPeriod } from '../components/FilterTabs';
import { MonthlySpendingChart } from '../components/MonthlySpendingChart';
import { CategoryPieChart } from '../components/CategoryPieChart';
import { WeeklyTrendChart } from '../components/WeeklyTrendChart';
import { formatCurrency } from '../utils/dateUtils';
import { theme } from '../constants/theme';

export const SummaryScreen = () => {
  const { expenses, categories, getCategoryById } = useExpenseStore();
  const [filter, setFilter] = useState<FilterPeriod>('month');
  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  const handleFilterChange = (period: FilterPeriod) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.5,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    setFilter(period);
  };

  // Calculate chart data
  const chartData = useMemo(() => {
    const now = new Date();

    // Weekly Trend (Last 7 days)
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const dayExpenses = expenses.filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate >= dayStart && expenseDate <= dayEnd;
      });

      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      weeklyData.push({
        day: i === 0 ? 'Today' : dayNames[date.getDay()],
        amount: dayExpenses.reduce((sum, e) => sum + e.amount, 0),
      });
    }

    // Monthly Spending (Last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthExpenses = expenses.filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate >= monthStart && expenseDate <= monthEnd;
      });

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      monthlyData.push({
        month: i === 0 ? 'This' : monthNames[date.getMonth()],
        amount: monthExpenses.reduce((sum, e) => sum + e.amount, 0),
      });
    }

    // Category Breakdown (This month)
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthExpenses = expenses.filter(e => new Date(e.date) >= thisMonthStart);
    
    const categoryTotals = new Map<string, number>();
    thisMonthExpenses.forEach(expense => {
      const current = categoryTotals.get(expense.categoryId) || 0;
      categoryTotals.set(expense.categoryId, current + expense.amount);
    });

    const total = Array.from(categoryTotals.values()).reduce((sum, val) => sum + val, 0);

    const categoryData = Array.from(categoryTotals.entries())
      .map(([categoryId, amount]) => {
        const category = getCategoryById(categoryId);
        return {
          name: category?.name || 'Unknown',
          amount,
          color: category?.color || '#6B7280',
          percentage: total > 0 ? (amount / total) * 100 : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    return { weeklyData, monthlyData, categoryData };
  }, [expenses, categories]);

  const stats = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (filter) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        const dayOfWeek = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    const currentExpenses = expenses.filter(e => {
      const expenseDate = new Date(e.date);
      return expenseDate >= startDate && expenseDate <= endDate;
    });

    const currentTotal = currentExpenses.reduce((sum, e) => sum + e.amount, 0);
    const avgExpense = currentExpenses.length > 0 ? currentTotal / currentExpenses.length : 0;

    return {
      currentTotal,
      transactionCount: currentExpenses.length,
      avgExpense,
    };
  }, [expenses, filter]);

  const getPeriodLabel = () => {
    switch (filter) {
      case 'day':
        return 'Today';
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Summary</Text>
        <FilterTabs selected={filter} onSelect={handleFilterChange} />
      </View>

      <Animated.ScrollView 
        style={[styles.content, { opacity: fadeAnim }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Current Period Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{getPeriodLabel()}</Text>
          <View style={styles.mainCard}>
            <Text style={styles.mainAmount}>
              {formatCurrency(stats.currentTotal)}
            </Text>
            <Text style={styles.mainSubtext}>
              {stats.transactionCount} transaction{stats.transactionCount !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {/* Weekly Trend Chart */}
        <View style={styles.section}>
          <WeeklyTrendChart data={chartData.weeklyData} />
        </View>

        {/* Category Pie Chart */}
        <View style={styles.section}>
          <CategoryPieChart data={chartData.categoryData} />
        </View>

        {/* Monthly Spending Chart */}
        <View style={styles.section}>
          <MonthlySpendingChart data={chartData.monthlyData} />
        </View>

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Average</Text>
              <Text style={styles.statValue}>{formatCurrency(stats.avgExpense)}</Text>
              <Text style={styles.statSublabel}>per transaction</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total</Text>
              <Text style={styles.statValue}>{stats.transactionCount}</Text>
              <Text style={styles.statSublabel}>transactions</Text>
            </View>
          </View>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
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
    marginBottom: theme.spacing.md,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: 100,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mainCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  mainAmount: {
    fontSize: 48,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  mainSubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    ...theme.shadows.small,
  },
  statLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  statValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  statSublabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
});