import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

interface NumericKeypadProps {
  value: string;
  onValueChange: (value: string) => void;
  onSave?: () => void;
  maxValue?: number;
  currencySymbol?: string;
}

export const NumericKeypad: React.FC<NumericKeypadProps> = ({
  value,
  onValueChange,
  onSave,
  maxValue = 999999.99,
  currencySymbol = 'RM',
}) => {
  const [operator, setOperator] = useState<'+' | '-' | null>(null);
  const [firstOperand, setFirstOperand] = useState<string>('');

  const handlePress = (key: string) => {
    let newValue = value;

    if (key === 'backspace') {
      newValue = value.slice(0, -1);
      onValueChange(newValue);
    } else if (key === '.') {
      // Only allow one decimal point
      if (!value.includes('.')) {
        newValue = value + key;
        onValueChange(newValue);
      }
    } else if (key === '+' || key === '-') {
      // Store current value as first operand
      if (value) {
        setFirstOperand(value);
        setOperator(key);
        onValueChange('');
      }
    } else if (key === '=') {
      // Calculate result
      if (operator && firstOperand && value) {
        const num1 = parseFloat(firstOperand);
        const num2 = parseFloat(value);
        let result = 0;

        if (operator === '+') {
          result = num1 + num2;
        } else if (operator === '-') {
          result = num1 - num2;
        }

        // Validate result
        if (result >= 0 && result <= maxValue) {
          onValueChange(result.toFixed(2));
        }
        
        // Reset operator state
        setOperator(null);
        setFirstOperand('');
      }
    } else if (key === 'save') {
      // Save the expense
      if (onSave) {
        onSave();
      }
    } else {
      // Add digit
      newValue = value + key;

      // Validate the new value
      const numValue = parseFloat(newValue || '0');
      if (!isNaN(numValue) && numValue <= maxValue) {
        // Check decimal places (max 2)
        const parts = newValue.split('.');
        if (parts.length === 1 || parts[1].length <= 2) {
          onValueChange(newValue);
        }
      }
    }
  };

  const KeyButton = ({ 
    label, 
    onPress, 
    icon, 
    variant = 'default',
    size = 'normal',
  }: { 
    label?: string; 
    onPress: () => void; 
    icon?: any;
    variant?: 'default' | 'operator' | 'save';
    size?: 'normal' | 'large';
  }) => {
    const buttonStyle = [
      styles.key,
      variant === 'operator' && styles.keyOperator,
      variant === 'save' && styles.keySave,
      size === 'large' && styles.keyLarge,
    ];

    const textStyle = [
      styles.keyText,
      variant === 'operator' && styles.keyTextOperator,
      variant === 'save' && styles.keyTextSave,
    ];

    return (
      <TouchableOpacity
        style={buttonStyle}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {icon ? (
          <Ionicons 
            name={icon} 
            size={variant === 'save' ? 32 : 24} 
            color={variant === 'save' ? theme.colors.primary : theme.colors.text} 
          />
        ) : (
          <Text style={textStyle}>{label}</Text>
        )}
      </TouchableOpacity>
    );
  };

  // Show = button if operator is active, otherwise show ✓
  const showCalculate = operator !== null;

  return (
    <View style={styles.container}>
      {/* Display operator state */}
      {operator && (
        <View style={styles.operatorDisplay}>
          <Text style={styles.operatorText}>
            {firstOperand} {operator} {value || '0'}
          </Text>
        </View>
      )}

      <View style={styles.row}>
        <KeyButton label="1" onPress={() => handlePress('1')} />
        <KeyButton label="2" onPress={() => handlePress('2')} />
        <KeyButton label="3" onPress={() => handlePress('3')} />
      </View>

      <View style={styles.row}>
        <KeyButton label="4" onPress={() => handlePress('4')} />
        <KeyButton label="5" onPress={() => handlePress('5')} />
        <KeyButton label="6" onPress={() => handlePress('6')} />
        <KeyButton label="+" onPress={() => handlePress('+')} variant="operator" />
      </View>

      <View style={styles.row}>
        <KeyButton label="7" onPress={() => handlePress('7')} />
        <KeyButton label="8" onPress={() => handlePress('8')} />
        <KeyButton label="9" onPress={() => handlePress('9')} />
        <KeyButton label="-" onPress={() => handlePress('-')} variant="operator" />
      </View>

      <View style={styles.row}>
        <KeyButton label="." onPress={() => handlePress('.')} />
        <KeyButton label="0" onPress={() => handlePress('0')} />
        <KeyButton 
          icon="backspace-outline" 
          onPress={() => handlePress('backspace')} 
        />
        {showCalculate ? (
          <KeyButton 
            label="=" 
            onPress={() => handlePress('=')} 
            variant="operator"
          />
        ) : (
          <KeyButton 
            icon="checkmark" 
            onPress={() => handlePress('save')} 
            variant="save"
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  operatorDisplay: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
  },
  operatorText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.sm,
  },
  key: {
    width: '22%',
    aspectRatio: 2.2,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.small,
  },
  keyLarge: {
    width: '30%',
  },
  keyOperator: {
    backgroundColor: theme.colors.text,
  },
  keySave: {
    backgroundColor: theme.colors.text,
  },
  keyText: {
    fontSize: 28,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  keyTextOperator: {
    fontSize: 32,
    color: theme.colors.primary,
  },
  keyTextSave: {
    fontSize: 28,
    color: theme.colors.primary,
  },
});