'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';

export default function Home() {
  const router = useRouter();
  const { user, loadAuth } = useAuthStore();

  useEffect(() => {
    loadAuth();
    const timer = setTimeout(() => {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [user, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-600 to-blue-800">
      <div className="text-center">
        <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl font-bold text-blue-600">BA</span>
        </div>
        <p className="text-white text-lg">Loading...</p>
      </div>
    </div>
  );
}
