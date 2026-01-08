'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';
import './globals.css';

export default function RootLayout({ children }) {
  const router = useRouter();
  const { user, loadAuth } = useAuthStore();

  useEffect(() => {
    loadAuth();
  }, [loadAuth]);

  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
