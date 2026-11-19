#!/usr/bin/env bash
# ============================================================
# NexusOS — Supabase Free-Tier Keep-Alive Cron
# ============================================================
# Prevents Supabase free-tier project from pausing due to inactivity.
# Schedule via crontab on your Hostinger VPS:
#   crontab -e
#   0 */6 * * * /path/to/keep-alive-cron.sh >> /var/log/nexusos-keepalive.log 2>&1
# ============================================================

set -euo pipefail

SUPABASE_URL="${SUPABASE_URL:-}"
SUPABASE_SERVICE_KEY="${SUPABASE_SERVICE_KEY:-}"

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] ERROR: SUPABASE_URL or SUPABASE_SERVICE_KEY not set."
  exit 1
fi

TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X PATCH "${SUPABASE_URL}/rest/v1/_keep_alive?id=eq.1" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{\"last_pinged_at\": \"${TIMESTAMP}\", \"status\": \"active\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
  echo "[${TIMESTAMP}] SUCCESS (HTTP ${HTTP_CODE}): Keep-alive ping sent."
else
  echo "[${TIMESTAMP}] FAILED (HTTP ${HTTP_CODE}): ${BODY}"
  exit 1
fi
