-- ==============================================================================
-- EMARKafe Supabase Database Hardening & Optimization Patch
-- Version: 1.0.0
-- Purpose: 
--   1. Fixes data privacy leaks on `profiles` table.
--   2. Prevents duplicate active carts via partial unique index.
--   3. Enforces 2 decimal precision (NUMERIC(10,2)) and non-negative constraints.
--   4. Eliminates duplicate product ratings per order.
--   5. Grants admins full visibility on `transactions`.
--   6. Creates high-performance B-Tree indexes on all Foreign Keys & filter columns.
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- 1. PROFILES GİZLİLİK VE GÜVENLİK YAMASI (Data Leak Fix)
-- ==============================================================================
-- Eski güvensiz "Users can read all profiles" politikasını kaldır
DROP POLICY IF EXISTS "Users can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Kullanıcılar sadece kendi profil bilgilerini (bakiye, telefon vb.) görebilir
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT 
  TO public
  USING (auth.uid() = id);

-- Adminler tüm profilleri görebilir
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT 
  TO public
  USING (get_user_role() = 'admin');

-- Halka açık güvenli profil görünümü (Bakiye ve telefon gizlenmiştir)
CREATE OR REPLACE VIEW public_profiles AS
  SELECT id, full_name, avatar_url, role, branch_id, created_at
  FROM profiles;

-- ==============================================================================
-- 2. CARTS TEKİL AKTİF SEPET KURALI (Partial Unique Index)
-- ==============================================================================
-- Bir kullanıcının aynı anda sadece 1 adet 'active' sepeti olabilir
CREATE UNIQUE INDEX IF NOT EXISTS uniq_user_active_cart 
  ON carts (user_id) 
  WHERE status = 'active';

-- ==============================================================================
-- 3. FİYAT VE BAKİYE HASSASİYETİ (Precision & Non-Negative Checks)
-- ==============================================================================
-- Products
ALTER TABLE products ALTER COLUMN base_price TYPE NUMERIC(10, 2);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_product_base_price_positive') THEN
    ALTER TABLE products ADD CONSTRAINT check_product_base_price_positive CHECK (base_price >= 0);
  END IF;
END $$;

-- Profiles balance
ALTER TABLE profiles ALTER COLUMN balance TYPE NUMERIC(12, 2);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_profile_balance_non_negative') THEN
    ALTER TABLE profiles ADD CONSTRAINT check_profile_balance_non_negative CHECK (balance >= 0);
  END IF;
END $$;

-- Orders
ALTER TABLE orders ALTER COLUMN total_price TYPE NUMERIC(10, 2);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_order_total_price_non_negative') THEN
    ALTER TABLE orders ADD CONSTRAINT check_order_total_price_non_negative CHECK (total_price >= 0);
  END IF;
END $$;

-- Cart items & Order items unit price
ALTER TABLE cart_items ALTER COLUMN unit_price TYPE NUMERIC(10, 2);
ALTER TABLE order_items ALTER COLUMN unit_price TYPE NUMERIC(10, 2);

-- Transactions amount
ALTER TABLE transactions ALTER COLUMN amount TYPE NUMERIC(12, 2);

-- Product option values price delta
ALTER TABLE product_option_values ALTER COLUMN price_delta TYPE NUMERIC(10, 2);

-- ==============================================================================
-- 4. PRODUCT RATINGS MÜKERRER PUANLAMA ENGELİ
-- ==============================================================================
-- Bir kullanıcı aynı siparişteki aynı ürünü sadece 1 kez puanlayabilir
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uniq_user_order_product_rating') THEN
    ALTER TABLE product_ratings
      ADD CONSTRAINT uniq_user_order_product_rating UNIQUE (user_id, order_id, product_id);
  END IF;
END $$;

-- ==============================================================================
-- 5. TRANSACTIONS TABLOSUNA ADMIN RLS KURALI
-- ==============================================================================
DROP POLICY IF EXISTS "Admins can do everything on transactions" ON transactions;

CREATE POLICY "Admins can do everything on transactions" ON transactions
  FOR ALL 
  TO public
  USING (get_user_role() = 'admin');

-- ==============================================================================
-- 6. PERFORMANS İNDEKSLERİ (B-Tree Foreign Key & Composite Indexes)
-- ==============================================================================
-- Orders & Order Items
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_branch_id ON orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Carts & Cart Items
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON carts(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);

-- Branch Products
CREATE INDEX IF NOT EXISTS idx_branch_products_lookup ON branch_products(branch_id, product_id);
CREATE INDEX IF NOT EXISTS idx_branch_products_is_available ON branch_products(branch_id, is_available);

-- Loyalty & Favorites
CREATE INDEX IF NOT EXISTS idx_loyalty_progress_user_cat ON loyalty_progress(user_id, category_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_user ON loyalty_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_product ON favorites(user_id, product_id);

-- Device Tokens & Transactions & Audit Logs
CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON device_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

COMMIT;
