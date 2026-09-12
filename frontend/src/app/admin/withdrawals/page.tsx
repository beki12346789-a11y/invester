'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Withdrawal } from '@/types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function AdminWithdrawalsPage() {
  const { user, isLoading, isAdmin } = useAuth();
  const router = useRouter();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push('/dashboard');
    } else if (isAdmin) {
      fetchWithdrawals();
    }
  }, [isAdmin, isLoading, router, filter]);

  const fetchWithdrawals = async () => {
    try {
      const response = await api.get(`/admin/withdrawals?status=${filter === 'all' ? '' : filter}`);
      setWithdrawals(response.data || []);
    } catch (error) {
      console.error('Failed to fetch withdrawals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setProcessing(id);
    try {
      await api.post(`/admin/withdrawals/${id}/approve`, {
        admin_notes: 'Approved by admin',
      });
      toast.success('Withdrawal approved');
      fetchWithdrawals();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to approve');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: string) => {
    const notes = prompt('Enter rejection reason:');
    if (!notes) return;

    setProcessing(id);
    try {
      await api.post(`/admin/withdrawals/${id}/reject`, {
        admin_notes: notes,
      });
      toast.success('Withdrawal rejected');
      fetchWithdrawals();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to reject');
    } finally {
      setProcessing(null);
    }
  };

  const handleComplete = async (id: string) => {
    if (!confirm('Mark this withdrawal as completed? This will deduct the amount from user balance.')) {
      return;
    }

    setProcessing(id);
    try {
      await api.post(`/admin/withdrawals/${id}/complete`, {
        admin_notes: 'Payment completed',
      });
      toast.success('Withdrawal completed');
      fetchWithdrawals();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to complete');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'badge badge-warning',
      approved: 'badge badge-info',
      completed: 'badge badge-success',
      rejected: 'badge badge-danger',
    };
    return badges[status as keyof typeof badges] || 'badge';
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
          <h1 className="text-2xl font-bold text-gray-900">Withdrawal Management</h1>
          <p className="text-gray-600">Review and process withdrawal requests</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2">
          {['pending', 'approved', 'completed', 'rejected', 'all'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Withdrawals Table */}
        <div className="card">
          {withdrawals.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No {filter !== 'all' ? filter : ''} withdrawals</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account Details</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {withdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id}>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium">{withdrawal.user_name}</div>
                        <div className="text-xs text-gray-500">{withdrawal.user_phone}</div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">${withdrawal.amount.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm">{withdrawal.withdrawal_method}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{withdrawal.account_details}</td>
                      <td className="px-4 py-3">
                        <span className={getStatusBadge(withdrawal.status)}>
                          {withdrawal.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {format(new Date(withdrawal.requested_at), 'MMM dd, yyyy HH:mm')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {withdrawal.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(withdrawal.id)}
                                disabled={processing === withdrawal.id}
                                className="text-xs btn btn-success"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(withdrawal.id)}
                                disabled={processing === withdrawal.id}
                                className="text-xs btn btn-danger"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {withdrawal.status === 'approved' && (
                            <button
                              onClick={() => handleComplete(withdrawal.id)}
                              disabled={processing === withdrawal.id}
                              className="text-xs btn btn-primary"
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payment Information Card */}
        <div className="card bg-blue-50 border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-3">💳 Payment Account Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-blue-800">Telebirr</p>
              <p className="text-blue-700">Phone: 0954381944</p>
              <p className="text-blue-700">Name: ጤናው አክሊሉ</p>
            </div>
            <div>
              <p className="font-medium text-blue-800">CBE Bank</p>
              <p className="text-blue-700">Account: 1000715798488</p>
              <p className="text-blue-700">Name: Bereket Melese Mulugeta</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
