#!/usr/bin/env bash
# Run every quality gate in one go and print a summary.
#   scripts/check.sh            all steps
#   scripts/check.sh --fast     skip the production build
#   scripts/check.sh --bail     stop at the first failure
# Each step's output goes to .check/<step>.log; failures print their tail.
set -uo pipefail
cd "$(dirname "$0")/.."

FAST=0; BAIL=0
for a in "$@"; do case "$a" in --fast) FAST=1 ;; --bail) BAIL=1 ;; esac; done

mkdir -p .check
declare -a NAMES=() RESULTS=() TIMES=()
failed=0

step() {
  local name="$1"; shift
  local log=".check/${name}.log" t0=$SECONDS
  printf '▸ %-10s ' "$name"
  if "$@" >"$log" 2>&1; then
    printf 'ok   (%ss)\n' $((SECONDS - t0)); RESULTS+=("ok")
  else
    printf 'FAIL (%ss)\n' $((SECONDS - t0)); RESULTS+=("FAIL"); failed=1
    tail -n 25 "$log" | sed 's/^/    │ /'
    [[ $BAIL == 1 ]] && summary
  fi
  NAMES+=("$name"); TIMES+=($((SECONDS - t0)))
}

summary() {
  echo
  for i in "${!NAMES[@]}"; do printf '  %-10s %-4s %4ss\n' "${NAMES[$i]}" "${RESULTS[$i]}" "${TIMES[$i]}"; done
  if [[ $failed == 0 ]]; then echo "✓ all checks passed"; else echo "✗ some checks failed — logs in .check/"; fi
  exit $failed
}

step typecheck npm run typecheck
step lint      npm run lint
step test      npm test
if command -v pg_isready >/dev/null && pg_isready -q; then
  step db      ./scripts/test-db.sh
else
  echo "▸ db         skipped (no local Postgres running)"
fi
[[ $FAST == 0 ]] && step build npm run build
summary
