#!/usr/bin/env bash
# Nightly scraper. Logs to scripts/logs/. Idempotent — safe to re-run.
# Wire up via launchd: see SCRAPERS.md.

set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

mkdir -p scripts/logs
TS="$(date +%Y%m%d-%H%M%S)"
LOG="scripts/logs/nightly-$TS.log"

{
  echo "=== nightly run @ $(date -u +%FT%TZ) ==="
  echo "--- seed (editorial) ---"
  npm run --silent seed:places || echo "seed failed"
  echo "--- osm ---"
  npm run --silent scrape:osm || echo "osm failed"
  echo "--- retailers ---"
  npm run --silent scrape:retailers || echo "retailers failed"
  echo "=== done @ $(date -u +%FT%TZ) ==="
} >> "$LOG" 2>&1
