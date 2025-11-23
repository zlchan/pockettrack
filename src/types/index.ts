export interface Category {
  id: string;
  name: string;
  icon: string; // Ionicons name
  color: string;
  isDefault: boolean; // Can't delete default categories
  createdAt: string;
}

export type Currency = {
  code: string;
  symbol: string;
  name: string;
  rate: number; // Conversion rate to base currency (MYR)
};

export const CURRENCIES: Currency[] = [
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', rate: 1.0 },
  { code: 'USD', symbol: '$', name: 'US Dollar', rate: 0.22 },
  { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.20 },
  { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.17 },
  { code: 'SGD', symbol: '$', name: 'Singapore Dollar', rate: 0.30 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: 33.5 },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', rate: 1.58 },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', rate: 7.85 },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', rate: 3450 },
  { code: 'AUD', symbol: '$', name: 'Australian Dollar', rate: 0.34 },
];

export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'none';

export interface RecurringExpense {
  id: string;
  title: string;
  amount: number;
  categoryId: string;
  note?: string;
  recurrenceType: RecurrenceType;
  startDate: string; // ISO string
  endDate?: string; // ISO string - optional
  lastGenerated?: string; // ISO string - last time expense was auto-created
  isActive: boolean;
  createdAt: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number; // Always stored in base currency (MYR)
  originalAmount?: number; // Original amount if converted
  originalCurrency?: string; // Original currency code if converted
  categoryId: string;
  date: string; // ISO string
  note?: string;
  createdAt: string;
  recurringExpenseId?: string; // Link to recurring expense if auto-generated
}

export type RootStackParamList = {
  Main: undefined;
  AddExpense: { expense?: Expense; recurringExpense?: RecurringExpense };
  ManageCategory: { category?: Category };
  ManageRecurring: { recurringExpense?: RecurringExpense };
};

export type TabParamList = {
  Home: undefined;
  Categories: undefined;
  Summary: undefined;
  User: undefined;
};