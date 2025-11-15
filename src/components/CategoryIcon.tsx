import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

interface CategoryIconProps {
  icon: string;
  color: string;
  size?: number;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  icon,
  color,
  size = 40,
}) => {
  return (
    <View
      style={[
        styles.container,
        { 
          width: size, 
          height: size, 
          backgroundColor: color + '20',
          borderRadius: size * 0.3,
        },
      ]}
    >
      <Ionicons 
        name={icon as any} 
        size={size * 0.5} 
        color={color} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});