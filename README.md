# Purgo Style Labs

Arizona activewear and premium tees. Built with Next.js.

## Environment variables

Copy `.env.example` to `.env.local` and fill in the values below.

### Getting Supabase credentials (DATABASE_URL)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) and open your project (or create one).
2. In the left sidebar, open **Project Settings** (gear icon) → **Database**.
3. Under **Connection string**, choose the mode:
   - **URI** (recommended for this app): Use the **Direct connection** URI if you run migrations and the app from a single environment. Copy it and replace the placeholder `[YOUR-PASSWORD]` with your database password (same as under **Database password** on that page; reset it if needed).
   - For **serverless** (e.g. Vercel), use **Connection pooling** → **Transaction** mode and the URI shown there (often port `6543`); this is your `DATABASE_URL`.
4. Set in `.env.local`:
   ```bash
   DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
   ```
   Or for direct (no pooler):
   ```bash
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
   ```
5. **Database password**: If you don’t know it, use **Database** → **Reset database password**, then use the new password in the URI above.

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
