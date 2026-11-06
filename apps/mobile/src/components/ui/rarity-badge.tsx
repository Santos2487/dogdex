import { Gem } from 'lucide-react-native';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import type { Rarity } from '@/lib/data';
import { useT } from '@/lib/i18n';
import { fonts, radius, rarityColors } from '@/theme';

export function RarityBadge({ rarity, size = 'md' }: { rarity: Rarity; size?: 'sm' | 'md' }) {
  const { t } = useT();
  const c = rarityColors[rarity] ?? rarityColors.Common;
  const font = size === 'sm' ? 11 : 13;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 4,
        backgroundColor: c.bg,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: radius.full,
      }}>
      <Gem size={font} color={c.fg} />
      <Text style={{ color: c.fg, fontFamily: fonts.semibold, fontSize: font, lineHeight: font + 6 }}>
        {t.rarity[rarity]}
      </Text>
    </View>
  );
}
