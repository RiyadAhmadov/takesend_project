import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { translations, Language, TranslationKey } from '@/lib/i18n';

interface LangStore {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

export const useLangStore = create<LangStore>()(
  persist(
    (set, get) => ({
      lang: 'az',
      setLang: (lang) => set({ lang }),
      t: (key) => translations[get().lang][key] || translations.az[key] || key
    }),
    { name: 'takesend-lang' }
  )
);
