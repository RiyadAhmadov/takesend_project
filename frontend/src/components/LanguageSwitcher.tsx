'use client';
import { useLangStore } from '@/store/lang';
import { Language } from '@/lib/i18n';

const LANGS: { code: Language; label: string; flag: string }[] = [
  { code: 'az', label: 'AZ', flag: '🇦🇿' },
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'ru', label: 'RU', flag: '🇷🇺' },
  { code: 'tr', label: 'TR', flag: '🇹🇷' },
];

export default function LanguageSwitcher({ variant = 'nav' }: { variant?: 'nav' | 'sidebar' }) {
  const { lang, setLang } = useLangStore();

  if (variant === 'sidebar') {
    return (
      <div className="flex gap-1 px-3 py-2">
        {LANGS.map(l => (
          <button
            key={l.code}
            onClick={() => setLang(l.code)}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
              lang === l.code ? 'bg-orange-100 text-orange-700' : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
      {LANGS.map(l => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          className={`px-2 py-1 rounded-md text-xs font-bold transition-all ${
            lang === l.code ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
