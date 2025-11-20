import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { theme } from '../constants/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface MonthlySpendingChartProps {
  data: { month: string; amount: number }[];
}

export const MonthlySpendingChart: React.FC<MonthlySpendingChartProps> = ({ data }) => {
  const chartData = {
    labels: data.map(d => d.month),
    datasets: [
      {
        data: data.map(d => d.amount),
      },
    ],
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Monthly Spending</Text>
      <Text style={styles.subtitle}>Last 6 months</Text>
      
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <BarChart
                data={chartData}
                width={SCREEN_WIDTH - 48}
                height={200}
                yAxisLabel="$"
                yAxisSuffix=""
                chartConfig={{
                backgroundColor: theme.colors.surface,
                backgroundGradientFrom: theme.colors.surface,
                backgroundGradientTo: theme.colors.surface,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(26, 26, 26, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                style: {
                    borderRadius: theme.borderRadius.md,
                },
                propsForLabels: {
                    fontSize: 12,
                },
                propsForBackgroundLines: {
                    strokeDasharray: '',
                    stroke: theme.colors.border,
                    strokeWidth: 1,
                },
                }}
                style={styles.chart}
                fromZero
                showValuesOnTopOfBars
            />
        </ScrollView>
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
  chart: {
    marginVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
});