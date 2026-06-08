import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/constants/colors';

interface Props {
  label: string;
  value: string | number;
  highlight?: boolean;
}

export function StatBox({ label, value, highlight }: Props) {
  return (
    <View style={styles.box}>
      <Text style={[styles.value, highlight && styles.highlight]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    flex: 1,
  },
  value: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  highlight: {
    color: colors.primary,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.xs,
  },
});
