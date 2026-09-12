'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'phone' | 'reset'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguage();
  const router = useRouter();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', {
        phone_number: phoneNumber,
      });

      toast.success(t('auth.codeSent'));
      setStep('reset');
      
      // Show the reset code (in production, this would be sent via SMS)
      if (response.data.reset_code) {
        toast.success(`Reset Code: ${response.data.reset_code}`, { duration: 10000 });
      }
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to send reset code';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.post('/auth/reset-password', {
        phone_number: phoneNumber,
        reset_code: resetCode,
        new_password: newPassword,
      });

      toast.success(t('auth.passwordResetSuccess'));
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to reset password';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="max-w-md w-full mx-4">
        <div className="card">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary-600">{t('auth.resetPassword')}</h1>
            <p className="text-gray-600 mt-2">
              {step === 'phone' 
                ? 'Enter your phone number to receive a reset code'
                : 'Enter the code sent to your phone'
              }
            </p>
          </div>

          {step === 'phone' ? (
            <form onSubmit={handleSendCode} className="space-y-6">
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

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full"
              >
                {isLoading ? 'Sending...' : t('auth.sendResetCode')}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label className="label">{t('auth.resetCode')}</label>
                <input
                  type="text"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                  placeholder={t('auth.resetCodePlaceholder')}
                  className="input"
                  maxLength={6}
                />
              </div>

              <div>
                <label className="label">{t('auth.newPassword')}</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('auth.passwordPlaceholder')}
                  className="input"
                />
              </div>

              <div>
                <label className="label">{t('auth.confirmPassword')}</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('auth.passwordPlaceholder')}
                  className="input"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full"
              >
                {isLoading ? 'Resetting...' : t('auth.resetPasswordButton')}
              </button>

              <button
                type="button"
                onClick={() => setStep('phone')}
                className="w-full text-sm text-gray-600 hover:text-gray-900"
              >
                ← Resend code
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-primary-600 hover:text-primary-700">
              {t('auth.backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
