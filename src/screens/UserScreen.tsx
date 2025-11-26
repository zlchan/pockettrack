import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useExpenseStore } from '../store/expenseStore';
import { theme } from '../constants/theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { CurrencyPicker } from '../components/CurrencyPicker';
import { BackupService } from '../services/BackupService';
import {
  getCurrencyByCode
} from '../utils/currencyUtils';
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const UserScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const expenses = useExpenseStore(state => state.expenses);
  const recurringExpenses = useExpenseStore(state => state.recurringExpenses);
  const displayCurrency = useExpenseStore(state => state.displayCurrency);
  const setDisplayCurrency = useExpenseStore(state => state.setDisplayCurrency);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [backupInfo, setBackupInfo] = useState({
    hasBackup: false,
    expenseCount: 0,
    categoryCount: 0,
    recurringCount: 0,
    lastBackupDate: null as string | null,
  });
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadBackupInfo();
  }, []);

  const loadBackupInfo = async () => {
    const info = await BackupService.getBackupInfo();
    setBackupInfo(info);
  };

  const handleExportJSON = async () => {
    Alert.alert(
      'Export Data',
      'Export all your data to a JSON file. You can use this to restore your data later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: async () => {
            setIsExporting(true);
            const success = await BackupService.exportData();
            setIsExporting(false);
            if (success) {
              await BackupService.createAutoBackup();
              await loadBackupInfo();
            }
          },
        },
      ]
    );
  };

  const handleExportCSV = async () => {
    Alert.alert(
      'Export as CSV',
      'Export your expenses to a CSV file for use in spreadsheet applications.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: async () => {
            setIsExporting(true);
            await BackupService.exportAsCSV();
            setIsExporting(false);
          },
        },
      ]
    );
  };

  const handleImportData = async () => {
    Alert.alert(
      'Import Data',
      'Import data from a backup file. This will replace your current data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: async () => {
            setIsImporting(true);
            const success = await BackupService.importData();
            setIsImporting(false);
            if (success) {
              await loadBackupInfo();
              // Reload the app state
              setTimeout(() => {
                Alert.alert(
                  'Success',
                  'Data imported successfully. Please restart the app to see all changes.',
                  [{ text: 'OK' }]
                );
              }, 500);
            }
          },
        },
      ]
    );
  };

  const handleNavigateToRecurring = () => {
    navigation.navigate('RecurringList' as never);
  };

  const handleCurrencyChange = (currency: any) => {
    setDisplayCurrency(currency.code);
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      `This will delete all ${expenses.length} expenses. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            // Clear all expenses by deleting one by one
            expenses.forEach(expense => {
              useExpenseStore.getState().deleteExpense(expense.id);
            });
            Alert.alert('Success', 'All data has been cleared');
            loadBackupInfo();
          },
        },
      ]
    );
  };

  const SettingItem = ({
    icon,
    label,
    value,
    onPress,
    danger,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value?: string;
    onPress?: () => void;
    danger?: boolean;
  }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingLeft}>
        <Ionicons
          name={icon}
          size={24}
          color={danger ? theme.colors.error : theme.colors.text}
        />
        <Text
          style={[styles.settingLabel, danger && { color: theme.colors.error }]}
        >
          {label}
        </Text>
      </View>
      {value && (
        <Text style={styles.settingValue}>{value}</Text>
      )}
      {onPress && !danger && (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={theme.colors.textSecondary}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <Animated.ScrollView 
        style={[styles.content, { opacity: fadeAnim }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Backup & Restore */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Backup & Restore</Text>
          <View style={styles.card}>
            <SettingItem
              icon="cloud-upload-outline"
              label="Export Data (Backup)"
              value={isExporting ? 'Exporting...' : undefined}
              onPress={!isExporting ? handleExportJSON : undefined}
            />
            <View style={styles.divider} />
            <SettingItem
              icon="document-text-outline"
              label="Export as CSV"
              value={isExporting ? 'Exporting...' : undefined}
              onPress={!isExporting ? handleExportCSV : undefined}
            />
            <View style={styles.divider} />
            <SettingItem
              icon="cloud-download-outline"
              label="Import Data"
              value={isImporting ? 'Importing...' : undefined}
              onPress={!isImporting ? handleImportData : undefined}
            />
          </View>
          {backupInfo.hasBackup && (
            <Text style={styles.backupInfo}>
              Current data: {backupInfo.expenseCount} expenses, {backupInfo.categoryCount} categories
            </Text>
          )}
        </View>

        {/* Display Currency */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Display</Text>
          <View style={styles.card}>
            <SettingItem
              icon="cash-outline"
              label="Display Currency"
              value={`${getCurrencyByCode(displayCurrency).symbol} ${displayCurrency}`}
              onPress={() => setShowCurrencyPicker(true)}
            />
          </View>
        </View>

        {/* Recurring Expenses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Automation</Text>
          <View style={styles.card}>
            <SettingItem
              icon="repeat"
              label="Recurring Expenses"
              value={recurringExpenses.length.toString()}
              onPress={handleNavigateToRecurring}
            />
          </View>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Info</Text>
          <View style={styles.card}>
            <SettingItem
              icon="wallet-outline"
              label="Total Expenses"
              value={expenses.length.toString()}
            />
            <View style={styles.divider} />
            <SettingItem icon="information-circle-outline" label="Version" value="1.0.0" />
          </View>
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <View style={styles.card}>
            <SettingItem
              icon="trash-outline"
              label="Clear All Data"
              onPress={handleClearData}
              danger
            />
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <SettingItem icon="help-circle-outline" label="Help & Support" onPress={() => {}} />
            <View style={styles.divider} />
            <SettingItem icon="document-text-outline" label="Privacy Policy" onPress={() => {}} />
            <View style={styles.divider} />
            <SettingItem icon="shield-checkmark-outline" label="Terms of Service" onPress={() => {}} />
          </View>
        </View>

        <Text style={styles.footer}>
          Made with ❤️ for simple expense tracking
        </Text>
      </Animated.ScrollView>

      {/* Currency Picker Modal */}
      <CurrencyPicker
        visible={showCurrencyPicker}
        selectedCurrency={displayCurrency}
        onSelect={handleCurrencyChange}
        onClose={() => setShowCurrencyPicker(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.small,
  },
  headerTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: 100,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    ...theme.shadows.small,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  settingLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    marginLeft: theme.spacing.md,
  },
  settingValue: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginRight: theme.spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: theme.spacing.md + 24 + theme.spacing.md,
  },
  backupInfo: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
  },
  footer: {
    textAlign: 'center',
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xl,
  },
});