export interface Category {
  id: string;
  name: string;
  icon: string; // Ionicons name
  color: string;
  isDefault: boolean; // Can't delete default categories
  createdAt: string;
}

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
  amount: number;
  categoryId: string; // Changed from category: Category
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