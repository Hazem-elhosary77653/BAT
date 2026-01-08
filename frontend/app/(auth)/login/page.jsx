'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store';
import TwoFAVerification from '@/components/TwoFAVerification';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [show2FA, setShow2FA] = useState(false);
  const [tempUser, setTempUser] = useState(null);
  const [tempToken, setTempToken] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { credential, password });
      const { token, user, requires2FA } = response.data;

      // Check if 2FA is required; backend does not issue token until verified
      if (requires2FA) {
        setTempUser(user);
        setTempToken(null);
        setShow2FA(true);
        return;
      }

      // No 2FA required, proceed to dashboard
      setAuth(user, token);
      router.push('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handle2FAVerified = ({ user, token }) => {
    // 2FA code was verified successfully, complete login with returned token
    setAuth(user, token);
    setShow2FA(false);
    setTempUser(null);
    setTempToken(null);
    router.push('/dashboard');
  };

  const handle2FACancel = () => {
    setShow2FA(false);
    setTempUser(null);
    setTempToken(null);
    setPassword('');
  };

  return (
    <>
      <div className="min-h-screen bg-[var(--color-surface-strong)] flex items-center justify-center p-4">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-soft max-w-md w-full p-8 space-y-6">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-primary)]/90 flex items-center justify-center shadow-lg">
              <Image
                src="/brand/bat-logo.png"
                alt="Brand logo"
                width={48}
                height={48}
                className="object-contain"
                priority
              />
            </div>
            <div className="text-center space-y-1">
              <h1 className="text-2xl font-bold text-[var(--color-primary)]">Business Analyst Assistant</h1>
              <p className="text-sm text-[var(--color-text-muted)]">Sign in to your account</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="label">Email, Username, or Mobile</label>
              <input
                type="text"
                value={credential}
                onChange={(e) => setCredential(e.target.value)}
                className="input"
                placeholder="Enter your email, username, or mobile"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="pt-4 border-t border-[var(--color-border)] text-center">
            <p className="text-sm text-[var(--color-text-muted)]">
              Don't have an account?{' '}
              <Link href="/register" className="text-[var(--color-accent)] hover:underline font-semibold">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* 2FA Modal */}
      {show2FA && tempUser && (
        <TwoFAVerification
          userId={tempUser.id}
          userEmail={tempUser.email}
          userName={tempUser.firstName}
          onVerified={handle2FAVerified}
          onCancel={handle2FACancel}
        />
      )}
    </>
  );
}
