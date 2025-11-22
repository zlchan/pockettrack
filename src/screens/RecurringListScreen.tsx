import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useExpenseStore } from '../store/expenseStore';
import { CategoryIcon } from '../components/CategoryIcon';
import { formatCurrency } from '../utils/dateUtils';
import { theme } from '../constants/theme';
import { RootStackParamList, RecurringExpense } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const RecurringListScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { recurringExpenses, getCategoryById, deleteRecurringExpense, toggleRecurringExpense } = useExpenseStore();

  const handleAdd = () => {
    navigation.navigate('ManageRecurring', {});
  };

  const handleEdit = (recurring: RecurringExpense) => {
    navigation.navigate('ManageRecurring', { recurringExpense: recurring });
  };

  const handleDelete = (recurring: RecurringExpense) => {
    Alert.alert(
      'Delete Recurring Expense',
      `Delete "${recurring.title}"? Past generated expenses will be kept.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteRecurringExpense(recurring.id) },
      ]
    );
  };

  const getRecurrenceLabel = (type: string): string => {
    switch (type) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      default: return 'Once';
    }
  };

  const renderItem = ({ item }: { item: RecurringExpense }) => {
    const category = getCategoryById(item.categoryId);
    if (!category) return null;

    return (
      <TouchableOpacity style={styles.item} onPress={() => handleEdit(item)} activeOpacity={0.7}>
        <CategoryIcon icon={category.icon} color={category.color} size={48} />
        
        <View style={styles.content}>
          <Text style={styles.title}>{item.title}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="repeat" size={14} color={theme.colors.textSecondary} />
            <Text style={styles.recurrence}>{getRecurrenceLabel(item.recurrenceType)}</Text>
            <Text style={styles.separator}>•</Text>
            <Text style={styles.category}>{category.name}</Text>
          </View>
        </View>

        <View style={styles.right}>
          <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
          <View style={styles.actions}>
            <Switch
              value={item.isActive}
              onValueChange={() => toggleRecurringExpense(item.id)}
              style={styles.switch}
            />
            <TouchableOpacity onPress={() => handleDelete(item)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="repeat" size={64} color={theme.colors.textSecondary} />
      <Text style={styles.emptyText}>No recurring expenses</Text>
      <Text style={styles.emptySubtext}>Tap + to add one</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recurring Expenses</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={recurringExpenses}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity style={styles.fab} onPress={handleAdd}>
        <Ionicons name="add" size={32} color={theme.colors.primary} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.xl, backgroundColor: theme.colors.surface, ...theme.shadows.small },
  backButton: { padding: theme.spacing.xs },
  headerTitle: { fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold, color: theme.colors.text },
  listContent: { padding: theme.spacing.lg, paddingBottom: 100 },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, padding: theme.spacing.md, borderRadius: theme.borderRadius.md, marginBottom: theme.spacing.md, ...theme.shadows.small },
  content: { flex: 1, marginLeft: theme.spacing.md },
  title: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold, color: theme.colors.text, marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  recurrence: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, fontWeight: theme.fontWeight.medium },
  separator: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
  category: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
  right: { alignItems: 'flex-end', gap: theme.spacing.xs },
  amount: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, color: theme.colors.text },
  actions: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  switch: { transform: [{ scale: 0.8 }] },
  fab: { position: 'absolute', right: theme.spacing.lg, bottom: 100, width: 64, height: 64, borderRadius: 32, backgroundColor: theme.colors.text, justifyContent: 'center', alignItems: 'center', ...theme.shadows.medium, elevation: 8 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: theme.spacing.xxl * 3 },
  emptyText: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.semibold, color: theme.colors.text, marginTop: theme.spacing.lg },
  emptySubtext: { fontSize: theme.fontSize.md, color: theme.colors.textSecondary, marginTop: theme.spacing.sm },
});