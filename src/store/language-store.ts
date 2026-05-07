import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'en' | 'es';

type LanguageState = {
  language: Language;
  setLanguage: (lang: Language) => void;
};

const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'en',

      setLanguage: (lang) =>
        set({
          language: lang,
        }),
    }),
    {
      name: 'dogdex-language',
    }
  )
);

export default useLanguageStore;