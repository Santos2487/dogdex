import { Screen, ScreenTitle } from '@/components/ui/screen';
import { useT } from '@/lib/i18n';

export default function Placeholder() {
  const { t } = useT();
  return (
    <Screen>
      <ScreenTitle title={t.tabs.ranking} />
    </Screen>
  );
}
