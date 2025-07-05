
import React, { useContext } from 'react';
import { View, Text } from 'react-native';
import { useTheme } from 'react-native-paper';
import { ThemeContext } from '../../ThemeContext';
import styles from './styles';

const History = () => {
  const { colors } = useTheme();
  const { isDarkMode } = useContext(ThemeContext);

  return (
    <View style={styles.tabContent}>
      <Text style={[styles.title, { color: colors.text }]}>Reward History</Text>
      <Text style={[styles.emptyText, { color: colors.text }]}>No history available.</Text>
    </View>
  );
};

export default History;
