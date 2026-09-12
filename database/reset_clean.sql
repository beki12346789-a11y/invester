-- Clean Database - Keep only admin user
-- This script removes all data except admin user and reinserts fresh packages

-- Delete all data except admin user
DELETE FROM audit_logs WHERE user_id NOT IN (SELECT id FROM users WHERE role = 'admin');
DELETE FROM trading_profits;
DELETE FROM sales;
DELETE FROM purchases;
DELETE FROM products;
DELETE FROM deposits WHERE user_id NOT IN (SELECT id FROM users WHERE role = 'admin');
DELETE FROM withdrawals WHERE user_id NOT IN (SELECT id FROM users WHERE role = 'admin');
DELETE FROM transactions WHERE user_id NOT IN (SELECT id FROM users WHERE role = 'admin');
DELETE FROM investments WHERE user_id NOT IN (SELECT id FROM users WHERE role = 'admin');
DELETE FROM wallets WHERE user_id NOT IN (SELECT id FROM users WHERE role = 'admin');
DELETE FROM users WHERE role != 'admin';
DELETE FROM investment_packages;
DELETE FROM bank_accounts;

-- Insert fresh investment packages with high-quality images
INSERT INTO investment_packages (name, name_am, description, description_am, image_url, minimum_amount, target_percentage, duration_days, active) VALUES
(
  'Starter Package',
  'መጀመሪያ ፓኬጅ',
  'Perfect for beginners - Low risk, steady growth. Start your investment journey with confidence.',
  'ለጀማሪዎች ምቹ - ዝቅተኛ ስጋት፣ የተረጋጋ እድገት። የኢንቨስትመንት ጉዞዎን በአደራ ይጀምሩ።',
  'https://images.unsplash.com/photo-1579621970795-87facc2f976d?w=800&q=80',
  1000,
  10.0,
  30,
  true
),
(
  'Growth Package',
  'እድገት ፓኬጅ',
  'Balanced investment with moderate returns. Ideal for building wealth steadily over time.',
  'የተመጣጠነ ኢንቨስትመንት በመካከለኛ ትርፍ። ሀብትን በጊዜ ሂደት ለመገንባት ተስማሚ።',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
  5000,
  15.0,
  60,
  true
),
(
  'Premium Package',
  'ፕሪሚየም ፓኬጅ',
  'Higher returns for experienced investors. Professionally managed with proven strategies.',
  'ለልምድ ላላቸው ኢንቨስተሮች ከፍተኛ ትርፍ። በሙያዊ መንገድ በተረጋገጡ ስልቶች የሚተዳደር።',
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
  10000,
  20.0,
  90,
  true
),
(
  'Elite Package',
  'ኤሊት ፓኬጅ',
  'Premium investment opportunity with maximum returns and managed risk. For serious investors.',
  'ከፍተኛ ትርፍ እና የተቆጣጠረ ስጋት ያለው ፕሪሚየም ኢንቨስትመንት እድል። ለከባድ ኢንቨስተሮች።',
  'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=800&q=80',
  25000,
  25.0,
  120,
  true
),
(
  'Professional Package',
  'ሙያዊ ፓኬጅ',
  'Advanced investment strategy with expert management. Designed for portfolio diversification.',
  'በባለሙያ አስተዳደር የላቀ የኢንቨስትመንት ስትራቴጂ። ለፖርትፎሊዮ ልዩነት የተነደፈ።',
  'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&q=80',
  50000,
  30.0,
  180,
  true
),
(
  'Diamond Package',
  'አልማዝ ፓኬጅ',
  'Ultimate investment tier for high net worth individuals. Maximum returns with VIP management.',
  'ለከፍተኛ ሀብት ባለቤቶች የመጨረሻው የኢንቨስትመንት ደረጃ። ከፍተኛ ትርፍ ከቪአይፒ አስተዳደር ጋር።',
  'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&q=80',
  100000,
  35.0,
  365,
  true
),
(
  'Quick Return Package',
  'ፈጣን ትርፍ ፓኬጅ',
  'Short-term investment with quick returns. Perfect for liquid capital deployment.',
  'በፈጣን ትርፍ የአጭር ጊዜ ኢንቨስትመንት። ለፈሳሽ ካፒታል መዘርጋት ምቹ።',
  'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&q=80',
  2000,
  8.0,
  15,
  true
),
(
  'Long Term Wealth Package',
  'የረጅም ጊዜ ሀብት ፓኬጅ',
  'Build lasting wealth with this extended duration package. Compound growth strategy.',
  'በዚህ የተዘረጋ ጊዜ ፓኬጅ ዘላቂ ሀብት ይገንቡ። ውህደት እድገት ስትራቴጂ።',
  'https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?w=800&q=80',
  75000,
  40.0,
  540,
  true
),
(
  'Beginner Safe Package',
  'ጀማሪ ደህንነታማ ፓኬጅ',
  'Ultra-safe investment for first-time investors. Guaranteed principal protection.',
  'ለመጀመሪያ ጊዜ ለሚኢንቨስት አድራጊዎች እጅግ ደህንነታማ። ዋናው ካፒታል የተጠበቀ።',
  'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80',
  500,
  5.0,
  20,
  true
),
(
  'Golden Opportunity Package',
  'ወርቃማ እድል ፓኬጅ',
  'Exclusive limited-time opportunity with exceptional returns. Premium tier benefits included.',
  'ልዩ የተገደበ ጊዜ እድል ልዩ ትርፍ ጋር። የፕሪሚየም ደረጃ ጥቅሞች ተካተዋል።',
  'https://images.unsplash.com/photo-1621981386829-9b458a2cddde?w=800&q=80',
  150000,
  45.0,
  730,
  true
);

-- Insert bank accounts for deposits
INSERT INTO bank_accounts (account_type, account_name, account_number, bank_name, is_active, instructions) VALUES
(
  'telebirr',
  'Investment Platform',
  '0912345678',
  'Telebirr',
  true,
  '1. Open Telebirr app\n2. Send money to 0912345678\n3. Enter your transaction ID below\n4. Wait for admin approval (5-30 minutes)'
),
(
  'cbe',
  'Investment Trading PLC',
  '1000123456789',
  'Commercial Bank of Ethiopia',
  true,
  '1. Transfer to CBE Account: 1000123456789\n2. Account Name: Investment Trading PLC\n3. Keep your transaction receipt\n4. Enter transaction reference number below\n5. Admin will verify and approve'
);

-- Success message
SELECT 
  (SELECT COUNT(*) FROM users WHERE role = 'admin') as admin_users,
  (SELECT COUNT(*) FROM users WHERE role = 'user') as regular_users,
  (SELECT COUNT(*) FROM investment_packages) as packages,
  (SELECT COUNT(*) FROM bank_accounts) as bank_accounts;
