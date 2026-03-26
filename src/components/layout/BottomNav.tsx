'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart3, Award, Settings, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/collection', icon: Home, label: 'Collection' },
  { href: '/stats', icon: BarChart3, label: 'Stats' },
  null, // Placeholder for Capture button
  { href: '/badges', icon: Award, label: 'Badges' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-20 border-t bg-background/95 backdrop-blur-sm">
      <div className="mx-auto grid h-full max-w-lg grid-cols-5 items-center">
        {navItems.map((item, index) => {
          if (item === null) {
            // Central FAB-style button for Capture
            return (
              <div key="capture-button" className="relative flex justify-center">
                <Link
                  href="/capture"
                  className="absolute -top-10 flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
                  aria-label="Capture a new dog"
                >
                  <Camera className="h-9 w-9" />
                </Link>
              </div>
            );
          }
          
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 p-2 text-muted-foreground transition-colors hover:text-primary',
                isActive && 'text-primary'
              )}
            >
              <item.icon className="h-6 w-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
