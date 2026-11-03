#!/bin/bash
# Named volumes skapas ägda av root vid första montering; ge dem till node.
# Fasta sökvägar — skriptet körs via sudo och tar inga argument.
set -euo pipefail

for dir in /workspaces/yardage/node_modules /home/node/.claude /home/node/.config; do
  # Aldrig symlänkar; bara riktiga monteringspunkter (skydd mot symlink-chown via sudo)
  if [ -L "$dir" ] || ! mountpoint -q "$dir"; then
    continue
  fi
  chown -h node:node -- "$dir"
done
