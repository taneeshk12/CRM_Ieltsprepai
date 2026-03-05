-- Create admin users table with encrypted passwords
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  email text,
  full_name text,
  is_active boolean DEFAULT true,
  last_login timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT admin_users_pkey PRIMARY KEY (id)
);

-- Insert default admin user with hashed password
-- Default credentials: username: admin, password: adminielts123
-- Password hash for 'adminielts123' using bcrypt
-- Insert an admin user with plaintext credentials (insecure - for local/dev only)
-- Username: admin
-- Password: adminielts1234
INSERT INTO admin_users (username, password_hash, email, full_name)
VALUES (
  'admin',
  'adminielts1234',
  'admin@ieltsprepai.com',
  'System Administrator'
) ON CONFLICT (username) DO NOTHING;

-- Add index for faster username lookup
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_users_updated_at();
