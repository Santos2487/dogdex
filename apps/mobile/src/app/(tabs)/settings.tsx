import { BadgeCheck, Languages, LogOut, Settings, User as UserIcon } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen, ScreenTitle } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/lib/auth';
import { useT } from '@/lib/i18n';
import { isValidTrainerName, reserveTrainerName, TrainerNameError } from '@/lib/trainer-name';
import { useLanguageStore } from '@/store/language-store';
import { colors, fonts, radius } from '@/theme';

type Notice = { kind: 'error' | 'success'; title: string; description?: string } | null;

export default function SettingsScreen() {
  const { t } = useT();
  const { language, setLanguage } = useLanguageStore();
  const { user, userData, loading, signOutUser } = useAuth();
  const [authBusy, setAuthBusy] = useState(false);
  const [name, setName] = useState('');
  const [nameBusy, setNameBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const isAnonymous = user?.isAnonymous ?? true;

  async function onSignOut() {
    setAuthBusy(true);
    try {
      await signOutUser();
    } finally {
      setAuthBusy(false);
    }
  }

  async function onSaveName() {
    if (!user || !userData) return;
    if (!isValidTrainerName(name)) {
      return setNotice({ kind: 'error', title: t.settings.invalidName, description: t.settings.invalidNameDescription });
    }
    setNameBusy(true);
    setNotice(null);
    try {
      await reserveTrainerName(user.uid, name, userData);
      setNotice({ kind: 'success', title: t.settings.nameSaved, description: t.settings.nameSavedDescription });
      setName('');
    } catch (e) {
      const description =
        e instanceof TrainerNameError && e.code === 'taken' ? t.settings.nameTaken
        : e instanceof TrainerNameError && e.code === 'already-have-name' ? t.settings.alreadyHaveName
        : (e as Error).message;
      setNotice({ kind: 'error', title: t.settings.couldNotSave, description });
    } finally {
      setNameBusy(false);
    }
  }

  return (
    <Screen>
      <ScreenTitle icon={Settings} title={t.settings.title} />

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Languages size={20} color={colors.primary} />
          <Text variant="subheading">{t.settings.language}</Text>
        </View>
        <Text variant="muted">{t.settings.languageDescription}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button testID="lang-en" style={{ flex: 1 }} variant={language === 'en' ? 'default' : 'outline'} title="English" onPress={() => setLanguage('en')} />
          <Button testID="lang-es" style={{ flex: 1 }} variant={language === 'es' ? 'default' : 'outline'} title="Español" onPress={() => setLanguage('es')} />
        </View>
      </Card>

      <Card>
        <Text variant="subheading">{t.settings.account}</Text>
        <Text variant="muted">{t.settings.accountDescription}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg }}>
          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center' }}>
                <UserIcon size={24} color={colors.mutedForeground} />
              </View>
              <View style={{ flexShrink: 1 }}>
                <Text variant="label">{t.settings.currentStatus}</Text>
                <Text testID="account-status" variant="muted" selectable>
                  {isAnonymous ? t.settings.guest : user?.displayName || user?.email || t.settings.googleUser}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Same rule as the web app: only signed-in (non-guest) users can reserve a name. */}
        {!loading && !isAnonymous ? (
          <View style={{ gap: 12, padding: 16, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <BadgeCheck size={20} color={colors.primary} />
              <Text variant="label">{t.settings.collectorName}</Text>
            </View>
            {userData?.trainerName ? (
              <>
                <Text variant="heading" selectable>{userData.trainerName}</Text>
                <Text variant="muted">{t.settings.collectorNameFixed}</Text>
              </>
            ) : (
              <>
                <TextInput
                  testID="trainer-name-input"
                  value={name}
                  onChangeText={setName}
                  placeholder={t.settings.collectorPlaceholder}
                  placeholderTextColor={colors.mutedForeground}
                  maxLength={20}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, height: 44, color: colors.foreground, fontFamily: fonts.regular, fontSize: 16 }}
                />
                <Text variant="small">{t.settings.collectorHint}</Text>
                <Button testID="save-trainer-name" title={t.settings.saveCollectorName} loading={nameBusy} onPress={onSaveName} />
              </>
            )}
          </View>
        ) : null}

        {notice ? (
          <View style={{ padding: 12, borderRadius: radius.md, backgroundColor: notice.kind === 'error' ? colors.destructive : colors.secondary }}>
            <Text variant="label" selectable>{notice.title}</Text>
            {notice.description ? <Text variant="muted" selectable style={{ color: colors.foreground }}>{notice.description}</Text> : null}
          </View>
        ) : null}

        {/* Google sign-in (to keep a guest collection across devices) needs native OAuth setup;
            see increment 11 in docs/expo-migration-plan.md. */}
        {!loading && isAnonymous ? <Text variant="muted">{t.settings.googleUnavailable}</Text> : null}
        {!loading && !isAnonymous ? (
          <Button variant="outline" icon={LogOut} loading={authBusy} title={authBusy ? t.settings.signingOut : t.settings.signOut} onPress={onSignOut} />
        ) : null}

        <Text variant="muted">{isAnonymous ? t.settings.anonymousNote : t.settings.linkedNote}</Text>
      </Card>
    </Screen>
  );
}
