#!/usr/bin/env bash
# For each supabase/tests/*_test.sql: create a throwaway local Postgres DB,
# apply the Supabase stub + all migrations + seed, run the test, drop the DB.
# Needs a local Postgres (e.g. `brew install postgresql@17`); no Docker required.
set -euo pipefail
cd "$(dirname "$0")/../supabase"
psql() { command psql -X -q -v ON_ERROR_STOP=1 "$@"; }
status=0
for t in tests/*_test.sql; do
  DB="slswca_test_$$_$(basename "$t" .sql)"
  createdb "$DB"
  if { psql -d "$DB" -f tests/supabase_stub.sql &&
       for f in migrations/*.sql; do psql -d "$DB" -f "$f" || exit 1; done &&
       psql -d "$DB" -f seed.sql &&
       psql -d "$DB" -f "$t"; } >/tmp/"$DB".log 2>&1; then
    echo "✓ $(basename "$t")"
  else
    echo "✗ $(basename "$t")"; grep -E "ERROR|ASSERT" /tmp/"$DB".log | head -5; status=1
  fi
  dropdb --if-exists "$DB"
done
exit $status
