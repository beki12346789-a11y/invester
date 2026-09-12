'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { format } from 'date-fns';

interface UserDetails {
  user: any;
  wallet: any;
  investments: any[];
  transactions: any[];
  withdrawals: any[];
}

export default function AdminUserDetailsPage() {
  const { isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const [details, setDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push('/dashboard');
    } else if (isAdmin && userId) {
      fetchUserDetails();
    }
  }, [isAdmin, isLoading, userId, router]);

  const fetchUserDetails = async () => {
    try {
      const response = await api.get(`/admin/users/${userId}`);
      setDetails(response.data);
    } catch (error) {
      console.error('Failed to fetch user details:', error);
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

  if (!details) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">User not found</p>
          <button onClick={() => router.push('/admin/users')} className="btn btn-primary mt-4">
            Back to Users
          </button>
        </div>
      </Layout>
    );
  }

  const { user, wallet, investments, transactions, withdrawals } = details;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.full_name}</h1>
            <p className="text-gray-600">{user.phone_number}</p>
          </div>
          <button onClick={() => router.push('/admin/users')} className="btn btn-secondary">
            ← Back to Users
          </button>
        </div>

        {/* User Info & Wallet Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <p className="text-sm text-gray-600">Current Balance</p>
            <p className="text-2xl font-bold text-primary-600">${wallet?.balance.toFixed(2) || '0.00'}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">Total Deposited</p>
            <p className="text-2xl font-bold">${wallet?.total_deposited.toFixed(2) || '0.00'}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">Total Invested</p>
            <p className="text-2xl font-bold">${wallet?.total_invested.toFixed(2) || '0.00'}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">Total Withdrawn</p>
            <p className="text-2xl font-bold">${wallet?.total_withdrawn.toFixed(2) || '0.00'}</p>
          </div>
        </div>

        {/* Investments */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Investments</h2>
          {!investments || investments.length === 0 ? (
            <p className="text-gray-500">No investments</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Package</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Target Return</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actual P/L</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {investments.map((inv: any) => (
                    <tr key={inv.id}>
                      <td className="px-3 py-2">{inv.package_name}</td>
                      <td className="px-3 py-2 font-medium">${inv.amount.toFixed(2)}</td>
                      <td className="px-3 py-2">${inv.target_return.toFixed(2)}</td>
                      <td className={`px-3 py-2 font-medium ${inv.actual_profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${inv.actual_profit_loss.toFixed(2)}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`badge ${inv.status === 'active' ? 'badge-success' : 'badge-info'}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-500">
                        {format(new Date(inv.start_date), 'MMM dd, yyyy')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Withdrawals */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Withdrawal Requests</h2>
          {!withdrawals || withdrawals.length === 0 ? (
            <p className="text-gray-500">No withdrawal requests</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Requested</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {withdrawals.map((w: any) => (
                    <tr key={w.id}>
                      <td className="px-3 py-2 font-medium">${w.amount.toFixed(2)}</td>
                      <td className="px-3 py-2">{w.withdrawal_method}</td>
                      <td className="px-3 py-2">
                        <span className={`badge ${
                          w.status === 'completed' ? 'badge-success' :
                          w.status === 'rejected' ? 'badge-danger' :
                          w.status === 'approved' ? 'badge-info' : 'badge-warning'
                        }`}>
                          {w.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-500">
                        {format(new Date(w.requested_at), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-3 py-2 text-gray-500">{w.admin_notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>
          {!transactions || transactions.length === 0 ? (
            <p className="text-gray-500">No transactions</p>
          ) : (
            <div className="space-y-2">
              {transactions.slice(0, 10).map((tx: any) => (
                <div key={tx.id} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{tx.type}</p>
                    <p className="text-xs text-gray-500">{tx.description}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${
                      tx.type.includes('DEPOSIT') || tx.type.includes('PROFIT') ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ${tx.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(tx.created_at), 'MMM dd, HH:mm')}
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
