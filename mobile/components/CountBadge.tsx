import { StyleSheet, Text, View } from 'react-native';

const BADGE_COLOR = '#ff3040';

interface Props {
  count: number;
}

export function CountBadge({ count }: Props) {
  if (count <= 0) return null;

  const label = count > 99 ? '99+' : String(count);

  return (
    <View
      style={[
        styles.badge,
        { paddingHorizontal: count > 9 ? 4 : 0 },
      ]}
    >
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: BADGE_COLOR,
    borderWidth: 1.5,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 11,
  },
});
