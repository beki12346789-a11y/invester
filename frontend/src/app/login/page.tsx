'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

export default function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(phoneNumber, password);
    } catch (error) {
      // Error handled by auth context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="max-w-md w-full mx-4">
        <div className="card">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary-600">{t('app.title')}</h1>
            <p className="text-gray-600 mt-2">{t('auth.signIn')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="label">{t('auth.phoneNumber')}</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder={t('auth.phonePlaceholder')}
                className="input"
                maxLength={10}
              />
            </div>

            <div>
              <label className="label">{t('auth.password')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.passwordPlaceholder')}
                className="input"
              />
            </div>

            <div className="flex items-center justify-end">
              <Link href="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700">
                {t('auth.forgotPassword')}
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full"
            >
              {isLoading ? t('auth.signingIn') : t('auth.signInButton')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {t('auth.dontHaveAccount')}{' '}
              <Link href="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                {t('auth.registerHere')}
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link href="/admin/login" className="text-xs text-gray-500 hover:text-gray-700">
              Admin Portal →
            </Link>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              {t('auth.demoAdmin')}: 0912345678 / admin123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
