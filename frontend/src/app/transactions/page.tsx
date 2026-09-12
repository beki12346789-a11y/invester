'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/lib/api';
import { Transaction } from '@/types';
import { format } from 'date-fns';

export default function TransactionsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    } else if (user) {
      fetchTransactions();
    }
  }, [user, isLoading, router]);

  const fetchTransactions = async () => {
    try {
      const response = await api.get('/me/transactions');
      setTransactions(response.data || []);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionColor = (type: string) => {
    if (type.includes('DEPOSIT') || type.includes('PROFIT')) {
      return 'text-green-600';
    }
    return 'text-red-600';
  };

  const getTransactionSign = (type: string) => {
    if (type.includes('DEPOSIT') || type.includes('PROFIT')) {
      return '+';
    }
    return '-';
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('transactions.title')}</h1>
          <p className="text-gray-600">{t('transactions.myTransactions')}</p>
        </div>

        <div className="card">
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">{t('transactions.noTransactions')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('transactions.type')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('transactions.description')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('common.amount')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('transactions.balanceBefore')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('transactions.balanceAfter')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('common.date')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${getTransactionColor(transaction.type)}`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{transaction.description}</td>
                      <td className={`px-4 py-3 text-sm font-medium ${getTransactionColor(transaction.type)}`}>
                        {getTransactionSign(transaction.type)}${transaction.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        ${transaction.balance_before.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        ${transaction.balance_after.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {format(new Date(transaction.created_at), 'MMM dd, yyyy HH:mm')}
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
