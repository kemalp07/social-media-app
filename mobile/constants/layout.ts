import type { FlatListProps } from 'react-native';

export const TAB_BAR_HEIGHT = 60;

export const listScrollProps = {
  scrollIndicatorInsets: { bottom: TAB_BAR_HEIGHT },
  contentInsetAdjustmentBehavior: 'automatic' as const,
} satisfies Pick<FlatListProps<unknown>, 'scrollIndicatorInsets' | 'contentInsetAdjustmentBehavior'>;
