# Setting up Supabase (one-time, ~5 minutes)

Supabase is a free hosted database. The app stores user accounts, places,
reviews, forum posts, and merchant claims there.

You only do this once. After that the app boots and persists everything.

---

## 1. Create the project

1. Go to <https://supabase.com> and sign in (GitHub login is easiest).
2. Click **New project**.
3. Fill in:
   - **Name:** `smoking-app` (or anything you like)
   - **Database password:** click *Generate*, then save it somewhere safe.
     You won't need it day-to-day, but it can't be recovered.
   - **Region:** pick the one closest to you (e.g. `Europe (Frankfurt)`).
   - **Plan:** Free.
4. Click **Create new project**. Wait ~1 minute for it to spin up.

## 2. Copy your keys into the app

In the Supabase dashboard for your project:

1. Click the gear icon (bottom left) → **API**.
2. You'll see three things you need:
   - **Project URL** — copy it.
   - **anon public** key — copy it.
   - **service_role** key — click *Reveal*, copy it. **Treat this like a password.**

Open the file `.env.local` in this project (create it from `.env.example` if
it doesn't exist) and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=<Project URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
SUPABASE_SERVICE_ROLE_KEY=<service_role key>
```

Then generate a session-cookie signing key. In a terminal:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Paste the output into `.env.local`:

```
SESSION_SECRET=<the random string>
```

## 3. Create the tables

Still in the Supabase dashboard:

1. Left sidebar → **SQL Editor** → **+ New query**.
2. Open `supabase/migrations/0001_init.sql` from this project.
3. Paste the whole file into the SQL editor.
4. Click **Run** (bottom right). You should see `Success. No rows returned.`

That's it. The app will now boot, sign-up will create real users, and places
you add will persist.

## 4. Verify

In the Supabase dashboard, left sidebar → **Table Editor**. You should see:

- `users`, `sessions`, `places`, `reviews`, `favorites`,
- `merchant_claims`, `forum_posts`, `forum_replies`.

All empty for now — that's correct.

---

## Troubleshooting

- **App throws "Supabase env vars missing"** — your `.env.local` isn't being
  read. Restart `npm run dev`. Env vars are loaded at boot, not at request time.
- **`relation "public.users" does not exist`** — you forgot to run the SQL
  migration in step 3.
- **`SESSION_SECRET must be set (32+ chars)`** — re-run the `node -e ...`
  command from step 2 and paste the output.
- **Signed up but can't log in** — that's the *old* in-memory auth. After
  Phase 2 ships, sign up again; the new accounts hit the real DB.
