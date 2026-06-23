#!/usr/bin/env bash
#
# deploy.sh — push to main and let GitHub Actions deploy to Cloudflare.
#
# This script contains NO secrets (the repo is public). It reads the GitHub
# token from the gitignored local.env.txt at the repo root, pushes the current
# main, and the .github/workflows/deploy.yml workflow builds + deploys to
# Cloudflare Workers using the repo's GitHub Actions secrets.
#
# Usage:
#   ./scripts/deploy.sh           # commit must already exist; pushes main
#   ./scripts/deploy.sh --status  # just print the latest CI run status
#
# Secrets layout (local.env.txt, gitignored — NEVER commit it):
#   Cloudflare_TOKEN=...                  # Cloudflare API token
#   accounts/<CLOUDFLARE_ACCOUNT_ID>/...  # account id (inside the verify curl)
#   GITHUB_TOKEN=ghp_...                  # token for the 7-labs org (push rights)
#
# Required GitHub Actions secrets (already configured in 7-labs/cox7):
#   CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID,
#   SUPABASE_REST_URL, SUPABASE_ANON_KEY, SUPABASE_SCHEMA
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT/local.env.txt"
REPO="7-labs/cox7"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: $ENV_FILE not found. It holds the GitHub/Cloudflare tokens (gitignored)." >&2
  exit 1
fi

GH_T="$(grep -oE 'ghp_[A-Za-z0-9]+' "$ENV_FILE" | head -1 || true)"
if [[ -z "$GH_T" ]]; then
  echo "ERROR: no GitHub token (ghp_...) found in $ENV_FILE" >&2
  exit 1
fi

ci_status() {
  curl -s -H "Authorization: Bearer $GH_T" \
    "https://api.github.com/repos/$REPO/actions/runs?per_page=1" \
  | python3 -c 'import sys,json;r=json.load(sys.stdin)["workflow_runs"][0];print("run", r["head_sha"][:8], r["status"], r["conclusion"], r["html_url"])'
}

if [[ "${1:-}" == "--status" ]]; then
  ci_status
  exit 0
fi

echo "==> Pushing main to $REPO (token is not written to git config)"
git -C "$ROOT" push "https://7-labs:${GH_T}@github.com/${REPO}.git" HEAD:main

echo "==> Pushed. GitHub Actions is now building + deploying to Cloudflare."
echo "    Watch: https://github.com/$REPO/actions"
sleep 4
ci_status || true
