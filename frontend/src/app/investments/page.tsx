'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/lib/api';
import { Investment } from '@/types';
import { format } from 'date-fns';

export default function InvestmentsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    } else if (user) {
      fetchInvestments();
    }
  }, [user, isLoading, router]);

  const fetchInvestments = async () => {
    try {
      const response = await api.get('/me/investments');
      setInvestments(response.data || []);
    } catch (error) {
      console.error('Failed to fetch investments:', error);
    } finally {
      setLoading(false);
    }
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

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      active: 'badge-success',
      completed: 'badge-info',
      cancelled: 'badge-danger',
    };
    return badges[status] || 'badge-secondary';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: t('investments.active'),
      completed: t('investments.completed'),
      cancelled: t('investments.cancelled'),
    };
    return labels[status] || status;
  };

  const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalProfit = investments.reduce((sum, inv) => sum + inv.actual_profit_loss, 0);
  const activeCount = investments.filter(inv => inv.status === 'active').length;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('investments.title')}</h1>
            <p className="text-gray-600">{t('investments.myInvestments')}</p>
          </div>
          <button
            onClick={() => router.push('/packages')}
            className="btn btn-primary"
          >
            {t('investments.viewPackages')}
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card bg-blue-50 border-blue-200">
            <p className="text-sm text-blue-600 font-medium">{t('investments.totalInvested')}</p>
            <p className="text-2xl font-bold text-blue-900">${totalInvested.toFixed(2)}</p>
          </div>
          <div className="card bg-green-50 border-green-200">
            <p className="text-sm text-green-600 font-medium">{t('investments.totalProfit')}</p>
            <p className="text-2xl font-bold text-green-900">${totalProfit.toFixed(2)}</p>
          </div>
          <div className="card bg-purple-50 border-purple-200">
            <p className="text-sm text-purple-600 font-medium">{t('investments.activeCount')}</p>
            <p className="text-2xl font-bold text-purple-900">{activeCount}</p>
          </div>
        </div>

        {/* Investments List */}
        <div className="card">
          {investments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">{t('investments.noInvestments')}</p>
              <button
                onClick={() => router.push('/packages')}
                className="btn btn-primary"
              >
                {t('investments.startInvesting')}
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('investments.packageName')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('investments.amount')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('investments.targetReturn')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('investments.actualReturn')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('common.status')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('investments.startDate')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {investments.map((investment) => (
                    <tr key={investment.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {investment.package_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {investment.target_percentage}% {t('packages.targetReturn')}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        ${investment.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        ${investment.target_return.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-medium ${
                          investment.actual_profit_loss >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                          ${investment.actual_profit_loss.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${getStatusBadge(investment.status)}`}>
                          {getStatusLabel(investment.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {format(new Date(investment.start_date), 'MMM dd, yyyy')}
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
