'use client';

import {
  Settings,
  User as UserIcon,
  Languages,
  LogIn,
  LogOut,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Button } from '@/components/ui/button';

import { useAuth } from '@/contexts/AuthContext';

import { Skeleton } from '@/components/ui/skeleton';

import Balancer from 'react-wrap-balancer';

import useLanguageStore from '@/store/language-store';

export default function SettingsPage() {
  const {
    user,
    loading,
    signInWithGoogle,
    signOutUser,
  } = useAuth();

  const { language, setLanguage } = useLanguageStore();

  const isAnonymous = user?.isAnonymous;

  return (
    <div className="container mx-auto max-w-lg p-4">
      <div className="mb-8 flex items-center gap-2">
        <Settings className="h-8 w-8 text-primary" />

        <h1 className="text-3xl font-bold text-foreground">
          {language === 'es' ? 'Ajustes' : 'Settings'}
        </h1>
      </div>

      {/* LANGUAGE */}
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

      {/* ACCOUNT */}
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
          {/* STATUS */}
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
                      : user?.displayName ||
                        user?.email ||
                        'Google User'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* GOOGLE LOGIN */}
          {!loading && isAnonymous && (
            <Button
              className="w-full"
              onClick={signInWithGoogle}
            >
              <LogIn className="mr-2 h-4 w-4" />

              {language === 'es'
                ? 'Continuar con Google'
                : 'Continue with Google'}
            </Button>
          )}

          {/* SIGN OUT */}
          {!loading && !isAnonymous && (
            <Button
              variant="outline"
              className="w-full"
              onClick={signOutUser}
            >
              <LogOut className="mr-2 h-4 w-4" />

              {language === 'es'
                ? 'Cerrar sesión'
                : 'Sign Out'}
            </Button>
          )}

          {/* DESCRIPTION */}
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