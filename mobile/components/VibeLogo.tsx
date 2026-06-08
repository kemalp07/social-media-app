import { Image, StyleSheet, View } from 'react-native';

interface Props {
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = { sm: 40, md: 52, lg: 88 };

export function VibeLogo({ size = 'md' }: Props) {
  const dimension = SIZES[size];

  return (
    <View style={styles.row}>
      <Image
        source={require('../assets/app_icon.png')}
        style={{ width: dimension, height: dimension, borderRadius: dimension * 0.22 }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
});
