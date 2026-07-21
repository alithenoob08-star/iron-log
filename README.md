# Iron Log

A dark, no-nonsense workout tracker for a small group of gym friends. Next.js
(App Router) + Supabase + Tailwind, installable as a PWA.

## Stack

- **Next.js 16** (App Router, Turbopack)
- **Supabase**: Postgres + Auth + Storage
- **Tailwind CSS v4**
- **Serwist** (`@serwist/turbopack`) for the installable PWA / service worker

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.local.example` to `.env.local` and fill in your Supabase project's
   URL and anon/publishable key (Supabase dashboard → Project Settings → Data API):

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key
   ```

3. Run the SQL files in `supabase/migrations/` **in order** via the Supabase
   SQL Editor (or `supabase db push` if you've linked the project with the CLI).

4. In the Supabase dashboard, go to **Authentication → Sign In / Providers → Email**
   and turn **off** "Confirm email" — accounts sign in with a synthetic
   `name@gym.local` address that can't receive real mail.

5. Start the dev server:

   ```bash
   npm run dev
   ```

## How auth works

There's no email/password signup in the traditional sense — users pick a
display name and a 4-digit PIN. Under the hood, Supabase Auth still handles
everything (hashing, sessions, rate limiting): the app maps `name` → a
synthetic email (`name@gym.local`) and pads the PIN into a 6+ character
password before calling `signUp` / `signInWithPassword`. See
[`src/lib/auth/identity.ts`](src/lib/auth/identity.ts) and
[`src/app/(auth)/actions.ts`](src/app/(auth)/actions.ts).

## Deploying to Netlify

Netlify supports Next.js 16 with **zero configuration** via its OpenNext-based
adapter — no `netlify.toml` needed.

1. Push this repo to GitHub (or GitLab/Bitbucket).
2. In Netlify: **Add new site → Import an existing project**, pick the repo.
   Netlify auto-detects Next.js and configures the build.
3. Under **Site configuration → Environment variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy. That's it — SSR, Server Actions, and the proxy (formerly
   "middleware") all run as Netlify Functions/Edge Functions automatically.

Both Netlify's free tier and Supabase's free tier comfortably cover a
6–10 person friend group.

## Project structure notes

- `supabase/migrations/*.sql` — schema, RLS policies, and seed data, in the
  order they should be run. Read top-to-bottom for the data model.
- `src/proxy.ts` — Next 16 renamed `middleware.ts` to `proxy.ts`; this refreshes
  the Supabase session and gates unauthenticated access.
- `src/app/sw.ts` + `src/app/serwist/[path]/route.ts` — the service worker
  source and the route that serves it (Turbopack needs this route-handler
  approach instead of the classic static-file build).
