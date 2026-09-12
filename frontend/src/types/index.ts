export interface User {
  id: string;
  phone_number: string;
  full_name: string;
  role: 'user' | 'admin';
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  total_deposited: number;
  total_invested: number;
  total_withdrawn: number;
  created_at: string;
  updated_at: string;
}

export interface InvestmentPackage {
  id: string;
  name: string;
  name_am: string;
  description: string;
  description_am: string;
  image_url: string;
  minimum_amount: number;
  target_percentage: number;
  duration_days: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Investment {
  id: string;
  user_id: string;
  package_id: string;
  amount: number;
  target_percentage: number;
  target_return: number;
  actual_profit_loss: number;
  status: 'active' | 'completed' | 'cancelled';
  start_date: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
  package_name?: string;
}

export interface Transaction {
  id: string;
  user_id?: string;
  type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  reference_id?: string;
  description: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  current_quantity: number;
  total_purchased: number;
  total_sold: number;
  average_cost: number;
  created_at: string;
  updated_at: string;
}

export interface Purchase {
  id: string;
  product_id: string;
  supplier: string;
  country: string;
  quantity: number;
  price_per_unit: number;
  purchase_amount: number;
  shipping_cost: number;
  customs_cost: number;
  other_expenses: number;
  total_cost: number;
  purchase_date: string;
  notes: string;
  created_at: string;
  updated_at: string;
  product_name?: string;
  product_sku?: string;
}

export interface Sale {
  id: string;
  product_id: string;
  buyer: string;
  country: string;
  quantity: number;
  price_per_unit: number;
  revenue: number;
  selling_expenses: number;
  cost_of_goods: number;
  gross_profit: number;
  sale_date: string;
  notes: string;
  created_at: string;
  updated_at: string;
  product_name?: string;
  product_sku?: string;
}

export interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  withdrawal_method: string;
  account_details: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  admin_notes: string;
  requested_at: string;
  processed_at?: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_phone?: string;
}

export interface DashboardStats {
  total_users: number;
  total_deposits: number;
  total_investments: number;
  trading_capital: number;
  inventory_value: number;
  total_sales: number;
  trading_profit: number;
  pending_withdrawals: number;
  pending_withdrawal_count: number;
}

export interface TodayActivity {
  new_users: number;
  deposits: number;
  investments: number;
  investment_count: number;
  product_purchases: number;
  purchase_count: number;
  product_sales: number;
  sale_count: number;
  trading_profit: number;
  withdrawal_requests: number;
  withdrawal_request_count: number;
  completed_withdrawals: number;
  completed_withdrawal_count: number;
}
