import { type ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

type Props = PressableProps & {
  style?: StyleProp<ViewStyle>;
  scale?: number;
  children: ReactNode;
};

export function PressableScale({ style, scale = 0.95, children, onPress, ...rest }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [style, pressed && { transform: [{ scale }], opacity: 0.92 }]}
      onPress={(event) => {
        if (onPress) {
          void Haptics.selectionAsync();
          onPress(event);
        }
      }}
      {...rest}
    >
      {children}
    </Pressable>
  );
}
