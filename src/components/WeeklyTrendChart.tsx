import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { theme } from '../constants/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface WeeklyTrendChartProps {
  data: { day: string; amount: number }[];
}

export const WeeklyTrendChart: React.FC<WeeklyTrendChartProps> = ({ data }) => {
  const chartData = {
    labels: data.map(d => d.day),
    datasets: [
      {
        data: data.map(d => d.amount),
        color: (opacity = 1) => `rgba(26, 26, 26, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  // Add a minimum value to make the chart look better
  const allZero = data.every(d => d.amount === 0);
  if (allZero) {
    chartData.datasets[0].data = [0, 0, 0, 0, 0, 0, 0];
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weekly Trend</Text>
      <Text style={styles.subtitle}>Last 7 days</Text>
      
      <LineChart
        data={chartData}
        width={SCREEN_WIDTH - 96}
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
          propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: theme.colors.surface,
            fill: theme.colors.text,
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
        bezier
        style={styles.chart}
        fromZero
      />
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