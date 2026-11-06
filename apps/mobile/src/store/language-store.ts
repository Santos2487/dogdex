import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Language } from '@/lib/data';

type LanguageState = { language: Language; setLanguage: (lang: Language) => void };

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({ language: 'en', setLanguage: (language) => set({ language }) }),
    // Same key as the web app's localStorage entry, for consistency.
    { name: 'dogdex-language', storage: createJSONStorage(() => AsyncStorage) }
  )
);
