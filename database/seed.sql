-- Seed data for Investment Trading Platform

-- Insert default investment packages
INSERT INTO investment_packages (name, name_am, description, description_am, image_url, minimum_amount, target_percentage, duration_days, active) VALUES
    ('Starter Package', 'መጀመሪያ ፓኬጅ', 'Perfect for beginners starting their investment journey', 'ለኢንቬስትመንት ጉዞ የሚጀምሩ ጀማሪዎች ምርጥ', 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400', 500.00, 10.00, 90, true),
    ('Basic Package', 'መሰረታዊ ፓኬጅ', 'Build your portfolio with steady returns', 'ቋሚ ትርፍ ያለው ፖርትፎሊዮ ይገንቡ', 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400', 1000.00, 15.00, 90, true),
    ('Silver Package', 'ብር ፓኬጅ', 'Enhanced returns for growing investors', 'ለማደግ ላሉ ኢንቬስተሮች የተሻሻለ ትርፍ', 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400', 1500.00, 17.00, 90, true),
    ('Gold Package', 'ወርቅ ፓኬጅ', 'Premium investment with attractive returns', 'ማራኪ ትርፍ ያለው ፕሪሚየም ኢንቬስትመንት', 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=400', 5000.00, 20.00, 90, true),
    ('Platinum Package', 'ፕላቲነም ፓኬጅ', 'Elite investment tier with maximum returns', 'ከፍተኛ ትርፍ ያለው የልሂቃን ደረጃ', 'https://images.unsplash.com/photo-1559589689-577aabd1db4f?w=400', 10000.00, 25.00, 90, true),
    ('Diamond Package', 'አልማዝ ፓኬጅ', 'Ultimate investment experience for serious investors', 'ለቁርጥ ኢንቬስተሮች የመጨረሻ ትርፍ', 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=400', 25000.00, 30.00, 90, true);

-- Insert sample product
INSERT INTO products (name, sku, category) VALUES
    ('Electric Stove', 'ESTOVE-001', 'Kitchen Appliances');

-- Insert default admin configurations
INSERT INTO admin_config (key, value, description) VALUES
    ('telebirr_phone', '0954381944', 'Telebirr phone number'),
    ('telebirr_name', 'ጤናው አክሊሉ', 'Telebirr account name'),
    ('cbe_account', '1000715798488', 'CBE account number'),
    ('cbe_name', 'Bereket Melese Mulugeta', 'CBE account holder name'),
    ('platform_name', 'Investment Trading Platform', 'Platform name'),
    ('support_phone', '0954381944', 'Support phone number');

-- Note: Admin user will be created via environment variables during app initialization

-- Insert bank accounts for deposits
INSERT INTO bank_accounts (account_type, account_name, account_number, bank_name, is_active, instructions) VALUES
('telebirr', 'Investment Platform', '0912345678', 'Telebirr', true, 'Send money to this Telebirr number and enter your transaction ID'),
('cbe', 'Investment Trading PLC', '1000123456789', 'Commercial Bank of Ethiopia', true, 'Transfer to this CBE account and provide transaction reference number');
