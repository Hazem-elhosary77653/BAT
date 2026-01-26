import { useLanguageStore } from '@/store';
import en from '@/locales/en.json';
import ar from '@/locales/ar.json';

const translations = { en, ar };

export default function useTranslation() {
    const { language } = useLanguageStore();

    const t = (key) => {
        if (!key) return '';

        const keys = key.split('.');
        let value = translations[language] || translations['en'];

        for (const k of keys) {
            if (value && value[k]) {
                value = value[k];
            } else {
                // Fallback to English if key missing in current language
                let fallback = translations['en'];
                for (const fk of keys) {
                    if (fallback && fallback[fk]) {
                        fallback = fallback[fk];
                    } else {
                        fallback = key;
                        break;
                    }
                }
                return fallback;
            }
        }

        return value;
    };

    return { t, language };
}
