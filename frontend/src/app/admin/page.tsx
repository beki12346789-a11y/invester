'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import StatCard from '@/components/StatCard';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { DashboardStats } from '@/types';

export default function AdminDashboardPage() {
  const { user, isLoading, isAdmin } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    } else if (!isLoading && !isAdmin) {
      router.push('/dashboard');
    } else if (isAdmin) {
      fetchStats();
    }
  }, [user, isLoading, isAdmin, router]);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/dashboard');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Platform overview and statistics</p>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Users"
            value={stats?.total_users || 0}
            subtitle="Registered users"
          />
          <StatCard
            title="Total Investments"
            value={`$${stats?.total_investments.toFixed(2) || '0.00'}`}
            subtitle="Active capital"
          />
          <StatCard
            title="Trading Capital"
            value={`$${stats?.trading_capital.toFixed(2) || '0.00'}`}
            subtitle="Available for trading"
          />
          <StatCard
            title="Inventory Value"
            value={`$${stats?.inventory_value.toFixed(2) || '0.00'}`}
            subtitle="Current stock value"
          />
        </div>

        {/* Financial Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="Total Sales"
            value={`$${stats?.total_sales.toFixed(2) || '0.00'}`}
            subtitle="Lifetime revenue"
          />
          <StatCard
            title="Trading Profit"
            value={`$${stats?.trading_profit.toFixed(2) || '0.00'}`}
            subtitle="Total profit/loss"
            trend={stats && stats.trading_profit >= 0 ? 'up' : 'down'}
          />
          <StatCard
            title="Pending Withdrawals"
            value={`$${stats?.pending_withdrawals.toFixed(2) || '0.00'}`}
            subtitle={`${stats?.pending_withdrawal_count || 0} requests`}
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => router.push('/admin/today')}
            className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
          >
            <h3 className="font-semibold text-primary-600">Today's Activity</h3>
            <p className="text-sm text-gray-600 mt-1">View real-time operations</p>
          </button>
          <button
            onClick={() => router.push('/admin/users')}
            className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
          >
            <h3 className="font-semibold text-primary-600">Manage Users</h3>
            <p className="text-sm text-gray-600 mt-1">View and search users</p>
          </button>
          <button
            onClick={() => router.push('/admin/trading')}
            className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
          >
            <h3 className="font-semibold text-primary-600">Trading Operations</h3>
            <p className="text-sm text-gray-600 mt-1">Record BUY/SELL</p>
          </button>
          <button
            onClick={() => router.push('/admin/withdrawals')}
            className="card hover:shadow-lg transition-shadow cursor-pointer text-left"
          >
            <h3 className="font-semibold text-primary-600">Withdrawals</h3>
            <p className="text-sm text-gray-600 mt-1">Process requests</p>
          </button>
        </div>
      </div>
    </Layout>
  );
}
