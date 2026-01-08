'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function UserStoriesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/ai-stories');
  }, [router]);

  return null;
}
