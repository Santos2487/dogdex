'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart2, Camera, Award, Settings } from 'lucide-react';
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
      href: '/badges',
      label: language === 'es' ? 'Logros' : 'Badges',
      icon: Award,
    },
    {
      href: '/settings',
      label: language === 'es' ? 'Ajustes' : 'Settings',
      icon: Settings,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-lg items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          if (item.isCenter) {
            return (
              <Link key={item.href} href={item.href}>
                <div className="flex flex-col items-center justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                    <item.icon className="h-6 w-6" />
                  </div>
                </div>
              </Link>
            );
          }

          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex flex-col items-center justify-center text-xs ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-primary'
                }`}
              >
                <item.icon className="h-5 w-5 mb-1" />
                {item.label}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}