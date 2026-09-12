'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/lib/api';
import { InvestmentPackage } from '@/types';
import toast from 'react-hot-toast';
import Image from 'next/image';

export default function AdminPackagesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const [packages, setPackages] = useState<InvestmentPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPackage, setEditingPackage] = useState<InvestmentPackage | null>(null);
  const [formData, setFormData] = useState<Partial<InvestmentPackage>>({});

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
    } else if (user) {
      fetchPackages();
    }
  }, [user, isLoading, router]);

  const fetchPackages = async () => {
    try {
      const response = await api.get('/packages');
      setPackages(response.data || []);
    } catch (error) {
      toast.error('Failed to fetch packages');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (pkg: InvestmentPackage) => {
    setEditingPackage(pkg);
    setFormData(pkg);
  };

  const handleSave = async () => {
    if (!editingPackage) return;

    try {
      await api.put(`/admin/packages/${editingPackage.id}`, formData);
      toast.success(t('admin.updatePackage') + ' successful!');
      setEditingPackage(null);
      fetchPackages();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update package');
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
          <h1 className="text-2xl font-bold text-gray-900">{t('packages.title')}</h1>
          <p className="text-gray-600">Manage investment packages and update images</p>
        </div>

        {/* Edit Modal */}
        {editingPackage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">{t('admin.updatePackage')}</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">{t('admin.packageName')}</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">{t('admin.packageNameAmharic')}</label>
                    <input
                      type="text"
                      value={formData.name_am || ''}
                      onChange={(e) => setFormData({ ...formData, name_am: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">{t('admin.description')}</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="label">{t('admin.descriptionAmharic')}</label>
                  <textarea
                    value={formData.description_am || ''}
                    onChange={(e) => setFormData({ ...formData, description_am: e.target.value })}
                    className="input"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="label">{t('admin.imageUrl')}</label>
                  <input
                    type="text"
                    value={formData.image_url || ''}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="input"
                  />
                  {formData.image_url && (
                    <div className="mt-2 relative h-32 w-full rounded overflow-hidden">
                      <Image
                        src={formData.image_url}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="label">{t('admin.minAmount')}</label>
                    <input
                      type="number"
                      value={formData.minimum_amount || ''}
                      onChange={(e) => setFormData({ ...formData, minimum_amount: parseFloat(e.target.value) })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">{t('admin.targetPercentage')}</label>
                    <input
                      type="number"
                      value={formData.target_percentage || ''}
                      onChange={(e) => setFormData({ ...formData, target_percentage: parseFloat(e.target.value) })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">{t('admin.duration')}</label>
                    <input
                      type="number"
                      value={formData.duration_days || ''}
                      onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) })}
                      className="input"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.active || false}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="rounded"
                  />
                  <label>{t('admin.activeStatus')}</label>
                </div>

                <div className="flex gap-3 mt-6">
                  <button onClick={handleSave} className="btn btn-primary flex-1">
                    {t('common.save')}
                  </button>
                  <button
                    onClick={() => setEditingPackage(null)}
                    className="btn btn-secondary"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Packages List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <div key={pkg.id} className="card">
              {pkg.image_url && (
                <div className="relative h-40 w-full -mt-6 -mx-6 mb-4 rounded-t-lg overflow-hidden">
                  <Image
                    src={pkg.image_url}
                    alt={pkg.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              
              <h3 className="text-lg font-bold">{pkg.name}</h3>
              {pkg.name_am && <p className="text-sm text-gray-600">{pkg.name_am}</p>}
              
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Min Amount:</span>
                  <span className="font-medium">${pkg.minimum_amount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Target:</span>
                  <span className="font-medium">{pkg.target_percentage}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span className="font-medium">{pkg.duration_days} days</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={`badge ${pkg.active ? 'badge-success' : 'badge-danger'}`}>
                    {pkg.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleEdit(pkg)}
                className="btn btn-secondary w-full mt-4"
              >
                {t('common.edit')}
              </button>
            </div>
          ))}
        </div>

        <div className="card bg-blue-50 border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-2">💡 Image URL Tips</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
            <li>Use Unsplash for free high-quality images: https://unsplash.com/</li>
            <li>Example format: https://images.unsplash.com/photo-xxxxx?w=400</li>
            <li>Images should be relevant to investment/finance/growth themes</li>
            <li>Recommended dimensions: 400x300 or similar aspect ratio</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
