// src/screens/AddExpenseScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
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
import { RootStackParamList } from '../types';
import { theme } from '../constants/theme';

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

  // Initialize categories if empty
  useEffect(() => {
    const initStore = useExpenseStore.getState();
    initStore.initializeCategories();
  }, []);

  // Listen to keyboard events
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        // Return to amount input when device keyboard closes
        setActiveInput('amount');
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

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
    return num.toFixed(2);
  };

  const handleSave = () => {
    // Validate before saving
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

    if (isEdit && expense) {
      updateExpense(expense.id, {
        title: title.trim(),
        amount: parsedAmount,
        categoryId,
        date: date.toISOString(),
        note: note.trim(),
      });
    } else {
      addExpense({
        title: title.trim(),
        amount: parsedAmount,
        categoryId,
        date: date.toISOString(),
        note: note.trim(),
      });
    }

    navigation.goBack();
    return true;
  };

  const handleTitleFocus = () => {
    setActiveInput('title');
  };

  const handleNoteFocus = () => {
    setActiveInput('note');
  };

  const handleAmountFocus = () => {
    // Dismiss device keyboard if visible
    Keyboard.dismiss();
    setActiveInput('amount');
  };

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

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Amount Display */}
          <TouchableOpacity 
            style={[
              styles.amountContainer,
              activeInput === 'amount' && !keyboardVisible && styles.amountContainerActive,
            ]}
            onPress={handleAmountFocus}
            activeOpacity={0.7}
          >
            <Text style={styles.currencySymbol}>$</Text>
            <Text style={[
              styles.amountDisplay,
              activeInput === 'amount' && !keyboardVisible && styles.amountDisplayActive,
            ]}>
              {formatAmountDisplay(amount)}
            </Text>
          </TouchableOpacity>

          {/* Title Input */}
          <View style={styles.section}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={[
                styles.input,
                activeInput === 'title' && styles.inputActive,
              ]}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Lunch at cafe"
              placeholderTextColor={theme.colors.textSecondary}
              onFocus={handleTitleFocus}
              maxLength={50}
              returnKeyType="done"
              onSubmitEditing={handleAmountFocus}
            />
          </View>

          {/* Date Selector */}
          <View style={styles.section}>
            <Text style={styles.label}>Date</Text>
            <TouchableOpacity
              style={styles.dateSelector}
              onPress={() => setShowDatePicker(true)}
            >
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
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
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
                        isSelected && { 
                          color: theme.colors.text,
                          fontWeight: theme.fontWeight.semibold,
                        },
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
              style={[
                styles.input, 
                styles.textArea,
                activeInput === 'note' && styles.inputActive,
              ]}
              value={note}
              onChangeText={setNote}
              placeholder="Add a note..."
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              onFocus={handleNoteFocus}
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
          <NumericKeypad
            value={amount}
            onValueChange={setAmount}
            onSave={validateAndSave}
          />
        )}
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
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  amountContainerActive: {
    borderColor: theme.colors.text,
    backgroundColor: theme.colors.surface,
  },
  currencySymbol: {
    fontSize: 48,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSecondary,
    marginRight: theme.spacing.sm,
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