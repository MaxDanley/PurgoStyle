# Purgo Style Labs

Arizona activewear and premium tees. Built with Next.js.

## Environment variables

Copy `.env.example` to `.env.local` and fill in the values below.

### Getting Supabase credentials (DATABASE_URL)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) and open your project (or create one). If the project is **paused** (free tier), click **Restore project** first.
2. In the left sidebar, open **Project Settings** (gear icon) → **Database**.
3. **Use the pooler URL for this app** (especially on Vercel or any serverless host). Under **Connection string** → **Connection pooling** → **Transaction** mode, copy the URI. It will look like:
   ```text
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
   Replace **`[YOUR-PASSWORD]`** with your actual database password (see **Database password** on the same page; use **Reset database password** if you don’t know it). Do **not** leave the literal text `[YOUR-PASSWORD]` in the URL.
4. Set in `.env.local` (and in your host’s env vars, e.g. Vercel):
   ```bash
   DATABASE_URL="postgresql://postgres.[PROJECT-REF]:YOUR_ACTUAL_PASSWORD@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
   ```
   If your password contains special characters (e.g. `#`, `@`, `%`), [URL-encode](https://developer.mozilla.org/en-US/docs/Glossary/Percent-encoding) them (e.g. `#` → `%23`).
5. **Why “can’t reach database server” or connection fails:**
   - **Direct URL (port 5432)** from Supabase often fails on serverless (Vercel) due to connection limits and timeouts. Use the **pooler** URL (port **6543**, Transaction mode) as above.
   - Ensure you replaced `[YOUR-PASSWORD]` with the real password.
   - Ensure `DATABASE_URL` is set in the environment where the app runs (e.g. Vercel → Project → Settings → Environment Variables).
   - If the project was paused, restore it and wait a minute before retrying.

**Do you need Supabase anon key or service role?** For this app, **no**. We use NextAuth with Prisma and only talk to the database via `DATABASE_URL`. Supabase’s **anon** (public) and **service_role** keys are for Supabase Auth and Row Level Security when you use the Supabase client. Here we use NextAuth for auth and Prisma for DB, so only `DATABASE_URL` is required from Supabase.

### Getting NEXTAUTH_SECRET

NextAuth uses this to sign cookies and tokens. Generate a random value and set it once:

- **Option A (recommended):** In a terminal, run:
  ```bash
  openssl rand -base64 32
  ```
  Copy the output and set in `.env.local`:
  ```bash
  NEXTAUTH_SECRET="paste-the-output-here"
  ```
- **Option B:** Use any long random string (e.g. from [generate-secret.vercel.app](https://generate-secret.vercel.app)) and set `NEXTAUTH_SECRET` to it.

Never commit this value or expose it in the browser.

### Required

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string from Supabase (see above) |
| `NEXTAUTH_SECRET` | Secret for NextAuth.js sessions (see above) |
| `NEXTAUTH_URL` | App URL (e.g. `http://localhost:3000` in dev, production URL in prod) |
| `RESEND_API_KEY` | Resend API key for transactional email |
| `EMAIL_FROM` | From address for emails (e.g. `noreply@purgostyle.com`) |
| `SUPPORT_EMAIL` | Support contact (e.g. `support@purgostyle.com`) |

### Site URL

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_BASE_URL` | Public site URL (e.g. `https://www.purgostyle.com`) |
| `NEXT_PUBLIC_SITE_URL` | Same as base URL; used for auth reset link |

### Optional – analytics & marketing

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_FB_PIXEL_ID` | Facebook Pixel ID |

### Optional – content & assets

| Variable | Description |
|----------|-------------|
| (none) | Blog images use Picsum Photos; no API keys required. |

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
