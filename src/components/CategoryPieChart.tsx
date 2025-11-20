import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { theme } from '../constants/theme';
import { formatCurrency } from '../utils/dateUtils';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface CategoryData {
  name: string;
  amount: number;
  color: string;
  percentage: number;
}

interface CategoryPieChartProps {
  data: CategoryData[];
}

export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ data }) => {
  // Only show top 5 categories, group others
  const topCategories = data.slice(0, 5);
  const othersAmount = data.slice(5).reduce((sum, cat) => sum + cat.amount, 0);
  
  const chartData = topCategories.map(cat => ({
    name: cat.name,
    amount: cat.amount,
    color: cat.color,
    legendFontColor: theme.colors.textSecondary,
    legendFontSize: 12,
  }));

  if (othersAmount > 0) {
    chartData.push({
      name: 'Others',
      amount: othersAmount,
      color: '#9CA3AF',
      legendFontColor: theme.colors.textSecondary,
      legendFontSize: 12,
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Category Breakdown</Text>
      <Text style={styles.subtitle}>This month's spending</Text>
      
      {chartData.length > 0 ? (
        <>
          <PieChart
            data={chartData}
            width={SCREEN_WIDTH - 48}
            height={200}
            chartConfig={{
              color: (opacity = 1) => `rgba(26, 26, 26, ${opacity})`,
            }}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
            hasLegend={false}
          />
          
          <View style={styles.legend}>
            {chartData.map((item, index) => (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                <Text style={styles.legendText}>{item.name}</Text>
                <Text style={styles.legendAmount}>{formatCurrency(item.amount)}</Text>
              </View>
            ))}
          </View>
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No spending data yet</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.small,
  },
  title: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  legend: {
    marginTop: theme.spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: theme.spacing.sm,
  },
  legendText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
  },
  legendAmount: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  emptyContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
});