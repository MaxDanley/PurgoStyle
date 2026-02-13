-- Purgo Style: full Prisma schema as SQL for an empty Supabase DB.
-- Run once in Supabase Dashboard → SQL Editor → New query → paste & Run.
-- Generated with: npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script
--
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CRYPTO', 'ZELLE', 'VENMO', 'BARTERPAY', 'EDEBIT', 'CREDIT_CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "PointsType" AS ENUM ('EARNED', 'REDEEMED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PSEOPageType" AS ENUM ('COMPARISON', 'PEPTIDE');

-- CreateEnum
CREATE TYPE "SubscriberSource" AS ENUM ('DISCOUNT_SIGNUP', 'CHECKOUT_OPT_IN', 'USER_ACCOUNT', 'STOCK_NOTIFICATION', 'MANUAL_IMPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "SubscriberStatus" AS ENUM ('ACTIVE', 'UNSUBSCRIBED', 'BOUNCED', 'COMPLAINED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "phone" TEXT,
    "smsOptIn" BOOLEAN NOT NULL DEFAULT false,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "rewardsPoints" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "coaUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductReview" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "userId" TEXT,
    "authorName" TEXT NOT NULL,
    "authorEmail" TEXT,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "sizePurchased" TEXT,
    "verifiedBuyer" BOOLEAN NOT NULL DEFAULT false,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "notHelpfulCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "stockCount" INTEGER NOT NULL DEFAULT 0,
    "sku" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "apartment" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'US',
    "phone" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT,
    "orderNumber" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "subtotal" DOUBLE PRECISION NOT NULL,
    "shippingInsurance" DOUBLE PRECISION NOT NULL DEFAULT 3.50,
    "shippingCost" DOUBLE PRECISION NOT NULL,
    "shippingMethod" TEXT NOT NULL DEFAULT 'ground',
    "total" DOUBLE PRECISION NOT NULL,
    "pointsEarned" INTEGER NOT NULL DEFAULT 0,
    "pointsRedeemed" INTEGER NOT NULL DEFAULT 0,
    "shippingAddressId" TEXT,
    "phone" TEXT,
    "trackingNumber" TEXT,
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'OTHER',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "cryptoPaymentId" TEXT,
    "cryptoPaymentAddress" TEXT,
    "cryptoPaymentAmount" DOUBLE PRECISION,
    "cryptoCurrency" TEXT,
    "cryptoPaymentExpiresAt" TIMESTAMP(3),
    "cryptoPaymentStatus" TEXT,
    "barterPayTransactionIndex" TEXT,
    "greenPayorId" TEXT,
    "greenTransactionId" TEXT,
    "greenCheckNumber" TEXT,
    "greenVerificationType" TEXT,
    "discountCodeId" TEXT,
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "affiliateId" TEXT,
    "attributionSource" TEXT,
    "attributionMedium" TEXT,
    "attributionCampaign" TEXT,
    "attributionContent" TEXT,
    "attributionTerm" TEXT,
    "initialReferrer" TEXT,
    "paymentReminderSentAt" TIMESTAMP(3),
    "paymentReminderImSentAt" TIMESTAMP(3),
    "smsOptIn" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "isBackorder" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderStatusHistory" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscountCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "discountType" "DiscountType" NOT NULL DEFAULT 'PERCENTAGE',
    "discountAmount" DOUBLE PRECISION NOT NULL,
    "minOrderAmount" DOUBLE PRECISION,
    "maxDiscount" DOUBLE PRECISION,
    "freeShipping" BOOLEAN NOT NULL DEFAULT false,
    "usageLimit" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscountCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointsHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT,
    "points" INTEGER NOT NULL,
    "type" "PointsType" NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointsHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "keywords" TEXT[],
    "metaDescription" TEXT NOT NULL,
    "featuredImage" TEXT,
    "articleImages" TEXT[],
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PSEOPage" (
    "id" TEXT NOT NULL,
    "type" "PSEOPageType" NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "keywords" TEXT[],
    "metaDescription" TEXT NOT NULL,
    "featuredImage" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PSEOPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailPreferences" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "promotions" BOOLEAN NOT NULL DEFAULT true,
    "newsletters" BOOLEAN NOT NULL DEFAULT true,
    "research" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "source" "SubscriberSource" NOT NULL,
    "status" "SubscriberStatus" NOT NULL DEFAULT 'ACTIVE',
    "resendContactId" TEXT,
    "resendAudienceId" TEXT,
    "promotions" BOOLEAN NOT NULL DEFAULT true,
    "newsletters" BOOLEAN NOT NULL DEFAULT true,
    "research" BOOLEAN NOT NULL DEFAULT true,
    "firstName" TEXT,
    "lastName" TEXT,
    "userId" TEXT,
    "discountCodeId" TEXT,
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unsubscribedAt" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3),
    "retargetingEmailSent" BOOLEAN NOT NULL DEFAULT false,
    "retargetingEmailSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockNotification" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbandonedCart" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "cartData" TEXT NOT NULL,
    "reminderSent" INTEGER NOT NULL DEFAULT 0,
    "converted" BOOLEAN NOT NULL DEFAULT false,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastReminderSentAt" TIMESTAMP(3),

    CONSTRAINT "AbandonedCart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PendingBarterPayOrder" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "transactionIndex" TEXT NOT NULL,
    "userId" TEXT,
    "items" JSONB NOT NULL,
    "shippingInfo" JSONB NOT NULL,
    "billingInfo" JSONB,
    "metadata" JSONB NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "shippingInsurance" DOUBLE PRECISION NOT NULL DEFAULT 3.50,
    "shippingCost" DOUBLE PRECISION NOT NULL,
    "pointsEarned" INTEGER NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PendingBarterPayOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Affiliate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "discountCode" TEXT NOT NULL,
    "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "discountPercentage" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "freeShipping" BOOLEAN NOT NULL DEFAULT true,
    "usageLimit" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "minOrderAmount" DOUBLE PRECISION,
    "totalSales" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "totalCommission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pendingCommission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Affiliate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateCommission" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "tier" INTEGER NOT NULL,
    "commissionRate" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliateCommission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliatePayoutRequest" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliatePayoutRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateClick" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'qr',
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "isUnique" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliateClick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateInvite" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliateInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageView" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "pagePath" TEXT NOT NULL,
    "referrer" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "email" TEXT,
    "eventType" TEXT NOT NULL,
    "productId" TEXT,
    "variantId" TEXT,
    "quantity" INTEGER,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CartEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckoutEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "email" TEXT,
    "step" TEXT NOT NULL,
    "cartValue" DOUBLE PRECISION,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckoutEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlooioCampaignSent" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlooioCampaignSent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "ProductReview_productId_idx" ON "ProductReview"("productId");

-- CreateIndex
CREATE INDEX "ProductReview_createdAt_idx" ON "ProductReview"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- CreateIndex
CREATE INDEX "Order_orderNumber_idx" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_cryptoPaymentId_idx" ON "Order"("cryptoPaymentId");

-- CreateIndex
CREATE INDEX "Order_barterPayTransactionIndex_idx" ON "Order"("barterPayTransactionIndex");

-- CreateIndex
CREATE INDEX "Order_greenPayorId_idx" ON "Order"("greenPayorId");

-- CreateIndex
CREATE INDEX "Order_greenTransactionId_idx" ON "Order"("greenTransactionId");

-- CreateIndex
CREATE INDEX "Order_paymentStatus_paymentMethod_idx" ON "Order"("paymentStatus", "paymentMethod");

-- CreateIndex
CREATE INDEX "Order_createdAt_paymentStatus_idx" ON "Order"("createdAt", "paymentStatus");

-- CreateIndex
CREATE INDEX "Order_affiliateId_idx" ON "Order"("affiliateId");

-- CreateIndex
CREATE UNIQUE INDEX "DiscountCode_code_key" ON "DiscountCode"("code");

-- CreateIndex
CREATE INDEX "PointsHistory_userId_idx" ON "PointsHistory"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");

-- CreateIndex
CREATE INDEX "BlogPost_slug_idx" ON "BlogPost"("slug");

-- CreateIndex
CREATE INDEX "BlogPost_published_publishedAt_idx" ON "BlogPost"("published", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PSEOPage_slug_key" ON "PSEOPage"("slug");

-- CreateIndex
CREATE INDEX "PSEOPage_type_slug_idx" ON "PSEOPage"("type", "slug");

-- CreateIndex
CREATE INDEX "PSEOPage_published_publishedAt_idx" ON "PSEOPage"("published", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailPreferences_email_key" ON "EmailPreferences"("email");

-- CreateIndex
CREATE INDEX "EmailPreferences_email_idx" ON "EmailPreferences"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Subscriber_email_key" ON "Subscriber"("email");

-- CreateIndex
CREATE INDEX "Subscriber_email_idx" ON "Subscriber"("email");

-- CreateIndex
CREATE INDEX "Subscriber_status_idx" ON "Subscriber"("status");

-- CreateIndex
CREATE INDEX "Subscriber_source_idx" ON "Subscriber"("source");

-- CreateIndex
CREATE INDEX "Subscriber_resendContactId_idx" ON "Subscriber"("resendContactId");

-- CreateIndex
CREATE INDEX "Subscriber_userId_idx" ON "Subscriber"("userId");

-- CreateIndex
CREATE INDEX "StockNotification_variantId_idx" ON "StockNotification"("variantId");

-- CreateIndex
CREATE INDEX "StockNotification_userId_idx" ON "StockNotification"("userId");

-- CreateIndex
CREATE INDEX "StockNotification_email_idx" ON "StockNotification"("email");

-- CreateIndex
CREATE INDEX "AbandonedCart_userId_idx" ON "AbandonedCart"("userId");

-- CreateIndex
CREATE INDEX "AbandonedCart_email_idx" ON "AbandonedCart"("email");

-- CreateIndex
CREATE INDEX "AbandonedCart_converted_idx" ON "AbandonedCart"("converted");

-- CreateIndex
CREATE INDEX "AbandonedCart_createdAt_idx" ON "AbandonedCart"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PendingBarterPayOrder_orderNumber_key" ON "PendingBarterPayOrder"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PendingBarterPayOrder_transactionIndex_key" ON "PendingBarterPayOrder"("transactionIndex");

-- CreateIndex
CREATE INDEX "PendingBarterPayOrder_transactionIndex_idx" ON "PendingBarterPayOrder"("transactionIndex");

-- CreateIndex
CREATE INDEX "PendingBarterPayOrder_orderNumber_idx" ON "PendingBarterPayOrder"("orderNumber");

-- CreateIndex
CREATE INDEX "PendingBarterPayOrder_createdAt_idx" ON "PendingBarterPayOrder"("createdAt");

-- CreateIndex
CREATE INDEX "PendingBarterPayOrder_expiresAt_idx" ON "PendingBarterPayOrder"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Affiliate_userId_key" ON "Affiliate"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Affiliate_discountCode_key" ON "Affiliate"("discountCode");

-- CreateIndex
CREATE INDEX "Affiliate_discountCode_idx" ON "Affiliate"("discountCode");

-- CreateIndex
CREATE INDEX "Affiliate_userId_idx" ON "Affiliate"("userId");

-- CreateIndex
CREATE INDEX "AffiliateCommission_affiliateId_idx" ON "AffiliateCommission"("affiliateId");

-- CreateIndex
CREATE INDEX "AffiliateCommission_orderId_idx" ON "AffiliateCommission"("orderId");

-- CreateIndex
CREATE INDEX "AffiliatePayoutRequest_affiliateId_idx" ON "AffiliatePayoutRequest"("affiliateId");

-- CreateIndex
CREATE INDEX "AffiliatePayoutRequest_status_idx" ON "AffiliatePayoutRequest"("status");

-- CreateIndex
CREATE INDEX "AffiliateClick_affiliateId_idx" ON "AffiliateClick"("affiliateId");

-- CreateIndex
CREATE INDEX "AffiliateClick_createdAt_idx" ON "AffiliateClick"("createdAt");

-- CreateIndex
CREATE INDEX "AffiliateClick_ipAddress_idx" ON "AffiliateClick"("ipAddress");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateInvite_token_key" ON "AffiliateInvite"("token");

-- CreateIndex
CREATE INDEX "AffiliateInvite_token_idx" ON "AffiliateInvite"("token");

-- CreateIndex
CREATE INDEX "AffiliateInvite_email_idx" ON "AffiliateInvite"("email");

-- CreateIndex
CREATE INDEX "PageView_sessionId_idx" ON "PageView"("sessionId");

-- CreateIndex
CREATE INDEX "PageView_createdAt_idx" ON "PageView"("createdAt");

-- CreateIndex
CREATE INDEX "PageView_pagePath_idx" ON "PageView"("pagePath");

-- CreateIndex
CREATE INDEX "CartEvent_sessionId_idx" ON "CartEvent"("sessionId");

-- CreateIndex
CREATE INDEX "CartEvent_email_idx" ON "CartEvent"("email");

-- CreateIndex
CREATE INDEX "CartEvent_createdAt_idx" ON "CartEvent"("createdAt");

-- CreateIndex
CREATE INDEX "CheckoutEvent_sessionId_idx" ON "CheckoutEvent"("sessionId");

-- CreateIndex
CREATE INDEX "CheckoutEvent_email_idx" ON "CheckoutEvent"("email");

-- CreateIndex
CREATE INDEX "CheckoutEvent_step_idx" ON "CheckoutEvent"("step");

-- CreateIndex
CREATE INDEX "CheckoutEvent_createdAt_idx" ON "CheckoutEvent"("createdAt");

-- CreateIndex
CREATE INDEX "BlooioCampaignSent_sentAt_idx" ON "BlooioCampaignSent"("sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "BlooioCampaignSent_phone_key" ON "BlooioCampaignSent"("phone");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductReview" ADD CONSTRAINT "ProductReview_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_shippingAddressId_fkey" FOREIGN KEY ("shippingAddressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_discountCodeId_fkey" FOREIGN KEY ("discountCodeId") REFERENCES "DiscountCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsHistory" ADD CONSTRAINT "PointsHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsHistory" ADD CONSTRAINT "PointsHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscriber" ADD CONSTRAINT "Subscriber_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscriber" ADD CONSTRAINT "Subscriber_discountCodeId_fkey" FOREIGN KEY ("discountCodeId") REFERENCES "DiscountCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockNotification" ADD CONSTRAINT "StockNotification_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockNotification" ADD CONSTRAINT "StockNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbandonedCart" ADD CONSTRAINT "AbandonedCart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Affiliate" ADD CONSTRAINT "Affiliate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateCommission" ADD CONSTRAINT "AffiliateCommission_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliatePayoutRequest" ADD CONSTRAINT "AffiliatePayoutRequest_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateClick" ADD CONSTRAINT "AffiliateClick_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

