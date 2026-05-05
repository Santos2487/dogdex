'use client';

import CollectionGrid from '@/components/collection/CollectionGrid';
import { PawPrint } from 'lucide-react';
import useLanguageStore from '@/store/language-store';

export default function CollectionPage() {
  const { language } = useLanguageStore();

  return (
    <div className="container mx-auto max-w-5xl p-4">
      <div className="flex items-center gap-2 mb-6">
        <PawPrint className="h-8 w-8 text-primary" />

        <h1 className="text-3xl font-bold">
          {language === 'es' ? 'Mi colección' : 'My Collection'}
        </h1>
      </div>

      <CollectionGrid />
    </div>
  );
}