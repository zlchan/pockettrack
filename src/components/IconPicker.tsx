import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

const ICONS = [
  'restaurant', 'fast-food', 'cafe', 'pizza',
  'car', 'bus', 'bicycle', 'airplane',
  'cart', 'bag', 'shirt', 'gift',
  'receipt', 'card', 'cash', 'wallet',
  'game-controller', 'musical-notes', 'film', 'book',
  'fitness', 'medkit', 'heart', 'body',
  'home', 'business', 'school', 'briefcase',
  'paw', 'leaf', 'flower', 'sunny',
  'phone-portrait', 'laptop', 'tv', 'camera',
  'hammer', 'construct', 'settings', 'trophy',
];

interface IconPickerProps {
  visible: boolean;
  selectedIcon: string;
  color: string;
  onSelect: (icon: string) => void;
  onClose: () => void;
}

export const IconPicker: React.FC<IconPickerProps> = ({
  visible,
  selectedIcon,
  color,
  onSelect,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Icon</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.grid}>
              {ICONS.map(icon => (
                <TouchableOpacity
                  key={icon}
                  style={[
                    styles.iconItem,
                    selectedIcon === icon && {
                      backgroundColor: color + '20',
                      borderColor: color,
                      borderWidth: 2,
                    },
                  ]}
                  onPress={() => {
                    onSelect(icon);
                    onClose();
                  }}
                >
                  <Ionicons name={icon as any} size={28} color={color} />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  content: {
    padding: theme.spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -theme.spacing.xs,
  },
  iconItem: {
    width: '20%',
    aspectRatio: 1,
    padding: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'transparent',
    margin: theme.spacing.xs,
  },
});