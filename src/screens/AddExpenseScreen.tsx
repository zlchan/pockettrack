import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Keyboard,
  Modal,
  FlatList,
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
import { Platform } from 'react-native';

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
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [activeInput, setActiveInput] = useState<'amount' | 'title' | 'note' | null>('amount');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(
    expense?.originalCurrency 
      ? getCurrencyByCode(expense.originalCurrency)
      : getDefaultCurrency()
  );
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

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
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isSameDay = (d1: Date, d2: Date) =>
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();

    if (isSameDay(date, today)) return 'Today';
    if (isSameDay(date, yesterday)) return 'Yesterday';

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

  const handleAmountFocus = () => {
    Keyboard.dismiss();
    setActiveInput('amount');
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
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

    const baseAmount = selectedCurrency.code === 'MYR' 
      ? parsedAmount 
      : convertToBaseCurrency(parsedAmount, selectedCurrency.code);

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

  const selectedCategory = getCategoryById(categoryId);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.flex}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEdit ? 'Edit Expense' : 'Add Expense'}
          </Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.content}>
          {/* Amount Display */}
          <TouchableOpacity 
            style={[
              styles.amountContainer,
              activeInput === 'amount' && !keyboardVisible && styles.amountContainerActive,
            ]}
            onPress={handleAmountFocus}
            activeOpacity={0.7}
          >
            <TouchableOpacity 
              style={styles.currencyButton}
              onPress={() => setShowCurrencyPicker(true)}
            >
              <Text style={styles.currencySymbol}>{selectedCurrency.symbol}</Text>
              <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.amountDisplay}>
              {formatAmountDisplay(amount)}
            </Text>
          </TouchableOpacity>

          {/* Conversion Info */}
          {selectedCurrency.code !== 'MYR' && amount && (
            <View style={styles.conversionInfo}>
              <Ionicons name="swap-horizontal" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.conversionText}>
                ≈ {formatCurrencyWithCode(
                  convertToBaseCurrency(parseFloat(amount) || 0, selectedCurrency.code),
                  'MYR'
                )}
              </Text>
            </View>
          )}

          {/* Title Input */}
          <TextInput
            style={[styles.input, activeInput === 'title' && styles.inputActive]}
            value={title}
            onChangeText={setTitle}
            placeholder="What did you spend on?"
            placeholderTextColor={theme.colors.textSecondary}
            onFocus={() => setActiveInput('title')}
            maxLength={50}
            returnKeyType="done"
            onSubmitEditing={handleAmountFocus}
          />

          {/* Date and Category Row */}
          <View style={styles.pickerRow}>
            {/* Date Picker */}
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={theme.colors.text} />
              <Text style={styles.pickerText}>{formatDateDisplay(date)}</Text>
            </TouchableOpacity>

            {/* Category Picker */}
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowCategoryPicker(true)}
            >
              {selectedCategory && (
                <CategoryIcon 
                  icon={selectedCategory.icon} 
                  color={selectedCategory.color} 
                  size={24} 
                />
              )}
              <Text style={styles.pickerText} numberOfLines={1}>
                {selectedCategory?.name || 'Category'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Note Input */}
          <TextInput
            style={[styles.input, styles.noteInput, activeInput === 'note' && styles.inputActive]}
            value={note}
            onChangeText={setNote}
            placeholder="Add a note (optional)"
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
            onFocus={() => setActiveInput('note')}
            maxLength={200}
            returnKeyType="done"
            onSubmitEditing={handleAmountFocus}
            blurOnSubmit={true}
          />
        </View>

        {/* Custom Numeric Keypad */}
        {activeInput === 'amount' && !keyboardVisible && (
          <NumericKeypad
            value={amount}
            onValueChange={setAmount}
            onSave={validateAndSave}
            currencySymbol={selectedCurrency.symbol}
          />
        )}

        {/* Date Picker Modal */}
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )}

        {/* Category Picker Modal */}
        <Modal
          visible={showCategoryPicker}
          animationType="slide"
          transparent
          onRequestClose={() => setShowCategoryPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Category</Text>
                <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                  <Ionicons name="close" size={24} color={theme.colors.text} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={categories}
                numColumns={3}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.categoryItem,
                      categoryId === item.id && styles.categoryItemActive,
                    ]}
                    onPress={() => {
                      setCategoryId(item.id);
                      setShowCategoryPicker(false);
                    }}
                  >
                    <CategoryIcon icon={item.icon} color={item.color} size={40} />
                    <Text style={styles.categoryLabel} numberOfLines={1}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.categoryGrid}
              />
            </View>
          </View>
        </Modal>

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
  conversionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  conversionText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    borderWidth: 2,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  inputActive: {
    borderColor: theme.colors.text,
  },
  noteInput: {
    minHeight: 80,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  pickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  pickerText: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  categoryGrid: {
    padding: theme.spacing.md,
  },
  categoryItem: {
    flex: 1,
    alignItems: 'center',
    padding: theme.spacing.md,
    margin: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
    minWidth: 100,
    maxWidth: 120,
  },
  categoryItemActive: {
    backgroundColor: theme.colors.text + '10',
    borderWidth: 2,
    borderColor: theme.colors.text,
  },
  categoryLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
    fontWeight: theme.fontWeight.medium,
  },
});