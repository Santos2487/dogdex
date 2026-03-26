'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Onboarding from '@/components/onboarding/Onboarding';
import { Skeleton } from '@/components/ui/skeleton';

const ONBOARDING_COMPLETED_KEY = 'dogexplorer_onboarding_completed';

export default function Home() {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const onboardingCompleted = localStorage.getItem(ONBOARDING_COMPLETED_KEY) === 'true';
    if (onboardingCompleted) {
      router.replace('/collection');
    } else {
      setShowOnboarding(true);
    }
  }, [router]);

  const handleOnboardingComplete = () => {
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    router.replace('/collection');
  };

  if (showOnboarding === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background p-8">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  return showOnboarding ? <Onboarding onComplete={handleOnboardingComplete} /> : null;
}
