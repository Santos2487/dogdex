import { create } from 'zustand';

export type Language = 'en' | 'es';

type LanguageState = {
  language: Language;
  setLanguage: (lang: Language) => void;
};

const useLanguageStore = create<LanguageState>((set) => ({
  language: 'en',
  setLanguage: (lang) => set({ language: lang }),
}));

export default useLanguageStore;