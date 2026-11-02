#!/bin/bash
# Körs en gång när containern skapas (även efter rebuild).
set -euo pipefail

sudo /usr/local/bin/fix-volume-perms.sh

mkdir -p /home/node/.config/git

git config --global --get-all safe.directory | grep -qx /workspaces/yardage \
  || git config --global --add safe.directory /workspaces/yardage

if ! git config --global user.name >/dev/null; then
  echo "[post-create] Git-identitet saknas. Kör en gång (sparas i volume):"
  echo "  git config --global user.name \"Ditt Namn\""
  echo "  git config --global user.email \"du@example.com\""
fi

# Före ticket 01 finns inget package.json — då finns inget att installera.
if [ -f package.json ]; then
  npm ci
  npx playwright install chromium
else
  echo "[post-create] Inget package.json ännu — hoppar över npm ci och Playwright-webbläsare."
fi
