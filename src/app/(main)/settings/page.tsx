'use client';

import {
  Settings,
  User as UserIcon,
  Languages,
  LogIn,
  LogOut,
  Loader2,
  BadgeCheck,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import Balancer from 'react-wrap-balancer';
import useLanguageStore from '@/store/language-store';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

import { db } from '@/lib/firebase';
import {
  doc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';

export default function SettingsPage() {
  const { user, userData, loading, signInWithGoogle, signOutUser } = useAuth();
  const { language, setLanguage } = useLanguageStore();
  const { toast } = useToast();

  const [authActionLoading, setAuthActionLoading] = useState(false);
  const [trainerName, setTrainerName] = useState('');
  const [trainerNameLoading, setTrainerNameLoading] = useState(false);

  const isAnonymous = user?.isAnonymous;
  const hasTrainerName = Boolean(userData?.trainerName);

  const handleGoogleLogin = async () => {
    setAuthActionLoading(true);

    try {
      await signInWithGoogle();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: language === 'es' ? 'Error al iniciar sesión' : 'Login failed',
        description:
          error?.message ||
          (language === 'es'
            ? 'No se pudo iniciar sesión con Google.'
            : 'Could not sign in with Google.'),
      });
    } finally {
      setAuthActionLoading(false);
    }
  };

  const handleSignOut = async () => {
    setAuthActionLoading(true);

    try {
      await signOutUser();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title:
          language === 'es'
            ? 'Error al cerrar sesión'
            : 'Sign out failed',
        description:
          error?.message ||
          (language === 'es'
            ? 'No se pudo cerrar sesión.'
            : 'Could not sign out.'),
      });
    } finally {
      setAuthActionLoading(false);
    }
  };

  const handleSaveTrainerName = async () => {
    if (!user || !userData) return;

    const cleanName = trainerName.trim();
    const normalizedName = cleanName.toLowerCase();

    if (!/^[A-Za-z0-9_]{3,20}$/.test(cleanName)) {
      toast({
        variant: 'destructive',
        title: language === 'es' ? 'Nombre no válido' : 'Invalid name',
        description:
          language === 'es'
            ? 'Usa entre 3 y 20 caracteres: letras, números o guion bajo.'
            : 'Use 3 to 20 characters: letters, numbers, or underscore.',
      });
      return;
    }

    setTrainerNameLoading(true);

    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', user.uid);
        const nameRef = doc(db, 'trainerNames', normalizedName);

        const userSnap = await transaction.get(userRef);
        const nameSnap = await transaction.get(nameRef);

        if (!userSnap.exists()) {
          throw new Error('User profile not found.');
        }

        const currentUserData = userSnap.data();

        if (currentUserData.trainerName) {
          throw new Error(
            language === 'es'
              ? 'Ya tienes un nombre de coleccionista.'
              : 'You already have a collector name.'
          );
        }

        if (nameSnap.exists()) {
          throw new Error(
            language === 'es'
              ? 'Ese nombre ya está en uso.'
              : 'That name is already taken.'
          );
        }

        transaction.set(nameRef, {
          uid: user.uid,
          trainerName: cleanName,
          trainerNameLower: normalizedName,
          createdAt: serverTimestamp(),
        });

        transaction.update(userRef, {
  trainerName: cleanName,
  trainerNameLower: normalizedName,
  trainerNameSetAt: serverTimestamp(),
});

const publicProfileRef = doc(db, 'publicProfiles', user.uid);

transaction.set(publicProfileRef, {
  uid: user.uid,
  trainerName: cleanName,
  level: userData.level ?? 1,
  xp: userData.xp ?? 0,
  totalCaptures: userData.totalCaptures ?? 0,
  uniqueBreedsCount: userData.uniqueBreedsCount ?? 0,
  updatedAt: serverTimestamp(),
});
      });

      toast({
        title:
          language === 'es'
            ? 'Nombre guardado'
            : 'Trainer name saved',
        description:
          language === 'es'
            ? 'Tu nombre de coleccionista ya está reservado.'
            : 'Your collector name is now reserved.',
      });

      setTrainerName('');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title:
          language === 'es'
            ? 'No se pudo guardar'
            : 'Could not save',
        description:
          error?.message ||
          (language === 'es'
            ? 'Prueba con otro nombre.'
            : 'Try another name.'),
      });
    } finally {
      setTrainerNameLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-lg p-4">
      <div className="mb-8 flex items-center gap-2">
        <Settings className="h-8 w-8 text-primary" />

        <h1 className="text-3xl font-bold text-foreground">
          {language === 'es' ? 'Ajustes' : 'Settings'}
        </h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5 text-primary" />
            {language === 'es' ? 'Idioma' : 'Language'}
          </CardTitle>

          <CardDescription>
            <Balancer>
              {language === 'es'
                ? 'Elige el idioma de la aplicación.'
                : 'Choose the app language.'}
            </Balancer>
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={language === 'en' ? 'default' : 'outline'}
              onClick={() => setLanguage('en')}
            >
              English
            </Button>

            <Button
              variant={language === 'es' ? 'default' : 'outline'}
              onClick={() => setLanguage('es')}
            >
              Español
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {language === 'es' ? 'Cuenta' : 'Account'}
          </CardTitle>

          <CardDescription>
            <Balancer>
              {language === 'es'
                ? 'Gestiona tu cuenta y preferencias.'
                : 'Manage your account and preferences.'}
            </Balancer>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            {loading ? (
              <div className="flex w-full items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />

                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <UserIcon className="h-6 w-6 text-muted-foreground" />
                </div>

                <div>
                  <p className="font-semibold">
                    {language === 'es'
                      ? 'Estado actual'
                      : 'Current Status'}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    {user?.isAnonymous
                      ? language === 'es'
                        ? 'Usuario invitado'
                        : 'Guest User'
                      : user?.displayName || user?.email || 'Google User'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {!loading && !isAnonymous && (
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <BadgeCheck className="h-5 w-5 text-primary" />

                <p className="font-semibold">
                  {language === 'es'
                    ? 'Nombre de coleccionista'
                    : 'Collector name'}
                </p>
              </div>

              {hasTrainerName ? (
                <>
                  <p className="text-2xl font-bold">
                    {userData?.trainerName}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    {language === 'es'
                      ? 'Este nombre es único y no se puede cambiar.'
                      : 'This name is unique and cannot be changed.'}
                  </p>
                </>
              ) : (
                <>
                  <Input
                    value={trainerName}
                    onChange={(e) => setTrainerName(e.target.value)}
                    placeholder={
                      language === 'es'
                        ? 'Ej: Petrel2487'
                        : 'e.g., Petrel2487'
                    }
                    maxLength={20}
                  />

                  <p className="text-xs text-muted-foreground">
                    {language === 'es'
                      ? 'Entre 3 y 20 caracteres. Solo letras, números y _. No podrás cambiarlo después.'
                      : '3 to 20 characters. Letters, numbers and _ only. You cannot change it later.'}
                  </p>

                  <Button
                    className="w-full"
                    onClick={handleSaveTrainerName}
                    disabled={trainerNameLoading}
                  >
                    {trainerNameLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}

                    {language === 'es'
                      ? 'Guardar nombre'
                      : 'Save collector name'}
                  </Button>
                </>
              )}
            </div>
          )}

          {!loading && isAnonymous && (
            <Button
              className="w-full"
              onClick={handleGoogleLogin}
              disabled={authActionLoading}
            >
              {authActionLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="mr-2 h-4 w-4" />
              )}

              {authActionLoading
                ? language === 'es'
                  ? 'Conectando...'
                  : 'Connecting...'
                : language === 'es'
                ? 'Continuar con Google'
                : 'Continue with Google'}
            </Button>
          )}

          {!loading && !isAnonymous && (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleSignOut}
              disabled={authActionLoading}
            >
              {authActionLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}

              {authActionLoading
                ? language === 'es'
                  ? 'Cerrando sesión...'
                  : 'Signing out...'
                : language === 'es'
                ? 'Cerrar sesión'
                : 'Sign Out'}
            </Button>
          )}

          <p className="pt-4 text-sm text-muted-foreground">
            <Balancer>
              {isAnonymous
                ? language === 'es'
                  ? 'Inicia sesión con Google para guardar tu colección de forma segura entre dispositivos.'
                  : 'Sign in with Google to safely sync your collection across devices.'
                : language === 'es'
                ? 'Tu colección está vinculada a tu cuenta de Google.'
                : 'Your collection is linked to your Google account.'}
            </Balancer>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}