import { MaterialIcons } from '@expo/vector-icons';

export type IconName = keyof typeof MaterialIcons.glyphMap;

type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
};

export function Icon({ name, size = 22, color = '#e4e1e7' }: IconProps) {
  return <MaterialIcons name={name} size={size} color={color} />;
}
