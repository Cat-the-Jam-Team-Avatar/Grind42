# 42 Tycoon

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Required `.env.local` values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUPABASE_ANON_KEY
FT_API_CLIENT_ID=42_INTRA_CLIENT_ID
FT_API_CLIENT_SECRET=42_INTRA_CLIENT_SECRET
```

Local app URL:

```text
http://localhost:3000
```

Local app callback:

```text
http://localhost:3000/auth/callback
```

## 42 Auth setup

This app uses Supabase Auth with a custom OAuth2 provider for 42. GitHub auth is not used.

Supabase custom provider identifier:

```text
custom:42-school
```

42 Intra application redirect URI:

```text
https://PROJECT_REF.supabase.co/auth/v1/callback
```

Supabase URL configuration:

```text
Site URL:
http://localhost:3000

Redirect URLs:
http://localhost:3000/auth/callback
```

Supabase custom OAuth2 provider values:

```text
Identifier: custom:42-school
Name: 42 School
Authorization URL: https://api.intra.42.fr/oauth/authorize
Token URL: https://api.intra.42.fr/oauth/token
Userinfo URL: https://api.intra.42.fr/v2/me
Scopes: public
Attribute mapping:
  sub: email
Email optional: true
Enabled: true
Provider type: OAuth2
```

To create or update this provider from the repo, temporarily add the service role key to `.env.local`:

```env
SUPABASE_SERVICE_ROLE_KEY=SUPABASE_SERVICE_ROLE_KEY
```

Then run:

```bash
npm run auth:setup42
```

Remove `SUPABASE_SERVICE_ROLE_KEY` from `.env.local` after setup if you do not need to run the command again.

Run `supabase/schema.sql` after enabling auth so the callback route can create the matching `users` row under RLS.
