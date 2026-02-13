# Purgo Style Labs

Arizona activewear and premium tees. Built with Next.js.

## Environment variables

Copy `.env.example` to `.env.local` and fill in the values below.

### Required

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (e.g. Supabase) |
| `NEXTAUTH_SECRET` | Secret for NextAuth.js sessions (generate a random string) |
| `NEXTAUTH_URL` | App URL (e.g. `http://localhost:3000` in dev, production URL in prod) |
| `RESEND_API_KEY` | Resend API key for transactional email |
| `EMAIL_FROM` | From address for emails (e.g. `noreply@purgostyle.com`) |
| `SUPPORT_EMAIL` | Support contact (e.g. `support@purgostyle.com`) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID (for sign-in) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |

### Site URL

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_BASE_URL` | Public site URL (e.g. `https://www.purgostyle.com`) |
| `NEXT_PUBLIC_SITE_URL` | Same as base URL; used for auth reset link |

### Optional – analytics & marketing

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_GA_ID` | Google Analytics measurement ID |
| `NEXT_PUBLIC_FB_PIXEL_ID` | Facebook Pixel ID |
| `OMNISEND_API_KEY` | Omnisend API key for marketing emails |
| `RESEND_AUDIENCE_ID` | Resend audience ID for mailing list |
| `RESEND_SEGMENT_IDS` | Comma-separated Resend segment IDs |

### Optional – payments & orders

| Variable | Description |
|----------|-------------|
| `BARTERPAY_API_KEY` | BarterPay API key |
| `BARTERPAY_API_URL` | BarterPay API base URL (default: test API) |
| `NOWPAYMENTS_API_KEY` | NOWPayments API key for crypto |
| `GREEN_API_URL` | Green (eCheck) API URL |
| `GREEN_CLIENT_ID` or `GREEN_MID` | Green merchant ID |
| `GREEN_API_PASSWORD` | Green API password |

### Optional – shipping & tracking

| Variable | Description |
|----------|-------------|
| `USPS_API_ENV` | USPS API environment (e.g. `tem` for test) |
| `USPS_CONSUMER_KEY` | USPS API consumer key |
| `USPS_CONSUMER_SECRET` | USPS API consumer secret |

### Optional – content & assets

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Anthropic API key (for PSEO/blog generation) |
| `HUGGINGFACE_API_KEY` | Hugging Face API key (optional; for AI images) |
| `UNSPLASH_ACCESS_KEY` | Unsplash API key (for blog images) |
| `BLOB_READ_WRITE_TOKEN_READ_WRITE_TOKEN` | Vercel Blob token for COA/file storage |
| `BLOOIO_API_KEY` or `BLOOIO_KEY` | Blooio API key (if used) |

### Optional – scripts & migrations

| Variable | Description |
|----------|-------------|
| `DRY_RUN` | Set to `true` for PSEO script dry run |
| `PSEO_BATCH_SIZE` | Batch size for PSEO content generation |
| `ALLOW_PRODUCTION_MIGRATION` | Set when running Prisma migrations in production |

### Node

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | `development` or `production` (usually set automatically) |
| `VERCEL_URL` | Set on Vercel; used as fallback for base URL in some routes |

## Setup

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local` with your values.

3. Run database migrations:
   ```bash
   npx prisma migrate deploy
   ```

4. Start the dev server:
   ```bash
   npm run dev
   ```

## Deploy

- Set all required (and any optional) env vars in your hosting dashboard (e.g. Vercel).
- Ensure `NEXT_PUBLIC_BASE_URL` and `NEXTAUTH_URL` match your production URL.
