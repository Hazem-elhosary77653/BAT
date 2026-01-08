'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { useEffect } from 'react';

const DummyPage = ({ title }) => {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  return (
    <div className="flex h-screen bg-light">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">{title}</h1>
            <div className="card">
              <p className="text-gray-600 mb-4">This module is under development.</p>
              <p className="text-gray-500 text-sm">
                The {title} module will provide full functionality for managing your content.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DummyPage;
