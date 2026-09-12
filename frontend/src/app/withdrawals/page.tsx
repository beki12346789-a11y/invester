'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/lib/api';
import { Withdrawal, Wallet } from '@/types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function WithdrawalsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    withdrawal_method: '',
    account_details: '',
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    } else if (user) {
      fetchData();
    }
  }, [user, isLoading, router]);

  const fetchData = async () => {
    try {
      const [withdrawalsRes, walletRes] = await Promise.all([
        api.get('/me/withdrawals'),
        api.get('/me/wallet'),
      ]);
      setWithdrawals(withdrawalsRes.data || []);
      setWallet(walletRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount);

    if (!amount || amount <= 0) {
      toast.error(t('errors.validationError'));
      return;
    }

    if (wallet && amount > wallet.balance) {
      toast.error(t('withdrawals.insufficientBalance'));
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/withdrawals', formData);
      toast.success(t('withdrawals.successMessage'));
      setShowForm(false);
      setFormData({ amount: '', withdrawal_method: '', account_details: '' });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('withdrawals.errorMessage'));
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: 'badge-warning',
      approved: 'badge-info',
      rejected: 'badge-danger',
      completed: 'badge-success',
    };
    return badges[status] || 'badge-secondary';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: t('withdrawals.pending'),
      approved: t('withdrawals.approved'),
      rejected: t('withdrawals.rejected'),
      completed: t('withdrawals.completed'),
    };
    return labels[status] || status;
  };

  if (loading || isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('withdrawals.title')}</h1>
            <p className="text-gray-600">{t('withdrawals.myWithdrawals')}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">{t('withdrawals.availableBalance')}</p>
            <p className="text-2xl font-bold text-primary-600">${wallet?.balance.toFixed(2) || '0.00'}</p>
          </div>
        </div>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary"
          >
            {t('withdrawals.requestWithdrawal')}
          </button>
        )}

        {/* Withdrawal Form */}
        {showForm && (
          <div className="card bg-blue-50 border-blue-200">
            <h3 className="text-lg font-semibold mb-4">{t('withdrawals.newWithdrawal')}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">{t('withdrawals.amount')}</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder={t('withdrawals.enterAmount')}
                  className="input"
                  required
                  step="0.01"
                  min="0"
                />
              </div>

              <div>
                <label className="label">{t('withdrawals.method')}</label>
                <select
                  value={formData.withdrawal_method}
                  onChange={(e) => setFormData({ ...formData, withdrawal_method: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">{t('withdrawals.selectMethod')}</option>
                  <option value="telebirr">{t('withdrawals.methodTelebirr')}</option>
                  <option value="cbe">{t('withdrawals.methodCBE')}</option>
                  <option value="other">{t('withdrawals.methodOther')}</option>
                </select>
              </div>

              <div>
                <label className="label">{t('withdrawals.accountDetails')}</label>
                <textarea
                  value={formData.account_details}
                  onChange={(e) => setFormData({ ...formData, account_details: e.target.value })}
                  placeholder={t('withdrawals.accountDetailsPlaceholder')}
                  className="input"
                  required
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary flex-1"
                >
                  {submitting ? t('withdrawals.submitting') : t('withdrawals.submit')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn btn-secondary"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Withdrawals List */}
        <div className="card">
          {withdrawals.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">{t('withdrawals.noWithdrawals')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('common.amount')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('withdrawals.method')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('common.status')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('withdrawals.requestedAt')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('withdrawals.adminNotes')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {withdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">
                        ${withdrawal.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {withdrawal.withdrawal_method}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${getStatusBadge(withdrawal.status)}`}>
                          {getStatusLabel(withdrawal.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {format(new Date(withdrawal.requested_at), 'MMM dd, yyyy HH:mm')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {withdrawal.admin_notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
