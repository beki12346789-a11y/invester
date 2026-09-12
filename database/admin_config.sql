-- Admin configuration table for payment details
CREATE TABLE IF NOT EXISTS admin_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id)
);

-- Insert default payment configurations
INSERT INTO admin_config (key, value, description) VALUES
    ('telebirr_phone', '0954381944', 'Telebirr phone number'),
    ('telebirr_name', 'ጤናው አክሊሉ', 'Telebirr account name'),
    ('cbe_account', '1000715798488', 'CBE account number'),
    ('cbe_name', 'Bereket Melese Mulugeta', 'CBE account holder name'),
    ('platform_name', 'Investment Trading Platform', 'Platform name'),
    ('platform_email', 'support@platform.com', 'Support email');

-- Create trigger for updated_at
CREATE TRIGGER update_admin_config_updated_at BEFORE UPDATE ON admin_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
