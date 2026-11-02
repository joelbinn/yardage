# Yardage devcontainer — reproducerbar miljö och sandlåda för AI-agenter.
# Node 24 LTS uppfyller Angular 22:s Node-krav.
FROM mcr.microsoft.com/devcontainers/typescript-node:1-24-bookworm

ARG CLAUDE_CODE_VERSION=latest

# Brandväggsverktyg + GitHub CLI
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    iptables ipset iproute2 dnsutils aggregate jq curl ca-certificates gnupg \
  && curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
    -o /usr/share/keyrings/githubcli-archive-keyring.gpg \
  && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
    > /etc/apt/sources.list.d/github-cli.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends gh \
  && rm -rf /var/lib/apt/lists/*

# Playwrights systemberoenden för Chromium. Själva webbläsaren installeras i
# post-create så att versionen följer projektets package.json.
RUN npx -y playwright@latest install-deps chromium \
  && rm -rf /var/lib/apt/lists/* /root/.npm

# Claude Code
RUN npm install -g @anthropic-ai/claude-code@${CLAUDE_CODE_VERSION} \
  && npm cache clean --force

# Skript som node får köra med sudo — och inget annat (ingen generell sudo i sandlådan)
COPY init-firewall.sh fix-volume-perms.sh /usr/local/bin/
RUN chmod 755 /usr/local/bin/init-firewall.sh /usr/local/bin/fix-volume-perms.sh \
  && rm -f /etc/sudoers.d/node \
  && printf 'node ALL=(root) NOPASSWD: /usr/local/bin/init-firewall.sh, /usr/local/bin/fix-volume-perms.sh\n' \
    > /etc/sudoers.d/node-sandbox \
  && chmod 0440 /etc/sudoers.d/node-sandbox \
  && visudo -c

# Monteringspunkter för volumes/read-only-binds, ägda av node
RUN mkdir -p /home/node/.claude /home/node/.config /home/node/.agents \
  && chown -R node:node /home/node/.claude /home/node/.config /home/node/.agents

# Inuti containern körs Claude Code utan behörighetsfrågor — sandlådan är skyddsnätet.
RUN for rc in /home/node/.bashrc /home/node/.zshrc; do \
    echo "alias claude='claude --dangerously-skip-permissions'" >> "$rc"; \
  done

USER node
