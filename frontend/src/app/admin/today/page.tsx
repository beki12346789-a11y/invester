'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import StatCard from '@/components/StatCard';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { TodayActivity } from '@/types';

export default function AdminTodayPage() {
  const { isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [activity, setActivity] = useState<TodayActivity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push('/dashboard');
    } else if (isAdmin) {
      fetchActivity();
      // Refresh every 30 seconds
      const interval = setInterval(fetchActivity, 30000);
      return () => clearInterval(interval);
    }
  }, [isAdmin, isLoading, router]);

  const fetchActivity = async () => {
    try {
      const response = await api.get('/admin/today');
      setActivity(response.data);
    } catch (error) {
      console.error('Failed to fetch today activity:', error);
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

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Today's Activity</h1>
            <p className="text-gray-600">Real-time platform operations</p>
          </div>
          <button onClick={fetchActivity} className="btn btn-secondary text-sm">
            🔄 Refresh
          </button>
        </div>

        {/* User Activity */}
        <div>
          <h2 className="text-lg font-semibold mb-3">User Activity</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="New Users"
              value={activity?.new_users || 0}
              subtitle="Registered today"
            />
            <StatCard
              title="Deposits"
              value={`$${activity?.deposits.toFixed(2) || '0.00'}`}
              subtitle="Total deposited"
            />
            <StatCard
              title="Investments"
              value={`$${activity?.investments.toFixed(2) || '0.00'}`}
              subtitle={`${activity?.investment_count || 0} new investments`}
            />
          </div>
        </div>

        {/* Trading Activity */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Trading Activity</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Product Purchases"
              value={`$${activity?.product_purchases.toFixed(2) || '0.00'}`}
              subtitle={`${activity?.purchase_count || 0} BUY transactions`}
            />
            <StatCard
              title="Product Sales"
              value={`$${activity?.product_sales.toFixed(2) || '0.00'}`}
              subtitle={`${activity?.sale_count || 0} SELL transactions`}
            />
            <StatCard
              title="Trading Profit"
              value={`$${activity?.trading_profit.toFixed(2) || '0.00'}`}
              subtitle="Net profit today"
              trend={activity && activity.trading_profit >= 0 ? 'up' : 'down'}
            />
          </div>
        </div>

        {/* Withdrawal Activity */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Withdrawal Activity</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard
              title="Withdrawal Requests"
              value={`$${activity?.withdrawal_requests.toFixed(2) || '0.00'}`}
              subtitle={`${activity?.withdrawal_request_count || 0} new requests`}
            />
            <StatCard
              title="Completed Withdrawals"
              value={`$${activity?.completed_withdrawals.toFixed(2) || '0.00'}`}
              subtitle={`${activity?.completed_withdrawal_count || 0} completed`}
            />
          </div>
        </div>

        {/* Activity Summary */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">📊 Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Money In</h3>
              <ul className="space-y-1">
                <li className="flex justify-between">
                  <span className="text-gray-600">Deposits:</span>
                  <span className="font-medium text-green-600">+${activity?.deposits.toFixed(2)}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Sales Revenue:</span>
                  <span className="font-medium text-green-600">+${activity?.product_sales.toFixed(2)}</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Money Out</h3>
              <ul className="space-y-1">
                <li className="flex justify-between">
                  <span className="text-gray-600">Investments:</span>
                  <span className="font-medium text-red-600">-${activity?.investments.toFixed(2)}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Purchases:</span>
                  <span className="font-medium text-red-600">-${activity?.product_purchases.toFixed(2)}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Withdrawals:</span>
                  <span className="font-medium text-red-600">-${activity?.completed_withdrawals.toFixed(2)}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
