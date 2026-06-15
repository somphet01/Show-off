# Supabase Setup

This folder holds the initial database plan for the Show Off backoffice.

## Current project

- Name: `Show Off Store`
- Project ref: `sjajocumfgxyxfufinse`
- Region: `ap-southeast-1`
- URL: `https://sjajocumfgxyxfufinse.supabase.co`

## Apply order

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local`.
3. Fill:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Run the SQL in `migrations/0001_backoffice_foundation.sql`, then `migrations/0002_backoffice_advisor_security_fixes.sql`, in the Supabase SQL editor, or use the Supabase CLI once linked.

The first migration keeps privileged helper functions in the `private` schema, not the exposed `public` schema. The second migration clears Supabase security advisor warnings.

## First owner

After creating your first auth user, set that user as owner:

```sql
insert into public.profiles (id, role, display_name)
values ('AUTH_USER_UUID_HERE', 'owner', 'Somphet')
on conflict (id) do update
set role = 'owner', display_name = excluded.display_name;
```

Use the Auth user UUID from Supabase Dashboard.
