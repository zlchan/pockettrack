import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useExpenseStore } from '../store/expenseStore';
import { CategoryIcon } from '../components/CategoryIcon';
import { IconPicker } from '../components/IconPicker';
import { ColorPicker } from '../components/ColorPicker';
import { RootStackParamList } from '../types';
import { theme } from '../constants/theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ManageCategory'>;
type ManageCategoryRouteProp = RouteProp<RootStackParamList, 'ManageCategory'>;

export const ManageCategoryScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ManageCategoryRouteProp>();
  const { addCategory, updateCategory } = useExpenseStore();

  const isEdit = !!route.params?.category;
  const category = route.params?.category;

  const [name, setName] = useState(category?.name || '');
  const [icon, setIcon] = useState(category?.icon || 'ellipsis-horizontal');
  const [color, setColor] = useState(category?.color || '#6B7280');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    if (isEdit && category && !category.isDefault) {
      updateCategory(category.id, { name: name.trim(), icon, color });
    } else if (!isEdit) {
      addCategory({ name: name.trim(), icon, color });
    }

    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEdit ? 'Edit Category' : 'Add Category'}
          </Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Preview */}
          <View style={styles.previewContainer}>
            <CategoryIcon icon={icon} color={color} size={80} />
            <Text style={styles.previewName}>{name || 'Category Name'}</Text>
          </View>

          {/* Name Input */}
          <View style={styles.section}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Groceries"
              placeholderTextColor={theme.colors.textSecondary}
              autoFocus={!isEdit}
            />
          </View>

          {/* Icon Selector */}
          <View style={styles.section}>
            <Text style={styles.label}>Icon</Text>
            <TouchableOpacity
              style={styles.selector}
              onPress={() => setShowIconPicker(true)}
            >
              <View style={styles.selectorLeft}>
                <CategoryIcon icon={icon} color={color} size={40} />
                <Text style={styles.selectorText}>Select Icon</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Color Selector */}
          <View style={styles.section}>
            <Text style={styles.label}>Color</Text>
            <TouchableOpacity
              style={styles.selector}
              onPress={() => setShowColorPicker(true)}
            >
              <View style={styles.selectorLeft}>
                <View
                  style={[styles.colorPreview, { backgroundColor: color }]}
                />
                <Text style={styles.selectorText}>Select Color</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {isEdit && category?.isDefault && (
            <Text style={styles.warningText}>
              Default categories cannot be edited
            </Text>
          )}
        </View>

        {/* Modals */}
        <IconPicker
          visible={showIconPicker}
          selectedIcon={icon}
          color={color}
          onSelect={setIcon}
          onClose={() => setShowIconPicker(false)}
        />

        <ColorPicker
          visible={showColorPicker}
          selectedColor={color}
          onSelect={setColor}
          onClose={() => setShowColorPicker(false)}
        />
      </KeyboardAvoidingView>
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
  saveButton: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  previewContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  previewName: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
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
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  selectorText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  colorPreview: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.small,
  },
  warningText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
});