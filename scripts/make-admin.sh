#!/usr/bin/env bash
# Promote an existing member (they must have signed in once) to admin.
# Usage: SUPABASE_DB_URL=postgres://... scripts/make-admin.sh person@example.com
# Get the URL from Supabase → Project Settings → Database → Connection string.
set -euo pipefail
email="${1:?usage: make-admin.sh <email>}"
: "${SUPABASE_DB_URL:?set SUPABASE_DB_URL}"
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -v email="$email" <<'SQL'
update public.profiles set role = 'admin'
where id = (select id from auth.users where lower(email) = lower(:'email'))
returning id, role;
SQL
