import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface BackupData {
  version: string;
  exportDate: string;
  data: {
    expenses: any[];
    categories: any[];
    recurringExpenses: any[];
    displayCurrency: string;
  };
}

export class BackupService {
  private static readonly BACKUP_VERSION = '1.0.0';
  private static readonly STORAGE_KEY = 'expense-storage';

  /**
   * Export all data to a JSON file
   */
  static async exportData(): Promise<boolean> {
    try {
      // Get all data from AsyncStorage
      const storageData = await AsyncStorage.getItem(this.STORAGE_KEY);
      
      if (!storageData) {
        Alert.alert('No Data', 'There is no data to export.');
        return false;
      }

      const parsedData = JSON.parse(storageData);

      // Create backup object
      const backup: BackupData = {
        version: this.BACKUP_VERSION,
        exportDate: new Date().toISOString(),
        data: {
          expenses: parsedData.state?.expenses || [],
          categories: parsedData.state?.categories || [],
          recurringExpenses: parsedData.state?.recurringExpenses || [],
          displayCurrency: parsedData.state?.displayCurrency || 'MYR',
        },
      };

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `expense-tracker-backup-${timestamp}.json`;
      // Some TS environments don't expose documentDirectory on the FileSystem type.
      // Use a safe fallback and cast to any to avoid type errors.
      const baseDir = (FileSystem as any).documentDirectory ?? (FileSystem as any).cacheDirectory ?? '';
      const fileUri = `${baseDir}${filename}`;

      // Write to file
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(backup, null, 2), {
        encoding: 'utf8',
      });

      // Share the file
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Expense Data',
          UTI: 'public.json',
        });
      } else {
        Alert.alert(
          'Export Complete',
          `Data exported to: ${fileUri}`
        );
      }

      return true;
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert(
        'Export Failed',
        'An error occurred while exporting data. Please try again.'
      );
      return false;
    }
  }

  /**
   * Export data as CSV format
   */
  static async exportAsCSV(): Promise<boolean> {
    try {
      const storageData = await AsyncStorage.getItem(this.STORAGE_KEY);
      
      if (!storageData) {
        Alert.alert('No Data', 'There is no data to export.');
        return false;
      }

      const parsedData = JSON.parse(storageData);
      const expenses = parsedData.state?.expenses || [];

      if (expenses.length === 0) {
        Alert.alert('No Expenses', 'There are no expenses to export.');
        return false;
      }

      // Create CSV header
      let csvContent = 'Date,Title,Amount,Category,Note,Original Amount,Original Currency\n';

      // Add expense rows
      expenses.forEach((expense: any) => {
        const date = new Date(expense.date).toLocaleDateString();
        const title = `"${expense.title.replace(/"/g, '""')}"`;
        const amount = expense.amount;
        const categoryId = expense.categoryId;
        const note = expense.note ? `"${expense.note.replace(/"/g, '""')}"` : '';
        const originalAmount = expense.originalAmount || '';
        const originalCurrency = expense.originalCurrency || '';

        csvContent += `${date},${title},${amount},${categoryId},${note},${originalAmount},${originalCurrency}\n`;
      });

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `expense-tracker-export-${timestamp}.csv`;
      const baseDir = (FileSystem as any).documentDirectory ?? (FileSystem as any).cacheDirectory ?? '';
      const fileUri = `${baseDir}${filename}`;

      // Write to file
      await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: 'utf8' });

      // Share the file
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Expenses as CSV',
        });
      }

      return true;
    } catch (error) {
      console.error('CSV export error:', error);
      Alert.alert(
        'Export Failed',
        'An error occurred while exporting CSV. Please try again.'
      );
      return false;
    }
  }

  /**
   * Import data from a JSON backup file
   */
  static async importData(): Promise<boolean> {
    try {
      // Pick a document
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return false;
      }

      const fileUri = result.assets[0].uri;

      // Read file content
      const fileContent = await FileSystem.readAsStringAsync(fileUri, { encoding: 'utf8' });

      // Parse and validate backup data
      const backup: BackupData = JSON.parse(fileContent);

      if (!this.validateBackup(backup)) {
        Alert.alert(
          'Invalid Backup',
          'The selected file is not a valid backup file.'
        );
        return false;
      }

      // Show confirmation dialog
      return new Promise((resolve) => {
        Alert.alert(
          'Restore Data',
          `This will restore:\n• ${backup.data.expenses.length} expenses\n• ${backup.data.categories.length} categories\n• ${backup.data.recurringExpenses.length} recurring expenses\n\nCurrent data will be replaced. Continue?`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => resolve(false),
            },
            {
              text: 'Restore',
              style: 'destructive',
              onPress: async () => {
                const success = await this.restoreData(backup);
                resolve(success);
              },
            },
          ]
        );
      });
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert(
        'Import Failed',
        'An error occurred while importing data. Please make sure you selected a valid backup file.'
      );
      return false;
    }
  }

  /**
   * Validate backup data structure
   */
  private static validateBackup(backup: any): boolean {
    if (!backup || typeof backup !== 'object') return false;
    if (!backup.version || !backup.exportDate || !backup.data) return false;
    if (!Array.isArray(backup.data.expenses)) return false;
    if (!Array.isArray(backup.data.categories)) return false;
    if (!Array.isArray(backup.data.recurringExpenses)) return false;
    return true;
  }

  /**
   * Restore data to AsyncStorage
   */
  private static async restoreData(backup: BackupData): Promise<boolean> {
    try {
      // Get current storage structure
      const currentData = await AsyncStorage.getItem(this.STORAGE_KEY);
      let storageStructure = currentData ? JSON.parse(currentData) : { state: {} };

      // Replace state data
      storageStructure.state = {
        ...storageStructure.state,
        expenses: backup.data.expenses,
        categories: backup.data.categories,
        recurringExpenses: backup.data.recurringExpenses,
        displayCurrency: backup.data.displayCurrency,
      };

      // Save to AsyncStorage
      await AsyncStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(storageStructure)
      );

      Alert.alert(
        'Restore Complete',
        'Your data has been successfully restored. Please restart the app to see the changes.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Force app to reload from storage
              if (Platform.OS === 'ios' || Platform.OS === 'android') {
                // The app will reload the data on next launch
              }
            },
          },
        ]
      );

      return true;
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert(
        'Restore Failed',
        'An error occurred while restoring data. Please try again.'
      );
      return false;
    }
  }

  /**
   * Create automatic backup
   */
  static async createAutoBackup(): Promise<void> {
    try {
      const storageData = await AsyncStorage.getItem(this.STORAGE_KEY);
      
      if (!storageData) return;

      const parsedData = JSON.parse(storageData);
      const backup: BackupData = {
        version: this.BACKUP_VERSION,
        exportDate: new Date().toISOString(),
        data: {
          expenses: parsedData.state?.expenses || [],
          categories: parsedData.state?.categories || [],
          recurringExpenses: parsedData.state?.recurringExpenses || [],
          displayCurrency: parsedData.state?.displayCurrency || 'MYR',
        },
      };

      // Save auto-backup to a separate key
      await AsyncStorage.setItem(
        'expense-auto-backup',
        JSON.stringify(backup)
      );
    } catch (error) {
      console.error('Auto-backup error:', error);
    }
  }

  /**
   * Get backup info (size, date, etc.)
   */
  static async getBackupInfo(): Promise<{
    hasBackup: boolean;
    expenseCount: number;
    categoryCount: number;
    recurringCount: number;
    lastBackupDate: string | null;
  }> {
    try {
      const storageData = await AsyncStorage.getItem(this.STORAGE_KEY);
      
      if (!storageData) {
        return {
          hasBackup: false,
          expenseCount: 0,
          categoryCount: 0,
          recurringCount: 0,
          lastBackupDate: null,
        };
      }

      const parsedData = JSON.parse(storageData);
      
      return {
        hasBackup: true,
        expenseCount: parsedData.state?.expenses?.length || 0,
        categoryCount: parsedData.state?.categories?.length || 0,
        recurringCount: parsedData.state?.recurringExpenses?.length || 0,
        lastBackupDate: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Get backup info error:', error);
      return {
        hasBackup: false,
        expenseCount: 0,
        categoryCount: 0,
        recurringCount: 0,
        lastBackupDate: null,
      };
    }
  }
}