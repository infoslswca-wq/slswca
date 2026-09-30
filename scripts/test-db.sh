#!/usr/bin/env bash
# Applies migrations + seed to a throwaway local Postgres DB and runs RLS tests.
# Needs a local Postgres (e.g. `brew install postgresql@17`); no Docker required.
set -euo pipefail
cd "$(dirname "$0")/../supabase"
DB="slswca_rls_test_$$"
createdb "$DB"
trap 'dropdb --if-exists "$DB"' EXIT
psql() { command psql -X -q -v ON_ERROR_STOP=1 -d "$DB" "$@"; }
psql -f tests/supabase_stub.sql
for f in migrations/*.sql; do psql -f "$f"; done
psql -f seed.sql
psql -f tests/rls_test.sql
