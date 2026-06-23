'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart2, Camera, Trophy, Settings } from 'lucide-react';
import useLanguageStore from '@/store/language-store';

export default function BottomNav() {
  const pathname = usePathname();
  const { language } = useLanguageStore();

  const navItems = [
    {
      href: '/collection',
      label: language === 'es' ? 'Colección' : 'Collection',
      icon: Home,
    },
    {
      href: '/stats',
      label: language === 'es' ? 'Estadísticas' : 'Stats',
      icon: BarChart2,
    },
    {
      href: '/capture',
      label: '',
      icon: Camera,
      isCenter: true,
    },
    {
      href: '/ranking',
      label: 'Ranking',
      icon: Trophy,
    },
    {
      href: '/settings',
      label: language === 'es' ? 'Ajustes' : 'Settings',
      icon: Settings,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/capture' && pathname.startsWith(item.href));

          if (item.isCenter) {
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={language === 'es' ? 'Capturar' : 'Capture'}
                className="flex h-16 w-16 items-center justify-center rounded-full"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 transition-transform">
                  <item.icon className="h-6 w-6" />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-14 min-w-14 flex-col items-center justify-center rounded-xl px-2 text-xs transition-colors active:scale-95 ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-primary'
              }`}
            >
              <item.icon className="mb-1 h-5 w-5" />
              <span className="leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}