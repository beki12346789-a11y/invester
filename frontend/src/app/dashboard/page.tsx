'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import StatCard from '@/components/StatCard';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/lib/api';
import { formatBirr } from '@/lib/currency';
import { Wallet, Investment, Transaction } from '@/types';
import { format } from 'date-fns';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    } else if (user?.role === 'admin') {
      router.push('/admin');
    } else if (user) {
      fetchData();
    }
  }, [user, isLoading, router]);

  const fetchData = async () => {
    try {
      const [walletRes, investmentsRes, transactionsRes] = await Promise.all([
        api.get('/me/wallet'),
        api.get('/me/investments'),
        api.get('/me/transactions?limit=5'),
      ]);
      setWallet(walletRes.data);
      setInvestments(investmentsRes.data || []);
      setTransactions(transactionsRes.data || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
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

  const totalInvested = investments
    .filter(inv => inv.status === 'active')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const totalTargetReturn = investments
    .filter(inv => inv.status === 'active')
    .reduce((sum, inv) => sum + inv.target_return, 0);

  const totalActualPL = investments
    .filter(inv => inv.status === 'active')
    .reduce((sum, inv) => sum + inv.actual_profit_loss, 0);

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="mb-4">
          <h1 className="section-header">{t('dashboard.title')}</h1>
          <p className="text-sm sm:text-base text-gray-600">{t('dashboard.welcome')}, {user?.full_name}</p>
        </div>

        {/* Stats Grid - 2 Columns on Mobile, 4 on Desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <StatCard
            title={t('dashboard.currentBalance')}
            value={formatBirr(wallet?.balance || 0)}
            subtitle={t('dashboard.availableFunds')}
            icon="💰"
            color="success"
          />
          <StatCard
            title={t('dashboard.totalInvested')}
            value={formatBirr(totalInvested)}
            subtitle={`${investments.filter(i => i.status === 'active').length} active`}
            icon="📈"
            color="primary"
          />
          <StatCard
            title="Target Return"
            value={formatBirr(totalTargetReturn)}
            subtitle={t('investments.targetProfit')}
            icon="🎯"
            color="purple"
          />
          <StatCard
            title="Actual Return"
            value={formatBirr(totalActualPL)}
            subtitle={t('investments.actualReturn')}
            trend={totalActualPL >= 0 ? 'up' : 'down'}
            icon={totalActualPL >= 0 ? '✅' : '📉'}
            color={totalActualPL >= 0 ? 'success' : 'danger'}
          />
        </div>

        {/* Active Investments - Mobile Optimized */}
        <div className="card">
          <h2 className="section-subheader">{t('dashboard.activeInvestments')}</h2>
          {investments.filter(inv => inv.status === 'active').length === 0 ? (
            <div className="text-center py-8">
              <p className="text-4xl mb-2">📦</p>
              <p className="text-gray-500">{t('investments.noInvestments')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Mobile: Card List */}
              <div className="block lg:hidden space-y-2">
                {investments.filter(inv => inv.status === 'active').map((investment) => (
                  <div key={investment.id} className="mobile-card-item">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{investment.package_name}</h4>
                        <p className="text-xs text-gray-500">{format(new Date(investment.start_date), 'MMM dd, yyyy')}</p>
                      </div>
                      <span className="badge badge-success">{investment.target_percentage}%</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                      <div>
                        <p className="text-xs text-gray-500">Amount</p>
                        <p className="font-semibold">{formatBirr(investment.amount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Target</p>
                        <p className="font-semibold text-purple-600">{formatBirr(investment.target_return)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Actual</p>
                        <p className={`font-semibold ${investment.actual_profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatBirr(investment.actual_profit_loss)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: Table */}
              <div className="hidden lg:block table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Package</th>
                      <th>Amount</th>
                      <th>%</th>
                      <th>Target</th>
                      <th>Actual</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {investments.filter(inv => inv.status === 'active').map((investment) => (
                      <tr key={investment.id}>
                        <td className="font-medium">{investment.package_name}</td>
                        <td className="font-semibold">{formatBirr(investment.amount)}</td>
                        <td><span className="badge badge-success">{investment.target_percentage}%</span></td>
                        <td className="text-purple-600 font-medium">{formatBirr(investment.target_return)}</td>
                        <td className={`font-semibold ${investment.actual_profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatBirr(investment.actual_profit_loss)}
                        </td>
                        <td className="text-gray-500 text-sm">
                          {format(new Date(investment.start_date), 'MMM dd, yyyy')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Recent Transactions - Mobile Optimized */}
        <div className="card">
          <h2 className="section-subheader">{t('dashboard.recentTransactions')}</h2>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-4xl mb-2">📝</p>
              <p className="text-gray-500">{t('dashboard.noTransactions')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="text-sm sm:text-base font-medium text-gray-900 truncate">{transaction.type}</p>
                    <p className="text-xs sm:text-sm text-gray-500 truncate">{transaction.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm sm:text-base font-bold ${transaction.type.includes('DEPOSIT') || transaction.type.includes('PROFIT') ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type.includes('DEPOSIT') || transaction.type.includes('PROFIT') ? '+' : '-'}
                      {formatBirr(transaction.amount)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(transaction.created_at), 'MMM dd, HH:mm')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
