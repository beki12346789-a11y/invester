'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Product } from '@/types';
import toast from 'react-hot-toast';

export default function AdminProductsPage() {
  const { isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
  });

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push('/dashboard');
    } else if (isAdmin) {
      fetchProducts();
    }
  }, [isAdmin, isLoading, router]);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/admin/products');
      setProducts(response.data || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/admin/products', formData);
      toast.success('Product created successfully!');
      setFormData({ name: '', sku: '', category: '' });
      setShowForm(false);
      fetchProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create product');
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

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
            <p className="text-gray-600">Manage products and inventory</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
            {showForm ? 'Cancel' : '+ Add Product'}
          </button>
        </div>

        {/* Add Product Form */}
        {showForm && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Add New Product</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label">Product Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    required
                    placeholder="e.g., Electric Stove Premium"
                  />
                </div>
                <div>
                  <label className="label">SKU</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="input"
                    required
                    placeholder="e.g., ESTOVE-002"
                  />
                </div>
                <div>
                  <label className="label">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input"
                    required
                    placeholder="e.g., Kitchen Appliances"
                  />
                </div>
              </div>
              <button type="submit" disabled={submitting} className="btn btn-primary">
                {submitting ? 'Creating...' : 'Create Product'}
              </button>
            </form>
          </div>
        )}

        {/* Products & Inventory Table */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Products & Inventory</h2>
          {products.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No products yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Purchased</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Sold</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td className="px-4 py-3 text-sm font-medium">{product.name}</td>
                      <td className="px-4 py-3 text-sm">{product.sku}</td>
                      <td className="px-4 py-3 text-sm">{product.category}</td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-medium ${
                          product.current_quantity > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {product.current_quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{product.total_purchased}</td>
                      <td className="px-4 py-3 text-sm">{product.total_sold}</td>
                      <td className="px-4 py-3 text-sm">${product.average_cost.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Inventory Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card bg-green-50">
            <p className="text-sm text-green-700">Total Products</p>
            <p className="text-2xl font-bold text-green-900">{products.length}</p>
          </div>
          <div className="card bg-blue-50">
            <p className="text-sm text-blue-700">Total Stock</p>
            <p className="text-2xl font-bold text-blue-900">
              {products.reduce((sum, p) => sum + p.current_quantity, 0)}
            </p>
          </div>
          <div className="card bg-purple-50">
            <p className="text-sm text-purple-700">Total Inventory Value</p>
            <p className="text-2xl font-bold text-purple-900">
              ${products.reduce((sum, p) => sum + (p.current_quantity * p.average_cost), 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
