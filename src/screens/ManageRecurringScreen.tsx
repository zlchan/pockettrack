import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useExpenseStore } from '../store/expenseStore';
import { CategoryIcon } from '../components/CategoryIcon';
import { NumericKeypad } from '../components/NumericKeypad';
import { RootStackParamList, RecurrenceType } from '../types';
import { theme } from '../constants/theme';
import { Platform } from 'react-native';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ManageRecurring'>;
type ManageRecurringRouteProp = RouteProp<RootStackParamList, 'ManageRecurring'>;

const recurrenceOptions: { value: RecurrenceType; label: string; icon: string }[] = [
  { value: 'daily', label: 'Daily', icon: 'today-outline' },
  { value: 'weekly', label: 'Weekly', icon: 'calendar-outline' },
  { value: 'monthly', label: 'Monthly', icon: 'calendar' },
];

export const ManageRecurringScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ManageRecurringRouteProp>();
  const { addRecurringExpense, updateRecurringExpense, categories } = useExpenseStore();

  const isEdit = !!route.params?.recurringExpense;
  const recurring = route.params?.recurringExpense;

  const [title, setTitle] = useState(recurring?.title || '');
  const [amount, setAmount] = useState(recurring?.amount?.toString() || '');
  const [categoryId, setCategoryId] = useState(recurring?.categoryId || categories[0]?.id || '');
  const [note, setNote] = useState(recurring?.note || '');
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(recurring?.recurrenceType || 'monthly');
  const [startDate, setStartDate] = useState(recurring?.startDate ? new Date(recurring.startDate) : new Date());
  const [hasEndDate, setHasEndDate] = useState(!!recurring?.endDate);
  const [endDate, setEndDate] = useState(recurring?.endDate ? new Date(recurring.endDate) : new Date());
  const [isActive, setIsActive] = useState(recurring?.isActive ?? true);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [activeInput, setActiveInput] = useState<'amount' | 'title' | 'note' | null>('amount');
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
      if (activeInput === 'title' || activeInput === 'note') {
        setActiveInput('amount');
      }
    });
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [activeInput]);

  const formatDateDisplay = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatAmountDisplay = (value: string): string => {
    if (!value) return '0.00';
    const num = parseFloat(value);
    if (isNaN(num)) return '0.00';
    return num.toFixed(2);
  };

  const validateAndSave = (): boolean => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return false;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return false;
    }

    if (!categoryId) {
      Alert.alert('Error', 'Please select a category');
      return false;
    }

    if (hasEndDate && endDate <= startDate) {
      Alert.alert('Error', 'End date must be after start date');
      return false;
    }

    const recurringData = {
      title: title.trim(),
      amount: parsedAmount,
      categoryId,
      note: note.trim(),
      recurrenceType,
      startDate: startDate.toISOString(),
      endDate: hasEndDate ? endDate.toISOString() : undefined,
      isActive,
      lastGenerated: recurring?.lastGenerated,
    };

    if (isEdit && recurring) {
      updateRecurringExpense(recurring.id, recurringData);
    } else {
      addRecurringExpense(recurringData);
    }

    navigation.goBack();
    return true;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.flex}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEdit ? 'Edit Recurring' : 'Add Recurring'}
          </Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <TouchableOpacity 
            style={[styles.amountContainer, activeInput === 'amount' && !keyboardVisible && styles.amountContainerActive]}
            onPress={() => { Keyboard.dismiss(); setActiveInput('amount'); }}
            activeOpacity={0.7}
          >
            <Text style={styles.currencySymbol}>$</Text>
            <Text style={styles.amountDisplay}>{formatAmountDisplay(amount)}</Text>
          </TouchableOpacity>

          <View style={styles.section}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={[styles.input, activeInput === 'title' && styles.inputActive]}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Netflix Subscription"
              placeholderTextColor={theme.colors.textSecondary}
              onFocus={() => setActiveInput('title')}
              maxLength={50}
              returnKeyType="done"
              onSubmitEditing={() => { Keyboard.dismiss(); setActiveInput('amount'); }}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Recurrence</Text>
            <View style={styles.recurrenceRow}>
              {recurrenceOptions.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.recurrenceOption, recurrenceType === option.value && styles.recurrenceOptionActive]}
                  onPress={() => setRecurrenceType(option.value)}
                >
                  <Ionicons name={option.icon as any} size={24} color={recurrenceType === option.value ? theme.colors.primary : theme.colors.text} />
                  <Text style={[styles.recurrenceLabel, recurrenceType === option.value && styles.recurrenceLabelActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Start Date</Text>
            <TouchableOpacity style={styles.dateSelector} onPress={() => setShowStartPicker(true)}>
              <Ionicons name="calendar-outline" size={20} color={theme.colors.text} />
              <Text style={styles.dateSelectorText}>{formatDateDisplay(startDate)}</Text>
            </TouchableOpacity>
            {showStartPicker && (
              <DateTimePicker value={startDate} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(e, d) => { setShowStartPicker(Platform.OS === 'ios'); if (d) setStartDate(d); }} />
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.switchRow}>
              <Text style={styles.label}>End Date</Text>
              <Switch value={hasEndDate} onValueChange={setHasEndDate} />
            </View>
            {hasEndDate && (
              <>
                <TouchableOpacity style={styles.dateSelector} onPress={() => setShowEndPicker(true)}>
                  <Ionicons name="calendar-outline" size={20} color={theme.colors.text} />
                  <Text style={styles.dateSelectorText}>{formatDateDisplay(endDate)}</Text>
                </TouchableOpacity>
                {showEndPicker && (
                  <DateTimePicker value={endDate} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(e, d) => { setShowEndPicker(Platform.OS === 'ios'); if (d) setEndDate(d); }} minimumDate={startDate} />
                )}
              </>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
              {categories.map(cat => (
                <TouchableOpacity key={cat.id} style={[styles.categoryItem, categoryId === cat.id && { backgroundColor: cat.color + '10', borderColor: cat.color, borderWidth: 2 }]} onPress={() => setCategoryId(cat.id)}>
                  <CategoryIcon icon={cat.icon} color={cat.color} size={40} />
                  <Text style={[styles.categoryLabel, categoryId === cat.id && { color: theme.colors.text, fontWeight: theme.fontWeight.semibold }]} numberOfLines={1}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Note (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea, activeInput === 'note' && styles.inputActive]}
              value={note}
              onChangeText={setNote}
              placeholder="Add a note..."
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              onFocus={() => setActiveInput('note')}
              maxLength={200}
              returnKeyType="done"
              onSubmitEditing={() => { Keyboard.dismiss(); setActiveInput('amount'); }}
              blurOnSubmit={true}
            />
          </View>

          <View style={styles.section}>
            <View style={styles.switchRow}>
              <View>
                <Text style={styles.switchLabel}>Active</Text>
                <Text style={styles.switchSubtext}>Auto-generate expenses</Text>
              </View>
              <Switch value={isActive} onValueChange={setIsActive} />
            </View>
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>

        {activeInput === 'amount' && !keyboardVisible && (
          <NumericKeypad value={amount} onValueChange={setAmount} onSave={validateAndSave} />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  flex: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  headerTitle: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.semibold, color: theme.colors.text },
  content: { flex: 1, padding: theme.spacing.lg },
  amountContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: theme.spacing.xl, paddingHorizontal: theme.spacing.md, marginBottom: theme.spacing.lg, backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg, borderWidth: 2, borderColor: theme.colors.border },
  amountContainerActive: { borderColor: theme.colors.text, backgroundColor: theme.colors.surface },
  currencySymbol: { fontSize: 48, fontWeight: theme.fontWeight.bold, color: theme.colors.textSecondary, marginRight: theme.spacing.sm },
  amountDisplay: { fontSize: 56, fontWeight: theme.fontWeight.bold, color: theme.colors.text, minWidth: 150 },
  section: { marginBottom: theme.spacing.xl },
  label: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold, color: theme.colors.textSecondary, marginBottom: theme.spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, fontSize: theme.fontSize.md, color: theme.colors.text, borderWidth: 2, borderColor: theme.colors.border },
  inputActive: { borderColor: theme.colors.text },
  textArea: { minHeight: 100 },
  recurrenceRow: { flexDirection: 'row', gap: theme.spacing.sm },
  recurrenceOption: { flex: 1, flexDirection: 'column', alignItems: 'center', padding: theme.spacing.md, backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, borderWidth: 2, borderColor: theme.colors.border },
  recurrenceOptionActive: { borderColor: theme.colors.text, backgroundColor: theme.colors.background },
  recurrenceLabel: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginTop: theme.spacing.xs },
  recurrenceLabelActive: { color: theme.colors.text, fontWeight: theme.fontWeight.semibold },
  dateSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, borderWidth: 2, borderColor: theme.colors.border, gap: theme.spacing.sm },
  dateSelectorText: { fontSize: theme.fontSize.md, color: theme.colors.text },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.colors.surface, padding: theme.spacing.md, borderRadius: theme.borderRadius.md },
  switchLabel: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold, color: theme.colors.text },
  switchSubtext: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginTop: 2 },
  categoryScroll: { paddingRight: theme.spacing.lg },
  categoryItem: { alignItems: 'center', justifyContent: 'center', padding: theme.spacing.md, borderRadius: theme.borderRadius.md, marginRight: theme.spacing.md, minWidth: 90, backgroundColor: theme.colors.surface, borderWidth: 2, borderColor: theme.colors.border },
  categoryLabel: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginTop: theme.spacing.xs, textAlign: 'center' },
});