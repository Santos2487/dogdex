import { Redirect } from 'expo-router';
import { useEffect } from 'react';

import AppTabs from '@/components/app-tabs';
import { useOnboarding } from '@/lib/onboarding';

export default function TabsLayout() {
  const completed = useOnboarding((s) => s.completed);
  const load = useOnboarding((s) => s.load);

  useEffect(() => {
    load();
  }, [load]);

  if (completed === false) return <Redirect href="/onboarding" />;
  return <AppTabs />;
}
