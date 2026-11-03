#!/bin/bash
# Utgående brandvägg för devcontainern: default-deny med allowlist.
# Bygger på samma idé som Anthropics referens-devcontainer för Claude Code.
# Körs som root via sudo i postStartCommand.
set -euo pipefail
IFS=$'\n\t'

ALLOWED_DOMAINS=(
  # npm
  registry.npmjs.org
  # GitHub (utöver IP-intervallen från api.github.com/meta)
  github.com
  api.github.com
  codeload.github.com
  raw.githubusercontent.com
  objects.githubusercontent.com
  release-assets.githubusercontent.com
  # Anthropic / Claude Code
  api.anthropic.com
  console.anthropic.com
  platform.claude.com
  claude.ai
  sentry.io
  # Playwright-webbläsare
  cdn.playwright.dev
  playwright.download.prss.microsoft.com
  playwright.azureedge.net
  # JetBrains IDE-backend och plugins
  download.jetbrains.com
  download-cdn.jetbrains.com
  cache-redirector.jetbrains.com
  data.services.jetbrains.com
  plugins.jetbrains.com
)

log() { echo "[init-firewall] $*"; }

# Fail-closed: avbryts skriptet någonstans lämnas nätverket stängt, aldrig öppet.
lock_down() {
  iptables -P INPUT DROP 2>/dev/null || true
  iptables -P FORWARD DROP 2>/dev/null || true
  iptables -P OUTPUT DROP 2>/dev/null || true
}
trap lock_down EXIT

save_docker_dns_rules() {
  iptables-save -t nat | grep "127\.0\.0\.11" || true
}

restore_docker_dns_rules() {
  local rules="$1"
  [ -z "$rules" ] && return 0
  iptables -t nat -N DOCKER_OUTPUT 2>/dev/null || true
  iptables -t nat -N DOCKER_POSTROUTING 2>/dev/null || true
  echo "$rules" | xargs -L 1 iptables -t nat
}

reset_rules() {
  iptables -F
  iptables -X
  iptables -t nat -F
  iptables -t nat -X
  iptables -t mangle -F
  iptables -t mangle -X
  ipset destroy allowed-domains 2>/dev/null || true
}

allow_baseline() {
  # DNS endast mot containerns resolvers (förhindrar DNS-tunnling till godtyckliga servrar)
  local ns
  for ns in $(awk '/^nameserver/ {print $2}' /etc/resolv.conf | grep -E '^[0-9.]+$'); do
    iptables -A OUTPUT -p udp --dport 53 -d "$ns" -j ACCEPT
    iptables -A OUTPUT -p tcp --dport 53 -d "$ns" -j ACCEPT
  done
  iptables -A INPUT -p udp --sport 53 -m state --state ESTABLISHED -j ACCEPT
  iptables -A INPUT -p tcp --sport 53 -m state --state ESTABLISHED -j ACCEPT
  iptables -A INPUT -i lo -j ACCEPT
  iptables -A OUTPUT -o lo -j ACCEPT
}

add_github_ranges() {
  local meta
  meta=$(curl -fsS --max-time 10 https://api.github.com/meta)
  if ! echo "$meta" | jq -e '.web and .api and .git' >/dev/null; then
    log "ERROR: oväntat svar från api.github.com/meta"
    exit 1
  fi
  echo "$meta" | jq -r '(.web + .api + .git)[]' | grep -v ':' | aggregate -q |
    while read -r cidr; do
      ipset add allowed-domains "$cidr" -exist
    done
}

add_domain() {
  local domain="$1" ips
  ips=$(dig +short A "$domain" | grep -E '^[0-9.]+$' || true)
  if [ -z "$ips" ]; then
    log "WARN: kunde inte slå upp $domain — hoppar över"
    return 0
  fi
  while read -r ip; do
    ipset add allowed-domains "$ip" -exist
  done <<< "$ips"
}

allow_host_network() {
  # Endast hostens gateway-IP, inte hela subnätet
  local host_ip
  host_ip=$(ip route | awk '/default/ {print $3; exit}')
  if [ -z "$host_ip" ]; then
    log "ERROR: hittade ingen default-route"
    exit 1
  fi
  iptables -A INPUT -s "$host_ip" -j ACCEPT
  iptables -A OUTPUT -d "$host_ip" -j ACCEPT
}

apply_default_deny() {
  iptables -P INPUT DROP
  iptables -P FORWARD DROP
  iptables -P OUTPUT DROP
  iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
  iptables -A OUTPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
  iptables -A OUTPUT -m set --match-set allowed-domains dst -j ACCEPT
  iptables -A OUTPUT -j REJECT --reject-with icmp-admin-prohibited
}

verify() {
  if curl -fsS --max-time 5 https://example.com >/dev/null 2>&1; then
    log "ERROR: example.com nåddes — brandväggen fungerar inte"
    exit 1
  fi
  if ! curl -fsS --max-time 5 https://api.github.com/zen >/dev/null 2>&1; then
    log "ERROR: api.github.com nås inte — allowlistan fungerar inte"
    exit 1
  fi
  log "OK: example.com blockeras, api.github.com nås"
}

main() {
  local docker_dns
  docker_dns=$(save_docker_dns_rules)
  reset_rules
  restore_docker_dns_rules "$docker_dns"
  allow_baseline

  ipset create allowed-domains hash:net
  add_github_ranges
  for domain in "${ALLOWED_DOMAINS[@]}"; do
    add_domain "$domain"
  done

  allow_host_network
  apply_default_deny
  verify
}

main "$@"
