export interface Category {
  id: string;
  name: string;
  icon: string; // Ionicons name
  color: string;
  isDefault: boolean; // Can't delete default categories
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
}

export type RootStackParamList = {
  Main: undefined;
  AddExpense: { expense?: Expense };
  ManageCategory: { category?: Category };
};

export type TabParamList = {
  Home: undefined;
  Categories: undefined;
  Summary: undefined;
  User: undefined;
};