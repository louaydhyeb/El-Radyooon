import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii } from '../theme/tokens';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

export type SheetOption = {
  id: string;
  label: string;
};

type Props = {
  visible: boolean;
  title: string;
  options: SheetOption[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onClose: () => void;
};

export function FilterSheet({ visible, title, options, selectedId, onSelect, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <PressableScale onPress={onClose} style={styles.close}>
              <Icon name="close" size={18} color={colors.onSurfaceVariant} />
            </PressableScale>
          </View>
          <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={styles.list}>
            {options.map((option) => {
              const selected = option.id === selectedId;
              return (
                <PressableScale
                  key={option.id}
                  onPress={() => {
                    onSelect(option.id);
                    onClose();
                  }}
                  style={[styles.option, selected && styles.optionActive]}
                >
                  <Text style={[styles.optionLabel, selected && styles.optionLabelActive]}>
                    {option.label}
                  </Text>
                  {selected ? <Icon name="check" size={18} color={colors.primaryFixed} /> : null}
                </PressableScale>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    backgroundColor: colors.surfaceContainerLow,
    borderTopLeftRadius: radii.card,
    borderTopRightRadius: radii.card,
    paddingHorizontal: 20,
    paddingBottom: 32,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.white20,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontFamily: fonts.outfit.semibold,
    fontSize: 20,
    color: colors.onSurface,
    textAlign: 'left',
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    gap: 8,
    paddingBottom: 12,
  },
  option: {
    minHeight: 48,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionActive: {
    borderColor: colors.limeBorder,
    backgroundColor: colors.surfaceContainerHigh,
  },
  optionLabel: {
    fontFamily: fonts.hanken.medium,
    fontSize: 15,
    color: colors.onSurface,
    flex: 1,
    paddingVertical: 12,
    textAlign: 'left',
  },
  optionLabelActive: {
    color: colors.primaryFixed,
  },
});
