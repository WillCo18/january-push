# IMPORTANT: Before Deploying to Vercel

## The Hardcoded Credentials Issue

Currently, `src/integrations/supabase/client.ts` has hardcoded Supabase credentials:

```typescript
const SUPABASE_URL = "https://rpoqoviilunjbkiqrbtz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
```

**This is fine for the Lovable deployment**, but for Vercel you need to change it.

## What to Do

### Option 1: Manual Edit (Quick)

Before deploying to Vercel, edit `src/integrations/supabase/client.ts`:

**Change from:**
```typescript
const SUPABASE_URL = "https://rpoqoviilunjbkiqrbtz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
```

**To:**
```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
```

Then commit and push to your GitHub repo.

### Option 2: Separate Branch (Better)

Keep the Lovable version on `main`, create a `vercel` branch:

```bash
git checkout -b vercel
# Edit client.ts to use env vars
git add src/integrations/supabase/client.ts
git commit -m "Use env vars for Vercel deployment"
git push origin vercel
```

Then deploy the `vercel` branch to Vercel.

## Why This Matters

- **Lovable version:** Uses hardcoded credentials (auto-managed)
- **Vercel version:** Uses environment variables (you manage)
- This keeps them completely separate

## Security Note

The anon/publishable key is safe to expose in client code because:
- It's protected by Row Level Security (RLS) policies
- Users can't access data they shouldn't
- It's meant to be public

But hardcoding means anyone cloning your repo connects to the same database.
Using env vars means each deployment has its own database.
