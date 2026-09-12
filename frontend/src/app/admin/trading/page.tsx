'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Product, Purchase, Sale } from '@/types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function AdminTradingPage() {
  const { user, isLoading, isAdmin } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'buy' | 'sell' | 'history'>('buy');
  const [submitting, setSubmitting] = useState(false);

  const [buyForm, setBuyForm] = useState({
    product_id: '',
    supplier: '',
    country: '',
    quantity: '',
    price_per_unit: '',
    shipping_cost: '',
    customs_cost: '',
    other_expenses: '',
    purchase_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [sellForm, setSellForm] = useState({
    product_id: '',
    buyer: '',
    country: '',
    quantity: '',
    price_per_unit: '',
    selling_expenses: '',
    sale_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push('/dashboard');
    } else if (isAdmin) {
      fetchData();
    }
  }, [isAdmin, isLoading, router]);

  const fetchData = async () => {
    try {
      const [productsRes, purchasesRes, salesRes] = await Promise.all([
        api.get('/admin/products'),
        api.get('/admin/purchases?limit=50'),
        api.get('/admin/sales?limit=50'),
      ]);
      setProducts(productsRes.data || []);
      setPurchases(purchasesRes.data || []);
      setSales(salesRes.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/admin/purchases', {
        ...buyForm,
        quantity: parseInt(buyForm.quantity),
        price_per_unit: parseFloat(buyForm.price_per_unit),
        shipping_cost: parseFloat(buyForm.shipping_cost) || 0,
        customs_cost: parseFloat(buyForm.customs_cost) || 0,
        other_expenses: parseFloat(buyForm.other_expenses) || 0,
      });
      toast.success('Purchase recorded successfully!');
      setBuyForm({
        product_id: '',
        supplier: '',
        country: '',
        quantity: '',
        price_per_unit: '',
        shipping_cost: '',
        customs_cost: '',
        other_expenses: '',
        purchase_date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      fetchData();
      setActiveTab('history');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to record purchase');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSellSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/admin/sales', {
        ...sellForm,
        quantity: parseInt(sellForm.quantity),
        price_per_unit: parseFloat(sellForm.price_per_unit),
        selling_expenses: parseFloat(sellForm.selling_expenses) || 0,
      });
      toast.success('Sale recorded successfully!');
      setSellForm({
        product_id: '',
        buyer: '',
        country: '',
        quantity: '',
        price_per_unit: '',
        selling_expenses: '',
        sale_date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      fetchData();
      setActiveTab('history');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to record sale');
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trading Operations</h1>
          <p className="text-gray-600">Record product purchases (BUY) and sales (SELL)</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 border-b">
          <button
            onClick={() => setActiveTab('buy')}
            className={`pb-2 px-4 font-medium ${
              activeTab === 'buy'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Record BUY
          </button>
          <button
            onClick={() => setActiveTab('sell')}
            className={`pb-2 px-4 font-medium ${
              activeTab === 'sell'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Record SELL
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2 px-4 font-medium ${
              activeTab === 'history'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Trading History
          </button>
        </div>

        {/* BUY Form */}
        {activeTab === 'buy' && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Record Product Purchase (BUY)</h2>
            <form onSubmit={handleBuySubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Product</label>
                  <select
                    value={buyForm.product_id}
                    onChange={(e) => setBuyForm({ ...buyForm, product_id: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">Select product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.sku})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Supplier</label>
                  <input
                    type="text"
                    value={buyForm.supplier}
                    onChange={(e) => setBuyForm({ ...buyForm, supplier: e.target.value })}
                    className="input"
                    required
                    placeholder="Supplier name"
                  />
                </div>
                <div>
                  <label className="label">Country</label>
                  <input
                    type="text"
                    value={buyForm.country}
                    onChange={(e) => setBuyForm({ ...buyForm, country: e.target.value })}
                    className="input"
                    required
                    placeholder="e.g., Japan"
                  />
                </div>
                <div>
                  <label className="label">Quantity</label>
                  <input
                    type="number"
                    value={buyForm.quantity}
                    onChange={(e) => setBuyForm({ ...buyForm, quantity: e.target.value })}
                    className="input"
                    required
                    min="1"
                  />
                </div>
                <div>
                  <label className="label">Price per Unit ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={buyForm.price_per_unit}
                    onChange={(e) => setBuyForm({ ...buyForm, price_per_unit: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Shipping Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={buyForm.shipping_cost}
                    onChange={(e) => setBuyForm({ ...buyForm, shipping_cost: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Customs Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={buyForm.customs_cost}
                    onChange={(e) => setBuyForm({ ...buyForm, customs_cost: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Other Expenses ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={buyForm.other_expenses}
                    onChange={(e) => setBuyForm({ ...buyForm, other_expenses: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Purchase Date</label>
                  <input
                    type="date"
                    value={buyForm.purchase_date}
                    onChange={(e) => setBuyForm({ ...buyForm, purchase_date: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea
                  value={buyForm.notes}
                  onChange={(e) => setBuyForm({ ...buyForm, notes: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder="Optional notes about this purchase"
                />
              </div>
              <button type="submit" disabled={submitting} className="btn btn-primary">
                {submitting ? 'Recording...' : 'Record Purchase'}
              </button>
            </form>
          </div>
        )}

        {/* SELL Form */}
        {activeTab === 'sell' && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Record Product Sale (SELL)</h2>
            <form onSubmit={handleSellSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Product</label>
                  <select
                    value={sellForm.product_id}
                    onChange={(e) => setSellForm({ ...sellForm, product_id: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">Select product</option>
                    {products.filter(p => p.current_quantity > 0).map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.sku}) - Stock: {product.current_quantity}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Buyer</label>
                  <input
                    type="text"
                    value={sellForm.buyer}
                    onChange={(e) => setSellForm({ ...sellForm, buyer: e.target.value })}
                    className="input"
                    required
                    placeholder="Buyer name"
                  />
                </div>
                <div>
                  <label className="label">Country</label>
                  <input
                    type="text"
                    value={sellForm.country}
                    onChange={(e) => setSellForm({ ...sellForm, country: e.target.value })}
                    className="input"
                    required
                    placeholder="e.g., South Korea"
                  />
                </div>
                <div>
                  <label className="label">Quantity</label>
                  <input
                    type="number"
                    value={sellForm.quantity}
                    onChange={(e) => setSellForm({ ...sellForm, quantity: e.target.value })}
                    className="input"
                    required
                    min="1"
                  />
                </div>
                <div>
                  <label className="label">Price per Unit ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={sellForm.price_per_unit}
                    onChange={(e) => setSellForm({ ...sellForm, price_per_unit: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Selling Expenses ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={sellForm.selling_expenses}
                    onChange={(e) => setSellForm({ ...sellForm, selling_expenses: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Sale Date</label>
                  <input
                    type="date"
                    value={sellForm.sale_date}
                    onChange={(e) => setSellForm({ ...sellForm, sale_date: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea
                  value={sellForm.notes}
                  onChange={(e) => setSellForm({ ...sellForm, notes: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder="Optional notes about this sale"
                />
              </div>
              <button type="submit" disabled={submitting} className="btn btn-primary">
                {submitting ? 'Recording...' : 'Record Sale'}
              </button>
            </form>
          </div>
        )}

        {/* History */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            {/* Recent Purchases */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Recent Purchases (BUY)</h2>
              {purchases.length === 0 ? (
                <p className="text-gray-500">No purchases recorded</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead>
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Country</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {purchases.slice(0, 10).map((purchase) => (
                        <tr key={purchase.id}>
                          <td className="px-3 py-2">{format(new Date(purchase.purchase_date), 'MMM dd, yyyy')}</td>
                          <td className="px-3 py-2 font-medium">{purchase.product_name}</td>
                          <td className="px-3 py-2">{purchase.supplier}</td>
                          <td className="px-3 py-2">{purchase.country}</td>
                          <td className="px-3 py-2">{purchase.quantity}</td>
                          <td className="px-3 py-2">${purchase.price_per_unit.toFixed(2)}</td>
                          <td className="px-3 py-2 font-medium">${purchase.total_cost.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent Sales */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Recent Sales (SELL)</h2>
              {sales.length === 0 ? (
                <p className="text-gray-500">No sales recorded</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead>
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Buyer</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Country</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Profit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {sales.slice(0, 10).map((sale) => (
                        <tr key={sale.id}>
                          <td className="px-3 py-2">{format(new Date(sale.sale_date), 'MMM dd, yyyy')}</td>
                          <td className="px-3 py-2 font-medium">{sale.product_name}</td>
                          <td className="px-3 py-2">{sale.buyer}</td>
                          <td className="px-3 py-2">{sale.country}</td>
                          <td className="px-3 py-2">{sale.quantity}</td>
                          <td className="px-3 py-2">${sale.price_per_unit.toFixed(2)}</td>
                          <td className="px-3 py-2 font-medium">${sale.revenue.toFixed(2)}</td>
                          <td className={`px-3 py-2 font-medium ${sale.gross_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${sale.gross_profit.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
