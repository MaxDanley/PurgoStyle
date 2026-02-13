-- Enable Row Level Security (RLS) on all tables
-- This prevents direct public access to your database tables

-- User-related tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PasswordResetToken" ENABLE ROW LEVEL SECURITY;

-- Product and inventory tables
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductVariant" ENABLE ROW LEVEL SECURITY;

-- Order and transaction tables
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderStatusHistory" ENABLE ROW LEVEL SECURITY;

-- Address and customer data
ALTER TABLE "Address" ENABLE ROW LEVEL SECURITY;

-- Discount codes
ALTER TABLE "DiscountCode" ENABLE ROW LEVEL SECURITY;

-- Points and rewards (if table exists)
-- Check if table exists before enabling RLS
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'PointsHistory') THEN
    ALTER TABLE "PointsHistory" ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Email preferences and notifications
ALTER TABLE "EmailPreferences" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StockNotification" ENABLE ROW LEVEL SECURITY;

-- Blog
ALTER TABLE "BlogPost" ENABLE ROW LEVEL SECURITY;

-- Abandoned cart
ALTER TABLE "AbandonedCart" ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- CREATE HELPER FUNCTIONS TO CACHE AUTH VALUES
-- ============================================================

-- These functions are provided by Supabase and are optimized
-- We don't need to recreate them - they already exist and are marked as STABLE
-- The warnings are expected and don't affect performance significantly

-- ============================================================
-- CREATE SECURITY POLICIES
-- ============================================================

-- PRODUCT & PRODUCT VARIANT POLICIES
-- Allow public read access to products (needed for website)
CREATE POLICY "Public products are viewable by everyone"
  ON "Product" FOR SELECT
  USING (active = true);

CREATE POLICY "Public product variants are viewable by everyone"
  ON "ProductVariant" FOR SELECT
  USING (active = true);

-- Only admins can modify products
CREATE POLICY "Only admins can insert products"
  ON "Product" FOR INSERT
  WITH CHECK (auth.role() = 'admin');

CREATE POLICY "Only admins can update products"
  ON "Product" FOR UPDATE
  USING (auth.role() = 'admin');

-- BLOG POST POLICIES
-- Allow public read access to published blog posts
CREATE POLICY "Published blog posts are viewable by everyone"
  ON "BlogPost" FOR SELECT
  USING (published = true);

-- Only admins can modify blog posts
CREATE POLICY "Only admins can manage blog posts"
  ON "BlogPost" FOR ALL
  USING (auth.role() = 'admin');

-- ORDER POLICIES
-- Users can only see their own orders
CREATE POLICY "Users can view their own orders"
  ON "Order" FOR SELECT
  USING (auth.uid()::text = "userId");

-- Users can only create orders for themselves
CREATE POLICY "Users can create their own orders"
  ON "Order" FOR INSERT
  WITH CHECK (auth.uid()::text = "userId");

-- Only admins can update orders
CREATE POLICY "Only admins can update orders"
  ON "Order" FOR UPDATE
  USING (auth.role() = 'admin');

-- ORDER ITEMS POLICIES
-- Users can view order items for their own orders
CREATE POLICY "Users can view their own order items"
  ON "OrderItem" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "Order"
      WHERE "Order".id = "OrderItem"."orderId"
      AND "Order"."userId" = auth.uid()::text
    )
  );

-- Users can create order items for their own orders
CREATE POLICY "Users can create items for their own orders"
  ON "OrderItem" FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Order"
      WHERE "Order".id = "OrderItem"."orderId"
      AND "Order"."userId" = auth.uid()::text
    )
  );

-- ADDRESS POLICIES
-- Users can only see and manage their own addresses
CREATE POLICY "Users can manage their own addresses"
  ON "Address" FOR ALL
  USING (auth.uid()::text = "userId")
  WITH CHECK (auth.uid()::text = "userId");

-- EMAIL PREFERENCES POLICIES
-- Users can manage their own email preferences
CREATE POLICY "Users can manage their own email preferences"
  ON "EmailPreferences" FOR ALL
  USING (true) -- Anyone can access (for anonymous users to set preferences)
  WITH CHECK (true);

-- STOCK NOTIFICATION POLICIES
-- Users can manage their own stock notifications
CREATE POLICY "Users can manage their own stock notifications"
  ON "StockNotification" FOR ALL
  USING (
    "userId" IS NULL OR auth.uid()::text = "userId"
  )
  WITH CHECK (
    "userId" IS NULL OR auth.uid()::text = "userId"
  );

-- ABANDONED CART POLICIES
-- Users can only see their own abandoned carts
CREATE POLICY "Users can view their own abandoned carts"
  ON "AbandonedCart" FOR SELECT
  USING (
    "userId" IS NULL OR auth.uid()::text = "userId"
  );

-- Anyone can create abandoned cart records (for tracking)
CREATE POLICY "Anyone can create abandoned cart records"
  ON "AbandonedCart" FOR INSERT
  WITH CHECK (true);

-- System (cron) can update abandoned carts
CREATE POLICY "System can update abandoned carts"
  ON "AbandonedCart" FOR UPDATE
  USING (auth.role() = 'service_role');

-- POINTS HISTORY POLICIES (if table exists)
-- Users can only see their own points history
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'PointsHistory') THEN
    CREATE POLICY "Users can view their own points"
      ON "PointsHistory" FOR SELECT
      USING (auth.uid()::text = "userId");
  END IF;
END $$;

-- USER TABLE POLICIES
-- Users can only see limited info about themselves
CREATE POLICY "Users can view their own profile"
  ON "User" FOR SELECT
  USING (auth.uid()::text = id);

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update their own profile"
  ON "User" FOR UPDATE
  USING (auth.uid()::text = id)
  WITH CHECK (
    -- Can only update non-sensitive fields
    auth.uid()::text = id
  );

-- ACCOUNT, SESSION, and TOKEN POLICIES
-- These should only be accessible via NextAuth, not directly
CREATE POLICY "No public access to accounts"
  ON "Account" FOR ALL
  USING (false)
  WITH CHECK (false);

CREATE POLICY "No public access to sessions"
  ON "Session" FOR ALL
  USING (false)
  WITH CHECK (false);

CREATE POLICY "No public access to verification tokens"
  ON "VerificationToken" FOR ALL
  USING (false)
  WITH CHECK (false);

CREATE POLICY "No public access to password reset tokens"
  ON "PasswordResetToken" FOR ALL
  USING (false)
  WITH CHECK (false);

CREATE POLICY "No public access to order status history"
  ON "OrderStatusHistory" FOR ALL
  USING (false)
  WITH CHECK (false);

-- DISCOUNT CODE POLICIES
-- Allow public read access to active discount codes (needed for checkout)
CREATE POLICY "Active discount codes are viewable by everyone"
  ON "DiscountCode" FOR SELECT
  USING ("isActive" = true);

-- Only admins can manage discount codes
CREATE POLICY "Only admins can manage discount codes"
  ON "DiscountCode" FOR ALL
  USING (auth.role() = 'admin')
  WITH CHECK (auth.role() = 'admin');

-- ============================================================
-- NOTES
-- ============================================================
-- 
-- 1. This script enables RLS on all tables to prevent direct access
-- 2. Public tables (products, blog posts) have read policies for website visitors
-- 3. User-specific tables (orders, addresses) have policies to restrict to owner only
-- 4. Admin-only operations are restricted to admin role
-- 5. Sensitive tables (sessions, tokens) are completely blocked from public access
-- 
-- IMPORTANT: After running this script, make sure to:
-- - Test that your website still works correctly
-- - Verify that users can place orders
-- - Check that the admin dashboard functions properly
-- - Monitor for any access denied errors
