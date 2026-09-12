'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { formatBirr } from '@/lib/currency';

interface BankAccount {
  id: string;
  account_type: string;
  account_name: string;
  account_number: string;
  bank_name: string;
  instructions: string;
}

export default function DepositPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    } else if (user?.role === 'admin') {
      router.push('/admin');
    } else if (user) {
      fetchBankAccounts();
    }
  }, [user, isLoading, router]);

  const fetchBankAccounts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/bank-accounts');
      setBankAccounts(response.data || []);
    } catch (error) {
      console.error('Failed to fetch bank accounts:', error);
      toast.error('Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!selectedMethod) {
      toast.error('Please select a payment method');
      return;
    }

    if (!transactionId.trim()) {
      toast.error('Please enter transaction ID');
      return;
    }

    setSubmitting(true);

    try {
      await api.post('/deposits', {
        amount: parseFloat(amount),
        payment_method: selectedMethod,
        transaction_id: transactionId,
      });

      toast.success('Deposit request submitted! Waiting for admin approval.');
      
      // Reset form
      setAmount('');
      setTransactionId('');
      
      // Redirect to transactions after 2 seconds
      setTimeout(() => {
        router.push('/transactions');
      }, 2000);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to submit deposit';
      toast.error(message);
    } finally {
      setSubmitting(false);
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

  const selectedAccount = bankAccounts.find(acc => acc.account_type === selectedMethod);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <h1 className="section-header">💰 Deposit Money</h1>
          <p className="text-sm sm:text-base text-gray-600">Add funds to your wallet to start investing</p>
        </div>

        {/* Amount Input */}
        <div className="card">
          <h2 className="section-subheader">1️⃣ Enter Amount</h2>
          <div className="form-group">
            <label className="label">Amount (Birr)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount in Birr"
              className="input text-lg font-semibold"
              min="1"
              step="0.01"
            />
            <p className="text-xs sm:text-sm text-gray-500 mt-2">
              Minimum: {formatBirr(100)}
            </p>
          </div>
        </div>

        {/* Select Payment Method */}
        <div className="card">
          <h2 className="section-subheader">2️⃣ Select Payment Method</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {bankAccounts.map((account) => (
              <button
                key={account.id}
                onClick={() => setSelectedMethod(account.account_type)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  selectedMethod === account.account_type
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 hover:border-primary-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-3xl">
                    {account.account_type === 'telebirr' && '📱'}
                    {account.account_type === 'cbe' && '🏦'}
                    {account.account_type === 'bank' && '💳'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{account.bank_name || account.account_type.toUpperCase()}</h3>
                    <p className="text-sm text-gray-600">{account.account_name}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Payment Instructions */}
        {selectedAccount && (
          <div className="card bg-blue-50 border-2 border-blue-200">
            <h2 className="section-subheader text-blue-900">3️⃣ Payment Instructions</h2>
            <div className="space-y-3">
              <div className="bg-white p-4 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Account Name</p>
                <p className="font-bold text-lg text-gray-900">{selectedAccount.account_name}</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Account Number</p>
                <p className="font-bold text-2xl text-primary-600">{selectedAccount.account_number}</p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedAccount.account_number);
                    toast.success('Account number copied!');
                  }}
                  className="mt-2 text-xs text-primary-600 hover:text-primary-700"
                >
                  📋 Copy Number
                </button>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-900">
                  {selectedAccount.instructions || 'Send money to the account above and enter the transaction ID below'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Transaction ID */}
        {selectedMethod && (
          <div className="card">
            <h2 className="section-subheader">4️⃣ Enter Transaction ID</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-group">
                <label className="label">Transaction ID / Reference Number</label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Enter your transaction ID"
                  className="input"
                  required
                />
                <p className="text-xs sm:text-sm text-gray-500 mt-2">
                  After sending money, enter the transaction ID you received
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting || !amount || !transactionId}
                className="btn btn-primary w-full py-3 text-lg font-bold"
              >
                {submitting ? '⏳ Submitting...' : '✅ Submit Deposit Request'}
              </button>
            </form>
          </div>
        )}

        {/* Help Notice */}
        <div className="card bg-gray-50">
          <h3 className="font-semibold text-gray-900 mb-2">📝 Important Notes:</h3>
          <ul className="text-sm text-gray-700 space-y-2">
            <li>✓ Your deposit will be reviewed and approved by admin</li>
            <li>✓ Approval usually takes 5-30 minutes</li>
            <li>✓ Make sure to enter the correct transaction ID</li>
            <li>✓ Keep your transaction receipt for verification</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
