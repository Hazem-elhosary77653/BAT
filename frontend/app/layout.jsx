'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useLanguageStore } from '@/store';
import api from '@/lib/api';
import ProjectChat from '@/components/ProjectChat';
import './globals.css';

export default function RootLayout({ children }) {
  const router = useRouter();
  const { user, loadAuth } = useAuthStore();
  const { language, setLanguage } = useLanguageStore();

  useEffect(() => {
    const initApp = async () => {
      await loadAuth();
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await api.get('/user-settings');
        if (response?.data?.data) {
          const settings = response.data.data;

          // Theme
          if (settings.theme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }

          // Language
          if (settings.language) {
            setLanguage(settings.language);
          }
        }
      } catch (err) {
        console.error('Failed to load settings in layout:', err);
      }
    };
    initApp();
  }, [loadAuth, setLanguage]);

  return (
    <html lang={language || 'en'} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <body className="transition-colors duration-200">
        {children}
        {user && <ProjectChat />}
      </body>
    </html>
  );
}
