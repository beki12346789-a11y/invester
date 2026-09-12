'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/lib/api';
import { formatBirr } from '@/lib/currency';
import { InvestmentPackage, Wallet } from '@/types';
import toast from 'react-hot-toast';

export default function PackagesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { locale, t } = useLanguage();
  const [packages, setPackages] = useState<InvestmentPackage[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [investing, setInvesting] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    } else if (user) {
      fetchData();
    }
  }, [user, isLoading, router]);

  const fetchData = async () => {
    try {
      const [packagesRes, walletRes] = await Promise.all([
        api.get('/packages'),
        api.get('/me/wallet'),
      ]);
      setPackages(packagesRes.data || []);
      setWallet(walletRes.data);
    } catch (error) {
      toast.error('Failed to fetch packages');
    } finally {
      setLoading(false);
    }
  };

  const handleInvestClick = (pkg: InvestmentPackage) => {
    // Check if user has enough balance
    if (!wallet || wallet.balance < pkg.minimum_amount) {
      toast.error('💰 Insufficient balance! Please add money first.', { duration: 4000 });
      setTimeout(() => {
        router.push('/deposit');
      }, 1500);
      return;
    }

    setSelectedPackage(pkg.id);
    setAmount(pkg.minimum_amount.toString());
  };

  const handleInvest = async (pkg: InvestmentPackage) => {
    const investAmount = parseFloat(amount);
    
    if (!investAmount || investAmount < pkg.minimum_amount) {
      toast.error(`Minimum amount: ${formatBirr(pkg.minimum_amount)}`);
      return;
    }

    if (wallet && investAmount > wallet.balance) {
      toast.error('Insufficient balance! Redirecting to deposit page...');
      setTimeout(() => router.push('/deposit'), 1500);
      return;
    }

    setInvesting(true);
    try {
      await api.post('/investments', {
        package_id: pkg.id,
        amount: investAmount,
      });
      toast.success('✅ Investment created successfully!');
      setSelectedPackage(null);
      setAmount('');
      setTimeout(() => router.push('/investments'), 1000);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create investment');
    } finally {
      setInvesting(false);
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
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="section-header">📦 Investment Packages</h1>
            <p className="text-sm sm:text-base text-gray-600">Choose your investment package</p>
          </div>
          <div className="card-compact bg-primary-50 border border-primary-200">
            <p className="text-xs text-primary-700 font-medium">Your Balance</p>
            <p className="text-xl sm:text-2xl font-bold text-primary-600">{formatBirr(wallet?.balance || 0)}</p>
          </div>
        </div>

        {/* Packages Grid - 1 column mobile, 2 columns tablet, 3 desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {packages.map((pkg) => (
            <div key={pkg.id} className="card hover:shadow-xl transition-all border-2 border-gray-100 hover:border-primary-300 overflow-hidden p-0">
              {/* Package Image */}
              {pkg.image_url && (
                <div className="relative w-full h-40 sm:h-48 bg-gray-100">
                  <img
                    src={pkg.image_url}
                    alt={locale === 'am' && pkg.name_am ? pkg.name_am : pkg.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1579621970795-87facc2f976d?w=800&q=80';
                    }}
                  />
                  <div className="absolute top-2 right-2 bg-white px-3 py-1 rounded-full shadow-lg">
                    <span className="text-lg sm:text-xl font-bold text-primary-600">{pkg.target_percentage}%</span>
                  </div>
                </div>
              )}

              <div className="p-4 sm:p-6">
                {/* Package Name */}
                <div className="mb-4">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                    {locale === 'am' && pkg.name_am ? pkg.name_am : pkg.name}
                  </h3>
                  {(locale === 'am' ? pkg.description_am : pkg.description) && (
                    <p className="text-xs sm:text-sm text-gray-600 mt-2 line-clamp-2">
                      {locale === 'am' && pkg.description_am ? pkg.description_am : pkg.description}
                    </p>
                  )}
                </div>

                {/* Package Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-xs sm:text-sm text-gray-600">💰 Minimum</span>
                    <span className="text-xs sm:text-sm font-bold text-gray-900">{formatBirr(pkg.minimum_amount)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-xs sm:text-sm text-gray-600">⏱️ Duration</span>
                    <span className="text-xs sm:text-sm font-bold text-gray-900">{pkg.duration_days} days</span>
                  </div>
                  <div className="flex justify-between items-center py-2 bg-green-50 px-2 rounded">
                    <span className="text-xs sm:text-sm text-gray-600">🎯 Target Profit</span>
                    <span className="text-xs sm:text-sm font-bold text-green-600">
                      {formatBirr((pkg.minimum_amount * pkg.target_percentage) / 100)}
                    </span>
                  </div>
                </div>

                {/* Investment Form or Button */}
                {selectedPackage === pkg.id ? (
                  <div className="space-y-3">
                    <div className="form-group mb-0">
                      <label className="label text-xs">Investment Amount (Birr)</label>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder={`Min: ${pkg.minimum_amount}`}
                        className="input"
                        min={pkg.minimum_amount}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleInvest(pkg)}
                        disabled={investing}
                        className="btn btn-success flex-1 text-sm sm:text-base"
                      >
                        {investing ? '⏳ Processing...' : '✅ Confirm'}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPackage(null);
                          setAmount('');
                        }}
                        className="btn btn-secondary text-sm sm:text-base"
                      >
                        ✖️
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleInvestClick(pkg)}
                    className="btn btn-primary w-full text-sm sm:text-base font-bold"
                  >
                    🚀 Invest Now
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add Money Banner */}
        {wallet && wallet.balance < 1000 && (
          <div className="card bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200">
            <div className="flex items-center gap-4">
              <div className="text-4xl">💰</div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">Need more funds?</h3>
                <p className="text-sm text-gray-600">Add money to your wallet to invest in packages</p>
              </div>
              <button
                onClick={() => router.push('/deposit')}
                className="btn btn-warning font-bold"
              >
                Add Money
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
