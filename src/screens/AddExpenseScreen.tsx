import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Keyboard,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useExpenseStore } from '../store/expenseStore';
import { CategoryIcon } from '../components/CategoryIcon';
import { NumericKeypad } from '../components/NumericKeypad';
import { CurrencyPicker } from '../components/CurrencyPicker';
import { RootStackParamList, Currency } from '../types';
import { theme } from '../constants/theme';
import {
  getDefaultCurrency,
  getCurrencyByCode,
  convertToBaseCurrency,
  formatCurrencyWithCode,
} from '../utils/currencyUtils';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddExpense'>;
type AddExpenseRouteProp = RouteProp<RootStackParamList, 'AddExpense'>;

export const AddExpenseScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<AddExpenseRouteProp>();
  const { addExpense, updateExpense, categories, getCategoryById } = useExpenseStore();

  const isEdit = !!route.params?.expense;
  const expense = route.params?.expense;

  const [title, setTitle] = useState(expense?.title || '');
  const [amount, setAmount] = useState(expense?.amount?.toString() || '');
  const [categoryId, setCategoryId] = useState(expense?.categoryId || categories[0]?.id || '');
  const [note, setNote] = useState(expense?.note || '');
  const [date, setDate] = useState(expense?.date ? new Date(expense.date) : new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeInput, setActiveInput] = useState<'amount' | 'title' | 'note' | null>('amount');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(
    expense?.originalCurrency ? getCurrencyByCode(expense.originalCurrency) : getDefaultCurrency()
  );
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  // Initialize default categories only if none exist
  useEffect(() => {
    const initStore = useExpenseStore.getState();
    if (!initStore.categories || initStore.categories.length === 0) {
      initStore.initializeCategories();
    }
  }, []);

  // Keyboard listeners: show native keyboard state and restore numeric keypad on hide
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
      // If user was editing title/note, return to amount input when keyboard closes
      setActiveInput(prev => (prev === 'title' || prev === 'note' ? 'amount' : prev));
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleTitleFocus = () => {
    setActiveInput('title');
  };

  const handleNoteFocus = () => {
    setActiveInput('note');
  };

  const handleAmountFocus = () => {
    // Dismiss device keyboard if visible and show custom keypad
    Keyboard.dismiss();
    setActiveInput('amount');
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const formatDateDisplay = (date: Date): string => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isSameDay = (d1: Date, d2: Date) =>
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();

    if (isSameDay(date, today)) return 'Today';
    if (isSameDay(date, yesterday)) return 'Yesterday';
    if (isSameDay(date, tomorrow)) return 'Tomorrow';

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  };

  const formatAmountDisplay = (value: string): string => {
    if (!value) return '0.00';
    const num = parseFloat(value);
    if (isNaN(num)) return '0.00';

    if (selectedCurrency.code === 'JPY' || selectedCurrency.code === 'IDR') {
      return Math.round(num).toString();
    }
    return num.toFixed(2);
  };

  const handleCurrencySelect = (currency: Currency) => {
    setSelectedCurrency(currency);
    setAmount('');
  };

  const handleSave = () => {
    if (!validateAndSave()) {
      return;
    }
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

    const baseAmount =
      selectedCurrency.code === 'MYR' ? parsedAmount : convertToBaseCurrency(parsedAmount, selectedCurrency.code);

    const expenseData = {
      title: title.trim(),
      amount: baseAmount,
      originalAmount: selectedCurrency.code !== 'MYR' ? parsedAmount : undefined,
      originalCurrency: selectedCurrency.code !== 'MYR' ? selectedCurrency.code : undefined,
      categoryId,
      date: date.toISOString(),
      note: note.trim(),
    };

    if (isEdit && expense) {
      updateExpense(expense.id, expenseData);
    } else {
      addExpense(expenseData);
    }

    navigation.goBack();
    return true;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.flex}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEdit ? 'Edit Expense' : 'Add Expense'}</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Amount Display */}
          <TouchableOpacity
            style={[
              styles.amountContainer,
              activeInput === 'amount' && !keyboardVisible && styles.amountContainerActive,
            ]}
            onPress={handleAmountFocus}
            activeOpacity={0.7}
          >
            <TouchableOpacity style={styles.currencyButton} onPress={() => setShowCurrencyPicker(true)}>
              <Text style={styles.currencySymbol}>{selectedCurrency.symbol}</Text>
              <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            <Text
              style={[
                styles.amountDisplay,
                activeInput === 'amount' && !keyboardVisible && styles.amountDisplayActive,
              ]}
            >
              {formatAmountDisplay(amount)}
            </Text>
          </TouchableOpacity>

          {/* Currency Info */}
          {selectedCurrency.code !== 'MYR' && amount && (
            <View style={styles.conversionInfo}>
              <Ionicons name="swap-horizontal" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.conversionText}>
                ≈{' '}
                {formatCurrencyWithCode(
                  convertToBaseCurrency(parseFloat(amount) || 0, selectedCurrency.code),
                  'MYR'
                )}
              </Text>
            </View>
          )}

          {/* Title Input */}
          <View style={styles.section}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={[styles.input, activeInput === 'title' && styles.inputActive]}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Lunch at cafe"
              placeholderTextColor={theme.colors.textSecondary}
              onFocus={handleTitleFocus}
              onBlur={() => {
                setActiveInput('amount');
                Keyboard.dismiss();
              }}
              maxLength={50}
              returnKeyType="done"
              onSubmitEditing={handleAmountFocus}
            />
          </View>

          {/* Date Selector */}
          <View style={styles.section}>
            <Text style={styles.label}>Date</Text>
            <TouchableOpacity style={styles.dateSelector} onPress={() => setShowDatePicker(true)}>
              <View style={styles.dateSelectorLeft}>
                <Ionicons name="calendar-outline" size={24} color={theme.colors.text} />
                <Text style={styles.dateSelectorText}>{formatDateDisplay(date)}</Text>
              </View>
              <Text style={styles.dateSelectorSubtext}>
                {date.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}
          </View>

          {/* Category Selection */}
          <View style={styles.section}>
            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
              {categories.map(cat => {
                const isSelected = categoryId === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryItem,
                      isSelected && {
                        backgroundColor: cat.color + '10',
                        borderColor: cat.color,
                        borderWidth: 2,
                      },
                    ]}
                    onPress={() => setCategoryId(cat.id)}
                  >
                    <CategoryIcon icon={cat.icon} color={cat.color} size={40} />
                    <Text
                      style={[
                        styles.categoryLabel,
                        isSelected && { color: theme.colors.text, fontWeight: theme.fontWeight.semibold },
                      ]}
                      numberOfLines={1}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Note Input */}
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
              onFocus={handleNoteFocus}
              onBlur={() => {
                setActiveInput('amount');
                Keyboard.dismiss();
              }}
              onEndEditing={() => {
                setActiveInput('amount');
              }}
              maxLength={200}
              returnKeyType="done"
              onSubmitEditing={handleAmountFocus}
              blurOnSubmit={true}
            />
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Custom Numeric Keypad - Show when amount is active and device keyboard is hidden */}
        {activeInput === 'amount' && !keyboardVisible && (
          <NumericKeypad value={amount} onValueChange={setAmount} onSave={validateAndSave} currencySymbol={selectedCurrency.symbol} />
        )}

        {/* Currency Picker Modal */}
        <CurrencyPicker
          visible={showCurrencyPicker}
          selectedCurrency={selectedCurrency.code}
          onSelect={handleCurrencySelect}
          onClose={() => setShowCurrencyPicker(false)}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  amountContainerActive: {
    borderColor: theme.colors.text,
    backgroundColor: theme.colors.surface,
  },
  currencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
    padding: theme.spacing.xs,
  },
  currencySymbol: {
    fontSize: 48,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginRight: 4,
  },
  amountDisplay: {
    fontSize: 56,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    minWidth: 150,
  },
  amountDisplayActive: {
    color: theme.colors.text,
  },
  conversionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.xs,
  },
  conversionText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  inputActive: {
    borderColor: theme.colors.text,
  },
  textArea: {
    minHeight: 100,
  },
  dateSelector: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  dateSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  dateSelectorText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  dateSelectorSubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginLeft: 32,
  },
  categoryScroll: {
    paddingRight: theme.spacing.lg,
  },
  categoryItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.md,
    minWidth: 90,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  categoryLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
});