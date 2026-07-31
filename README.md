# Merquellantas Convention Hub

A two-part Next.js + Supabase app for a 3-day industry convention:

1. **Public directory** (`/`) — searchable salesman grid with profile-view and
   WhatsApp-click tracking.
2. **Gated booth game** (`/roulette`) — a weighted prize wheel that only logs-in
   salesmen can unlock, plus a role-protected **Admin Dashboard** (`/admin`)
   for analytics, live inventory editing, and registering new salesmen.

Brand colors: `#ff9900` orange on black (`#0a0a0a`) and white, using your logo
from `merquellantas.com`. Fully responsive from small phones up.

---

## 0. Prerequisites

- Node.js 18.18+ (Node 20 LTS recommended)
- A free [Supabase](https://supabase.com) account
- npm (comes with Node)

Check your Node version:

```bash
node -v
```

---

## 1. Create the project folder

If you're starting from this delivered code, just unzip it and `cd` in:

```bash
cd merquellantas-convention
```

If you ever want to scaffold a *fresh* Next.js app from scratch instead (for
reference — not needed since this project is already scaffolded for you):

```bash
npx create-next-app@latest merquellantas-convention --js --tailwind --eslint --app --src-dir=false --import-alias "@/*"
```

---

## 2. Install dependencies

```bash
npm install
```

This installs Next.js, Tailwind, `@supabase/supabase-js`, `@supabase/ssr`,
and `lucide-react` (already listed in `package.json`).

---

## 3. Create your Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
2. Once it's provisioned, open **Project Settings → API**. You'll need:
   - `Project URL`
   - `anon` `public` key
   - `service_role` `secret` key (keep this one truly secret)

---

## 4. Run the database schema

1. In the Supabase dashboard, open **SQL Editor → New query**.
2. Open `supabase/schema.sql` from this project, paste the whole file, and
   click **Run**.

This creates the `salesmen`, `prizes`, and `spin_logs` tables, turns on Row
Level Security with the correct policies, and adds three safe RPC functions
(`increment_profile_views`, `increment_whatsapp_clicks`, `spin_and_award`)
that the app calls instead of doing raw table writes from the browser.

---

## 5. Create your first admin login

1. Supabase Dashboard → **Authentication → Users → Add user** — enter an
   email and password for yourself.
2. Back in **SQL Editor**, run (edit the values first):

```sql
insert into public.salesmen (name, email, phone, location, whatsapp_link, role)
values ('Your Name', 'you@merquellantas.com', '+10000000000', 'HQ', 'https://wa.me/10000000000', 'admin');
```

Use that same email/password to log in at `/login` — you'll land on `/admin`.
Any salesman you register later through the Admin Dashboard's "Salesmen" tab
gets both the login and the directory profile created automatically.

---

## 6. Configure environment variables

Copy the example file and fill in the three values from step 3:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

`.env.local` is already in `.gitignore` — never commit it.

### Optional: seed sample data

Want to click around without typing SQL for test prizes and salesmen?

```bash
npm run seed
```

This adds 5 sample prizes and 3 sample salesman directory profiles (no
logins — see step 5 for that). Safe to re-run; it skips anything that
already exists.

---

## 7. Set the convention start date

Open `lib/conventionDay.js` and set:

```js
export const CONVENTION_START_DATE = '2026-08-10'; // YYYY-MM-DD, day 1
```

The roulette page automatically computes Day 1/2/3 from this date (server
clock) and only spins prizes with stock left for the current day.

---

## 8. Run it locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- `/` — public directory (no login)
- `/login` — team login
- `/roulette` — booth game (redirects to `/login` if not signed in)
- `/admin` — dashboard (redirects away unless your account has `role = 'admin'`)

---

## 9. Add some prizes

Fastest way: log in as admin → **Admin Dashboard → Inventory tab** → fill in
the "Add Prize" row at the bottom (name, day 1/2/3 stock, probability weight)
and click **Add Prize**. Higher weight = more likely to be spun.

---

## 10. Deploy

The easiest path is [Vercel](https://vercel.com):

```bash
npx vercel
```

When prompted, add the same three environment variables from step 6 in the
Vercel project settings (Production **and** Preview environments), then
deploy. Any Node hosting platform works too (`npm run build && npm run start`).

---

## Project structure

```
app/
  page.js                  Public salesman directory
  salesman/[id]/page.js    Individual profile + view/click tracking
  login/page.js            Email/password login, role-based redirect
  roulette/page.js         Gated prize wheel (salesman + admin)
  admin/page.js            Gated admin dashboard
  api/admin/create-salesman/route.js   Server-only: creates login + profile
  layout.js, globals.css
components/
  Navbar.js, Footer.js, SalesmanCard.js, DirectoryGrid.js
  WhatsAppButton.js, RouletteWheel.js, RouletteGame.js, VictoryModal.js
  admin/AdminDashboard.js, AnalyticsPanel.js, SpinLogFeed.js,
        InventoryManager.js, SalesmanManager.js
lib/
  supabaseClient.js   Browser client (anon key)
  supabaseServer.js   Server Components client (cookie-aware)
  supabaseAdmin.js    Server-only client (service_role key)
  conventionDay.js    Day 1/2/3 calculation
middleware.js         Real route protection for /roulette and /admin
supabase/schema.sql   Full DB schema, RLS policies, RPC functions
scripts/seed.js        Optional: populate sample prizes + salesmen
```

## How the security actually works

- `middleware.js` runs on the server for every request to `/roulette*` and
  `/admin*` **before** any page code executes, checks the Supabase session
  cookie, and redirects unauthenticated visitors to `/login`. Admin routes
  additionally check `role = 'admin'` in the `salesmen` table.
- Row Level Security is enabled on every table. The browser only ever holds
  the `anon` key, which can read the public directory and prize list, but
  cannot write to `salesmen` or `prizes`, or read `spin_logs`, unless the
  request comes from a session that RLS recognizes as an admin.
- Counters (`profile_views`, `whatsapp_clicks`) and the spin/prize-decrement
  are done through `SECURITY DEFINER` RPC functions instead of open table
  updates, so anonymous visitors can only trigger those two narrow actions —
  nothing else.
- Creating a new salesman login uses the `service_role` key, which is only
  ever used inside `app/api/admin/create-salesman/route.js` (a server Route
  Handler) — it is never sent to the browser.
# merque
