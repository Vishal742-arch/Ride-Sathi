# Ride With Me

Mobile-first shared rides for Indore, Dewas, and future connected cities.

## Local development

1. Copy `.env.example` to `.env.local` and add your Supabase values.
2. Run the migrations in `supabase/migrations` using the Supabase CLI or SQL editor.
3. Run `npm install` and `npm run dev`.

## Vercel

Import this repository into Vercel, add the environment variables from `.env.example`, and deploy. The included `vercel.json` uses the standard Next.js build command.

Creator promotion and discovery platform built with Next.js, Supabase, and Stripe.

## Run locally

1. Copy `.env.example` to `.env.local` and add Supabase + Stripe test credentials.
2. Run `npm install`, then `npm run dev`.
3. Apply `supabase/migrations/001_initial_schema.sql` in the Supabase SQL editor or via the Supabase CLI.
4. Configure Stripe to send `checkout.session.completed` to `http://localhost:3000/api/stripe/webhook` (use Stripe CLI forwarding during local development).

The webhook is the only path that marks a promotion active; checkout redirects do not change payment state.

## Deployment notes

Set all environment variables in the hosting provider. The service-role key is used server-side only by the verified webhook. For production, add an admin-role RLS policy and use scheduled SQL/Edge Function work to mark expired `ACTIVE` promotions as `COMPLETED`.

## Deploy to Vercel

1. Push this folder to a new GitHub repository (do **not** commit `.env.local`).
2. In Vercel, choose **Add New → Project**, import the repository, and keep the automatically detected **Next.js** preset.
3. Add these environment variables in **Settings → Environment Variables** for Production, Preview, and Development as appropriate:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_APP_URL` — set this to your deployed `https://your-project.vercel.app` URL

4. Deploy. Then update Supabase Auth redirect URLs to include `https://your-project.vercel.app/auth/callback`.
5. In Stripe, create a production or test webhook pointing to `https://your-project.vercel.app/api/stripe/webhook` and subscribe to `checkout.session.completed`. Copy its signing secret into `STRIPE_WEBHOOK_SECRET` in Vercel.

Vercel needs no `vercel.json` file for this Next.js application. Use `npm run build` as the build command (Vercel detects it automatically).
