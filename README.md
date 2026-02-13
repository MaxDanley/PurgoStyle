# Purgo Style Labs

Arizona activewear and premium tees. Built with Next.js.

## Environment variables

Copy `.env.example` to `.env.local` and fill in the values below.

### Getting Supabase credentials (DATABASE_URL)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) and open your project (or create one). If the project is **paused** (free tier), click **Restore project** first.
2. In the left sidebar, open **Project Settings** (gear icon) → **Database**. Open the **“Connect to your project”** modal (or the **Connection string** section).
3. **If the direct connection shows “Not IPv4 compatible”** (common on newer Supabase projects): Vercel is IPv4-only, so you **must use the Shared Pooler** instead of the direct URI.
   - In the Connect modal, expand **“Some platforms are IPv4-only”** (or look for **Connection pooling** → **Session** or **Transaction** mode).
   - Copy the **Shared Pooler** connection string (host will look like `aws-0-[region].pooler.supabase.com`, port **6543** for Transaction or **5432** for Session). Do **not** use the direct `db.xxx.supabase.co` URI when it says Not IPv4 compatible.
   - Build the URL: `postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require&connect_timeout=30`
   - Replace **`[YOUR-PASSWORD]`** with your database password, **`[PROJECT-REF]`** and **`[REGION]`** with the values from the Shared Pooler string (e.g. from the modal or Database settings). Use **Reset database password** if you don’t know the password.
4. In **Vercel** (Settings → Environment Variables), set **both**:
   - **`DATABASE_URL`** = that Shared Pooler URI (with `?pgbouncer=true&sslmode=require&connect_timeout=30`)
   - **`DIRECT_URL`** = the **same** value (same Shared Pooler URI)
   For local `.env.local`, set the same. If your password contains special characters (e.g. `#`, `@`, `%`), [URL-encode](https://developer.mozilla.org/en-US/docs/Glossary/Percent-encoding) them (e.g. `#` → `%23`).
5. **If you still see “Can’t reach database server” (P1001):**
   - **Use the Shared Pooler** (IPv4 compatible), not the direct connection, when Supabase shows “Not IPv4 compatible”.
   - Ensure the URL includes `pgbouncer=true` (required for Transaction mode with Prisma) and `sslmode=require`.
   - If the project is **paused**, click **Restore project** and wait 1–2 minutes before retrying.
   - Check [Supabase Status](https://status.supabase.com) and your project’s **Database** health in the dashboard.

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
| `DATABASE_URL` | PostgreSQL connection from Supabase (use **Shared Pooler** if direct shows “Not IPv4 compatible”; see above) |
| `DIRECT_URL` | Same as `DATABASE_URL` (required by Prisma schema) |
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
   To create the **product reviews** table (if you added the `ProductReview` model and haven’t migrated yet), create and apply the migration:
   ```bash
   ./scripts/add-reviews-table.sh
   ```
   Or run `npx prisma migrate dev --name add_product_reviews` from the project root.

4. Start the dev server:
   ```bash
   npm run dev
   ```

## Deploy

- Set all required (and any optional) env vars in your hosting dashboard (e.g. Vercel).
- Ensure `NEXT_PUBLIC_BASE_URL` and `NEXTAUTH_URL` match your production URL.

### If you get 404 on the root URL (https://www.purgostyle.com/)

**If your build log shows “Restored build cache from previous deployment”, the cache is being reused and the 404 can persist.** You must redeploy with the cache cleared (step 3 below).

1. **Vercel → Project Settings → General**
   - **Root Directory** must be empty (or `.`). If it points to a subfolder, the app will not see `app/page.tsx` and `/` will 404.

2. **Vercel → Project Settings → Build & Development**
   - **Framework Preset:** Next.js.
   - **Build Command:** `npm run build` (or leave default).
   - **Output Directory:** leave **empty** (Next.js uses `.next`; do not set e.g. `out` unless you use static export).

3. **Redeploy with cache cleared (required)**
   - Go to **Deployments**, open the **⋯** menu on the latest deployment, then **Redeploy**.
   - In the redeploy dialog, turn **on** “Clear Build Cache” (or “Redeploy with empty cache” / “Clear cache and redeploy”). If you don’t see it, check **Advanced** or **Options**.
   - Confirm. The new build log should **not** say “Restored build cache”; it will do a full install and build. Only then will the 404 go away.

4. **Confirm the deployment succeeded**
   - Open the latest deployment and check that the status is **Ready** (not Building or Error). If the build failed, fix the build logs; a failed build can leave the site on a previous state that showed 404.

5. **Domain**
   - Ensure **www.purgostyle.com** (and purgostyle.com if used) is assigned to this project and points to the deployment you expect.
