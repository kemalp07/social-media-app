import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/colors';

interface Props {
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = { sm: 22, md: 32, lg: 48 };

export function VibeLogo({ size = 'md' }: Props) {
  return (
    <View style={styles.row}>
      <Text style={[styles.logo, { fontSize: SIZES[size] }]}>
        <Text style={styles.primary}>V</Text>
        <Text style={styles.secondary}>i</Text>
        <Text style={styles.primary}>b</Text>
        <Text style={styles.secondary}>e</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  logo: { fontWeight: '800', letterSpacing: -1 },
  primary: { color: colors.primary },
  secondary: { color: colors.secondary },
});
