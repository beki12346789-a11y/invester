'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Deposit {
  id: string;
  user_id: string;
  amount: number;
  payment_method: string;
  transaction_id: string;
  status: string;
  admin_note?: string;
  created_at: string;
  updated_at: string;
  user_phone?: string;
  user_name?: string;
}

interface SecurityAlert {
  type: 'duplicate_txn' | 'unusual_amount' | 'rapid_requests' | 'pattern_mismatch';
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export default function AdminDepositsPage() {
  const router = useRouter();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');

  const fetchDeposits = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const API_URL = typeof window !== 'undefined' 
        ? `http://${window.location.hostname}:8080`
        : 'http://localhost:8080';

      const response = await fetch(`${API_URL}/api/admin/deposits`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch deposits');
      const data = await response.json();
      setDeposits(data || []);
    } catch (error) {
      console.error('Error fetching deposits:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, []);

  // Security check: Detect suspicious patterns
  const getSecurityAlerts = (deposit: Deposit): SecurityAlert[] => {
    const alerts: SecurityAlert[] = [];
    
    // Check for duplicate transaction IDs
    const duplicates = deposits.filter(d => 
      d.transaction_id === deposit.transaction_id && d.id !== deposit.id
    );
    if (duplicates.length > 0) {
      alerts.push({
        type: 'duplicate_txn',
        message: `Duplicate transaction ID used ${duplicates.length} time(s)`,
        severity: 'high'
      });
    }

    // Check for unusual amounts (very high or suspiciously round numbers)
    if (deposit.amount > 50000) {
      alerts.push({
        type: 'unusual_amount',
        message: 'Unusually high amount - requires extra verification',
        severity: 'medium'
      });
    }

    // Check for rapid consecutive requests from same user
    const userDeposits = deposits.filter(d => d.user_id === deposit.user_id);
    const recentDeposits = userDeposits.filter(d => {
      const timeDiff = new Date(deposit.created_at).getTime() - new Date(d.created_at).getTime();
      return Math.abs(timeDiff) < 300000 && d.id !== deposit.id; // Within 5 minutes
    });
    if (recentDeposits.length > 0) {
      alerts.push({
        type: 'rapid_requests',
        message: `${recentDeposits.length + 1} requests within 5 minutes`,
        severity: 'medium'
      });
    }

    // Check transaction ID pattern
    if (deposit.transaction_id.length < 6) {
      alerts.push({
        type: 'pattern_mismatch',
        message: 'Transaction ID seems too short - verify authenticity',
        severity: 'low'
      });
    }

    return alerts;
  };

  const handleApprove = async (depositId: string) => {
    const deposit = deposits.find(d => d.id === depositId);
    if (!deposit) return;

    const alerts = getSecurityAlerts(deposit);
    const hasHighRisk = alerts.some(a => a.severity === 'high');
    
    let confirmMessage = 'Approve this deposit? This will add funds to user wallet.';
    if (hasHighRisk) {
      confirmMessage = `⚠️ HIGH RISK ALERT!\n\n${alerts.map(a => `- ${a.message}`).join('\n')}\n\nAre you SURE you want to approve?`;
    } else if (alerts.length > 0) {
      confirmMessage = `⚠️ Warning:\n${alerts.map(a => `- ${a.message}`).join('\n')}\n\nProceed with approval?`;
    }

    if (!confirm(confirmMessage)) return;

    // For high-risk transactions, ask for admin note
    let adminNote = 'Approved';
    if (hasHighRisk) {
      const note = prompt('HIGH RISK: Please provide verification details:');
      if (!note || note.trim().length < 10) {
        alert('Detailed verification note required for high-risk approvals');
        return;
      }
      adminNote = note;
    }

    setProcessing(depositId);
    try {
      const token = localStorage.getItem('token');
      const API_URL = typeof window !== 'undefined' 
        ? `http://${window.location.hostname}:8080`
        : 'http://localhost:8080';

      const response = await fetch(`${API_URL}/api/admin/deposits/approve?id=${depositId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ admin_note: adminNote }),
      });

      if (!response.ok) throw new Error('Failed to approve deposit');

      alert('Deposit approved successfully');
      fetchDeposits();
    } catch (error) {
      console.error('Error approving deposit:', error);
      alert('Failed to approve deposit');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (depositId: string) => {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;

    setProcessing(depositId);
    try {
      const token = localStorage.getItem('token');
      const API_URL = typeof window !== 'undefined' 
        ? `http://${window.location.hostname}:8080`
        : 'http://localhost:8080';

      const response = await fetch(`${API_URL}/api/admin/deposits/reject?id=${depositId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ admin_note: reason }),
      });

      if (!response.ok) throw new Error('Failed to reject deposit');

      alert('Deposit rejected');
      fetchDeposits();
    } catch (error) {
      console.error('Error rejecting deposit:', error);
      alert('Failed to reject deposit');
    } finally {
      setProcessing(null);
    }
  };

  // Smart filtering algorithm
  const filteredDeposits = deposits
    .filter(d => {
      // Status filter
      if (filter !== 'all' && d.status !== filter) return false;
      
      // Search filter (transaction ID, amount, user ID)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTxn = d.transaction_id.toLowerCase().includes(query);
        const matchesAmount = d.amount.toString().includes(query);
        const matchesUserId = d.user_id.toLowerCase().includes(query);
        if (!matchesTxn && !matchesAmount && !matchesUserId) return false;
      }
      
      // Amount range filter
      if (minAmount && d.amount < parseFloat(minAmount)) return false;
      if (maxAmount && d.amount > parseFloat(maxAmount)) return false;
      
      // Payment method filter
      if (selectedMethod !== 'all' && d.payment_method !== selectedMethod) return false;
      
      return true;
    })
    .sort((a, b) => {
      // Sort by selected criteria
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortBy === 'amount') {
        comparison = a.amount - b.amount;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const pendingCount = deposits.filter(d => d.status === 'pending').length;
  const approvedCount = deposits.filter(d => d.status === 'approved').length;
  const rejectedCount = deposits.filter(d => d.status === 'rejected').length;
  const totalAmount = deposits.filter(d => d.status === 'approved').reduce((sum, d) => sum + d.amount, 0);
  const pendingAmount = deposits.filter(d => d.status === 'pending').reduce((sum, d) => sum + d.amount, 0);

  // Get unique payment methods
  const paymentMethods = Array.from(new Set(deposits.map(d => d.payment_method)));

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">💰 Deposit Management</h1>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-600 text-sm">Total Requests</div>
          <div className="text-2xl font-bold">{deposits.length}</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <div className="text-yellow-700 text-sm">⏳ Pending</div>
          <div className="text-2xl font-bold text-yellow-800">{pendingCount}</div>
          <div className="text-xs text-yellow-600 mt-1">{pendingAmount.toLocaleString()} Birr</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="text-green-700 text-sm">✓ Approved</div>
          <div className="text-2xl font-bold text-green-800">{approvedCount}</div>
          <div className="text-xs text-green-600 mt-1">{totalAmount.toLocaleString()} Birr</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg shadow border-l-4 border-red-500">
          <div className="text-red-700 text-sm">✗ Rejected</div>
          <div className="text-2xl font-bold text-red-800">{rejectedCount}</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="text-blue-700 text-sm">📊 Filtered</div>
          <div className="text-2xl font-bold text-blue-800">{filteredDeposits.length}</div>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="font-semibold mb-3">🔍 Advanced Filters</h3>
        
        {/* Search Bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by transaction ID, amount, or user ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Amount Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Amount</label>
            <input
              type="number"
              placeholder="Min"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Amount</label>
            <input
              type="number"
              placeholder="Max"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          {/* Payment Method Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="all">All Methods</option>
              {paymentMethods.map(method => (
                <option key={method} value={method}>{method.toUpperCase()}</option>
              ))}
            </select>
          </div>

          {/* Sort Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'amount')}
                className="flex-1 px-3 py-2 border rounded-lg"
              >
                <option value="date">Date</option>
                <option value="amount">Amount</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>

        {/* Clear Filters */}
        {(searchQuery || minAmount || maxAmount || selectedMethod !== 'all') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setMinAmount('');
              setMaxAmount('');
              setSelectedMethod('all');
            }}
            className="mt-3 text-sm text-blue-600 hover:underline"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium ${
            filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          All ({deposits.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium ${
            filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          ⏳ Pending ({pendingCount})
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium ${
            filter === 'approved' ? 'bg-green-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          ✓ Approved ({approvedCount})
        </button>
        <button
          onClick={() => setFilter('rejected')}
          className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium ${
            filter === 'rejected' ? 'bg-red-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          ✗ Rejected ({rejectedCount})
        </button>
      </div>

      {/* Deposits List */}
      <div className="space-y-4">
        {filteredDeposits.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
            {searchQuery || minAmount || maxAmount || selectedMethod !== 'all' 
              ? '🔍 No deposits match your filters' 
              : `No ${filter !== 'all' ? filter : ''} deposits found`}
          </div>
        ) : (
          filteredDeposits.map((deposit) => {
            const alerts = getSecurityAlerts(deposit);
            const hasHighRisk = alerts.some(a => a.severity === 'high');
            const hasMediumRisk = alerts.some(a => a.severity === 'medium');
            
            return (
              <div
                key={deposit.id}
                className={`bg-white p-4 md:p-6 rounded-lg shadow hover:shadow-lg transition-shadow ${
                  hasHighRisk ? 'border-l-4 border-red-500' : 
                  hasMediumRisk ? 'border-l-4 border-yellow-500' : ''
                }`}
              >
                {/* Security Alerts */}
                {alerts.length > 0 && (
                  <div className={`mb-4 p-3 rounded-lg ${
                    hasHighRisk ? 'bg-red-50 border border-red-200' :
                    hasMediumRisk ? 'bg-yellow-50 border border-yellow-200' :
                    'bg-blue-50 border border-blue-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">
                        {hasHighRisk ? '🚨' : hasMediumRisk ? '⚠️' : 'ℹ️'}
                      </span>
                      <span className={`font-semibold ${
                        hasHighRisk ? 'text-red-700' :
                        hasMediumRisk ? 'text-yellow-700' :
                        'text-blue-700'
                      }`}>
                        {hasHighRisk ? 'HIGH RISK ALERT' : hasMediumRisk ? 'WARNING' : 'Notice'}
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {alerts.map((alert, idx) => (
                        <li key={idx} className={`text-sm ${
                          hasHighRisk ? 'text-red-600' :
                          hasMediumRisk ? 'text-yellow-600' :
                          'text-blue-600'
                        }`}>
                          • {alert.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          deposit.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : deposit.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {deposit.status.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(deposit.created_at).toLocaleString()}
                      </span>
                      {hasHighRisk && (
                        <span className="px-2 py-1 rounded text-xs font-bold bg-red-600 text-white">
                          HIGH RISK
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-semibold">Amount:</span>{' '}
                        <span className="text-lg font-bold text-green-600">
                          {deposit.amount.toLocaleString()} Birr
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold">Method:</span>{' '}
                        <span className="capitalize bg-gray-100 px-2 py-1 rounded">
                          {deposit.payment_method}
                        </span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="font-semibold">Transaction ID:</span>{' '}
                        <span className="font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          {deposit.transaction_id}
                        </span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="font-semibold">User ID:</span>{' '}
                        <span className="font-mono text-gray-600 text-xs">
                          {deposit.user_id}
                        </span>
                      </div>
                      {deposit.admin_note && (
                        <div className="md:col-span-2">
                          <span className="font-semibold">Admin Note:</span>{' '}
                          <span className="text-gray-600 italic">{deposit.admin_note}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {deposit.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(deposit.id)}
                        disabled={processing === deposit.id}
                        className={`px-4 py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${
                          hasHighRisk 
                            ? 'bg-orange-600 text-white hover:bg-orange-700' 
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {processing === deposit.id ? 'Processing...' : hasHighRisk ? '⚠️ Approve' : '✓ Approve'}
                      </button>
                      <button
                        onClick={() => handleReject(deposit.id)}
                        disabled={processing === deposit.id}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                      >
                        ✗ Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
