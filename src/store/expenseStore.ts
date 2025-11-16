import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Expense, Category } from '../types';

// Default categories
const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'cat_food',
    name: 'Food',
    icon: 'restaurant',
    color: '#F59E0B',
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cat_transport',
    name: 'Transport',
    icon: 'car',
    color: '#3B82F6',
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cat_shopping',
    name: 'Shopping',
    icon: 'cart',
    color: '#EC4899',
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cat_bills',
    name: 'Bills',
    icon: 'receipt',
    color: '#EF4444',
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
    {
    id: 'cat_sports',
    name: 'Sports',
    icon: 'fitness',
    color: '#d9ff00ff',
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cat_entertainment',
    name: 'Entertainment',
    icon: 'game-controller',
    color: '#8B5CF6',
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cat_health',
    name: 'Health',
    icon: 'fitness',
    color: '#10B981',
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cat_other',
    name: 'Other',
    icon: 'ellipsis-horizontal',
    color: '#6B7280',
    isDefault: true,
    createdAt: new Date().toISOString(),
  },
];

interface ExpenseState {
  expenses: Expense[];
  categories: Category[];
  
  // Expense methods
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  getExpenseById: (id: string) => Expense | undefined;
  getExpensesByCategory: (categoryId: string) => Expense[];
  getTotalByCategory: (categoryId: string) => number;
  getMonthlyTotal: () => number;
  
  // Category methods
  addCategory: (category: Omit<Category, 'id' | 'createdAt' | 'isDefault'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string, deleteExpenses?: boolean) => void;
  getCategoryById: (id: string) => Category | undefined;
  initializeCategories: () => void;
}

export const useExpenseStore = create<ExpenseState>()(
  persist(
    (set, get) => ({
      expenses: [],
      categories: [],

      // Initialize default categories if empty
      initializeCategories: () => {
        const { categories } = get();
        if (categories.length === 0) {
          set({ categories: DEFAULT_CATEGORIES });
        }
      },

      // Expense methods
      addExpense: expense => {
        const newExpense: Expense = {
          ...expense,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          createdAt: new Date().toISOString(),
        };
        set(state => ({
          expenses: [newExpense, ...state.expenses],
        }));
      },

      updateExpense: (id, updatedData) => {
        set(state => ({
          expenses: state.expenses.map(expense =>
            expense.id === id ? { ...expense, ...updatedData } : expense
          ),
        }));
      },

      deleteExpense: id => {
        set(state => ({
          expenses: state.expenses.filter(expense => expense.id !== id),
        }));
      },

      getExpenseById: id => {
        return get().expenses.find(expense => expense.id === id);
      },

      getExpensesByCategory: categoryId => {
        return get().expenses.filter(expense => expense.categoryId === categoryId);
      },

      getTotalByCategory: categoryId => {
        return get()
          .expenses.filter(expense => expense.categoryId === categoryId)
          .reduce((sum, expense) => sum + expense.amount, 0);
      },

      getMonthlyTotal: () => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        return get()
          .expenses.filter(expense => new Date(expense.date) >= firstDay)
          .reduce((sum, expense) => sum + expense.amount, 0);
      },

      // Category methods
      addCategory: category => {
        const newCategory: Category = {
          ...category,
          id: 'cat_' + Date.now().toString() + Math.random().toString(36).substr(2, 9),
          isDefault: false,
          createdAt: new Date().toISOString(),
        };
        set(state => ({
          categories: [...state.categories, newCategory],
        }));
      },

      updateCategory: (id, updatedData) => {
        set(state => ({
          categories: state.categories.map(category =>
            category.id === id && !category.isDefault
              ? { ...category, ...updatedData }
              : category
          ),
        }));
      },

      deleteCategory: (id, deleteExpenses = false) => {
        const category = get().getCategoryById(id);
        if (!category || category.isDefault) return;

        if (deleteExpenses) {
          // Delete all expenses in this category
          set(state => ({
            expenses: state.expenses.filter(e => e.categoryId !== id),
            categories: state.categories.filter(c => c.id !== id),
          }));
        } else {
          // Move expenses to "Other" category
          const otherCategory = get().categories.find(c => c.name === 'Other');
          if (otherCategory) {
            set(state => ({
              expenses: state.expenses.map(e =>
                e.categoryId === id ? { ...e, categoryId: otherCategory.id } : e
              ),
              categories: state.categories.filter(c => c.id !== id),
            }));
          }
        }
      },

      getCategoryById: id => {
        return get().categories.find(category => category.id === id);
      },
    }),
    {
      name: 'expense-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        // Initialize categories after rehydration
        if (state) {
          state.initializeCategories();
        }
      },
    }
  )
);