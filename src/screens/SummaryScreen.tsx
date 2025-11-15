import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExpenseStore } from '../store/expenseStore';
import { FilterTabs, FilterPeriod } from '../components/FilterTabs';
import { formatCurrency } from '../utils/dateUtils';
import { theme } from '../constants/theme';

export const SummaryScreen = () => {
  const { expenses, getCategoryById } = useExpenseStore();
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

    // Get previous period dates
    let prevStartDate: Date;
    let prevEndDate: Date;

    switch (filter) {
      case 'day':
        prevStartDate = new Date(startDate);
        prevStartDate.setDate(startDate.getDate() - 1);
        prevEndDate = new Date(startDate);
        prevEndDate.setMilliseconds(-1);
        break;
      case 'week':
        prevStartDate = new Date(startDate);
        prevStartDate.setDate(startDate.getDate() - 7);
        prevEndDate = new Date(startDate);
        prevEndDate.setMilliseconds(-1);
        break;
      case 'month':
      default:
        prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
    }

    // Filter by date range (inclusive of past, present, and future within range)
    const currentExpenses = expenses.filter(e => {
      const expenseDate = new Date(e.date);
      return expenseDate >= startDate && expenseDate <= endDate;
    });

    const previousExpenses = expenses.filter(e => {
      const expenseDate = new Date(e.date);
      return expenseDate >= prevStartDate && expenseDate <= prevEndDate;
    });

    const currentTotal = currentExpenses.reduce((sum, e) => sum + e.amount, 0);
    const previousTotal = previousExpenses.reduce((sum, e) => sum + e.amount, 0);

    const avgExpense =
      currentExpenses.length > 0 ? currentTotal / currentExpenses.length : 0;

    const change = previousTotal > 0
      ? ((currentTotal - previousTotal) / previousTotal) * 100
      : currentTotal > 0 ? 100 : 0;

    const allTimeTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Get highest expense in current period
    const highestExpense = currentExpenses.length > 0
      ? currentExpenses.reduce((max, e) => e.amount > max.amount ? e : max)
      : null;

    // Calculate daily average for the period
    const daysInPeriod = filter === 'day' ? 1 : 
                        filter === 'week' ? 7 : 
                        new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dailyAverage = currentTotal / daysInPeriod;

    // Count future expenses
    const futureExpenses = expenses.filter(e => new Date(e.date) > now).length;
    const pastExpenses = expenses.filter(e => new Date(e.date) < new Date(now.getFullYear(), now.getMonth(), now.getDate())).length;

    return {
      currentTotal,
      previousTotal,
      transactionCount: currentExpenses.length,
      avgExpense,
      change,
      allTimeTotal,
      totalExpenses: expenses.length,
      highestExpense,
      dailyAverage,
      futureExpenses,
      pastExpenses,
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

  const getPrevPeriodLabel = () => {
    switch (filter) {
      case 'day':
        return 'Yesterday';
      case 'week':
        return 'Last Week';
      case 'month':
        return 'Last Month';
    }
  };

  const StatCard = ({ 
    label, 
    value, 
    sublabel,
    highlight,
  }: { 
    label: string; 
    value: string; 
    sublabel?: string;
    highlight?: boolean;
  }) => (
    <View style={[styles.statCard, highlight && styles.statCardHighlight]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, highlight && styles.statValueHighlight]}>
        {value}
      </Text>
      {sublabel && <Text style={styles.statSublabel}>{sublabel}</Text>}
    </View>
  );

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
        {/* Current Period */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{getPeriodLabel()}</Text>
          <View style={styles.mainCard}>
            <Text style={styles.mainAmount}>
              {formatCurrency(stats.currentTotal)}
            </Text>
            <Text style={styles.mainSubtext}>
              {stats.transactionCount} transaction{stats.transactionCount !== 1 ? 's' : ''}
            </Text>
            {stats.change !== 0 && (
              <View style={styles.changeContainer}>
                <Text
                  style={[
                    styles.changeText,
                    { color: stats.change > 0 ? theme.colors.error : theme.colors.success },
                  ]}
                >
                  {stats.change > 0 ? '↑' : '↓'} {Math.abs(stats.change).toFixed(1)}% vs {getPrevPeriodLabel().toLowerCase()}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Averages</Text>
          <View style={styles.row}>
            <StatCard
              label="Per Transaction"
              value={formatCurrency(stats.avgExpense)}
            />
            <StatCard
              label="Per Day"
              value={formatCurrency(stats.dailyAverage)}
            />
          </View>
        </View>

        {/* Highest Expense */}
        {stats.highestExpense && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Highest Expense</Text>
            <View style={styles.highlightCard}>
              <View style={styles.highlightTop}>
                <Text style={styles.highlightTitle}>
                  {stats.highestExpense.title}
                </Text>
                <Text style={styles.highlightCategory}>
                  {getCategoryById(stats.highestExpense.categoryId)?.name}
                </Text>
              </View>
              <Text style={styles.highlightAmount}>
                {formatCurrency(stats.highestExpense.amount)}
              </Text>
              <Text style={styles.highlightDate}>
                {new Date(stats.highestExpense.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>
          </View>
        )}

        {/* Comparison */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Period Comparison</Text>
          <View style={styles.comparisonRow}>
            <View style={styles.comparisonItem}>
              <Text style={styles.comparisonLabel}>{getPeriodLabel()}</Text>
              <Text style={styles.comparisonAmount}>
                {formatCurrency(stats.currentTotal)}
              </Text>
              <Text style={styles.comparisonCount}>
                {stats.transactionCount} expenses
              </Text>
            </View>
            <View style={styles.comparisonDivider} />
            <View style={styles.comparisonItem}>
              <Text style={styles.comparisonLabel}>{getPrevPeriodLabel()}</Text>
              <Text style={[styles.comparisonAmount, styles.comparisonAmountPrev]}>
                {formatCurrency(stats.previousTotal)}
              </Text>
              <Text style={styles.comparisonCount}>
                {expenses.filter(e => {
                  const expenseDate = new Date(e.date);
                  let prevStartDate: Date;
                  let prevEndDate: Date;
                  const now = new Date();
                  
                  if (filter === 'day') {
                    prevStartDate = new Date(now);
                    prevStartDate.setDate(now.getDate() - 1);
                    prevStartDate.setHours(0, 0, 0, 0);
                    prevEndDate = new Date(now);
                    prevEndDate.setHours(0, 0, 0, -1);
                  } else if (filter === 'week') {
                    const dayOfWeek = now.getDay();
                    prevStartDate = new Date(now);
                    prevStartDate.setDate(now.getDate() - dayOfWeek - 7);
                    prevStartDate.setHours(0, 0, 0, 0);
                    prevEndDate = new Date(now);
                    prevEndDate.setDate(now.getDate() - dayOfWeek);
                    prevEndDate.setMilliseconds(-1);
                  } else {
                    prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
                  }
                  
                  return expenseDate >= prevStartDate && expenseDate <= prevEndDate;
                }).length} expenses
              </Text>
            </View>
          </View>
        </View>

        {/* All Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Time Statistics</Text>
          <View style={styles.row}>
            <StatCard
              label="Total Spent"
              value={formatCurrency(stats.allTimeTotal)}
              highlight
            />
            <StatCard
              label="Total Expenses"
              value={stats.totalExpenses.toString()}
              highlight
            />
          </View>
          <View style={styles.row}>
            <StatCard
              label="Past Expenses"
              value={stats.pastExpenses.toString()}
              sublabel="recorded"
            />
            <StatCard
              label="Future Expenses"
              value={stats.futureExpenses.toString()}
              sublabel="scheduled"
            />
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
    paddingBottom: theme.spacing.xxl,
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
  changeContainer: {
    marginTop: theme.spacing.md,
  },
  changeText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.small,
  },
  statCardHighlight: {
    borderWidth: 2,
    borderColor: theme.colors.text,
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
  },
  statValueHighlight: {
    fontSize: theme.fontSize.xxl,
  },
  statSublabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  highlightCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.small,
  },
  highlightTop: {
    marginBottom: theme.spacing.md,
  },
  highlightTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  highlightCategory: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  highlightAmount: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.expense,
    marginBottom: theme.spacing.xs,
  },
  highlightDate: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  comparisonRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    ...theme.shadows.small,
  },
  comparisonItem: {
    flex: 1,
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  comparisonDivider: {
    width: 1,
    backgroundColor: theme.colors.border,
  },
  comparisonLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  comparisonAmount: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  comparisonAmountPrev: {
    color: theme.colors.textSecondary,
  },
  comparisonCount: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
});