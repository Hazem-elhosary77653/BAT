'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store';
import useTranslation from '@/hooks/useTranslation';
import { Lock } from 'lucide-react';

export default function RegisterPage() {
  const { t, language } = useTranslation();
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    mobile: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registrationDisabled, setRegistrationDisabled] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await api.get('/system-settings/public').catch(() => null);
        if (response?.data?.registration_enabled === false) {
          setRegistrationDisabled(true);
        }
      } catch (err) {
        // Fallback or ignore
      }
    };
    checkStatus();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/register', formData);
      const { token, user } = response.data;

      setAuth(user, token);
      router.push('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-8">
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
            BA
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center mb-2">{t('register.title')}</h1>
        <p className="text-gray-600 text-center mb-8">{t('register.subtitle')}</p>

        {registrationDisabled ? (
          <div className="bg-orange-50 border border-orange-200 text-orange-800 p-6 rounded-xl text-center shadow-inner">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-orange-100 rounded-full">
                <Lock className="text-orange-600" size={32} />
              </div>
            </div>
            <h3 className="font-bold text-lg mb-2">Registration Disabled</h3>
            <p className="text-sm opacity-90 italic">New account creation is temporarily disabled by the administrator.</p>
            <div className="mt-8 pt-6 border-t border-orange-200">
              <Link href="/login" className="btn btn-primary w-full shadow-md">
                Return to Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">{t('register.first_name')}</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="input"
                  placeholder={t('register.firstName_placeholder')}
                />
              </div>
              <div>
                <label className="label">{t('register.last_name')}</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="input"
                  placeholder={t('register.lastName_placeholder')}
                />
              </div>
            </div>

            <div>
              <label className="label">{t('register.email')}</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input"
                placeholder={t('register.email_placeholder')}
                required
              />
            </div>

            <div>
              <label className="label">{t('register.username')}</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="input"
                placeholder={t('register.username_placeholder')}
                required
              />
            </div>

            <div>
              <label className="label">{t('register.mobile')}</label>
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                className="input"
                placeholder={t('register.mobile_placeholder')}
              />
            </div>

            <div>
              <label className="label">{t('register.password')}</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input"
                placeholder={t('register.password_placeholder')}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? t('register.button_loading') : t('register.button')}
            </button>
          </form>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-gray-600 text-sm">
            {t('register.already_have_account')}{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
              {t('register.sign_in')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
