#!/usr/bin/env bash
# Mochi on a fresh Linux VPS (Sakura VPS, ConoHa, Xserver VPS, Hetzner, any Ubuntu/Debian).
# Open source: https://github.com/AM-young-fun/Mochi-ai-chatbot/blob/main/website/public/install-vps.sh
#
# What it does, and nothing else:
#   1. Installs Docker (official script from get.docker.com) if it isn't there yet.
#   2. Writes /opt/mochi: Mochi (ghcr.io/am-young-fun/mochi) behind Caddy, which gets a free
#      HTTPS certificate automatically. Both restart on their own after a crash or a reboot.
#   3. Starts them and prints your dashboard address plus the one-time setup code.
#
# Usage (as root or with sudo):
#   curl -fsSL https://www.mochichatbot.com/install-vps.sh | sudo bash
#
# Options (environment variables; with sudo, put them after "sudo"):
#   MOCHI_DOMAIN   your own domain pointing at this server, e.g. bot.example.com.
#                  Default: <your-ip>.sslip.io, a free name that resolves to your IP.
#   MOCHI_DIR      install folder (default /opt/mochi)
#   MOCHI_IMAGE    container image (default ghcr.io/am-young-fun/mochi:latest)
#
# Your firewall must allow TCP 80 and 443 (on Sakura VPS: control panel → パケットフィルター).
# Run it again any time to update Mochi; your data in /opt/mochi/data is kept.

main() {
  set -euo pipefail

  say()  { printf '\033[35m[mochi]\033[0m %s\n' "$*"; }
  fail() { printf '\033[31mx  %s\033[0m\n' "$*" >&2; exit 1; }

  [ "$(id -u)" = "0" ] || fail "Please run as root: curl -fsSL https://www.mochichatbot.com/install-vps.sh | sudo bash"
  [ "$(uname -s)" = "Linux" ] || fail "This installer is for a Linux server. On your own computer, use the installer on www.mochichatbot.com."

  local dir="${MOCHI_DIR:-/opt/mochi}"
  local image="${MOCHI_IMAGE:-ghcr.io/am-young-fun/mochi:latest}"
  local domain="${MOCHI_DOMAIN:-}"

  # --- 1. Docker ------------------------------------------------------------------------
  if ! command -v docker >/dev/null 2>&1; then
    say "Installing Docker (official script from get.docker.com)..."
    curl -fsSL https://get.docker.com | sh
  else
    say "Docker $(docker --version | awk '{print $3}' | tr -d ,) found."
  fi
  systemctl enable --now docker >/dev/null 2>&1 || true
  docker compose version >/dev/null 2>&1 || fail "Docker Compose is missing. Install the docker-compose-plugin package and run this again."

  # --- 2. Address -----------------------------------------------------------------------
  if [ -z "$domain" ]; then
    local ip
    ip="$(curl -fsS4 --max-time 10 https://api.ipify.org || curl -fsS4 --max-time 10 https://ifconfig.me || true)"
    [ -n "$ip" ] || fail "Couldn't find this server's public IPv4 address. Set MOCHI_DOMAIN and run again."
    domain="${ip//./-}.sslip.io"
    say "No domain given, so using $domain (it points at $ip)."
  fi

  # --- 3. Files -------------------------------------------------------------------------
  mkdir -p "$dir/data"
  cat > "$dir/compose.yaml" <<EOF
# Written by install-vps.sh. Mochi behind Caddy (automatic HTTPS). Data lives in ./data.
services:
  mochi:
    image: $image
    restart: unless-stopped
    environment:
      PUBLIC_URL: https://$domain
      TRUST_PROXY: "1"
    volumes:
      - ./data:/app/data
  caddy:
    image: caddy:2
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - mochi
volumes:
  caddy_data:
  caddy_config:
EOF
  cat > "$dir/Caddyfile" <<EOF
$domain {
	encode gzip
	reverse_proxy mochi:3000
}
EOF

  # Open the web ports if this server uses ufw (Sakura's packet filter is set in the control panel).
  if command -v ufw >/dev/null 2>&1 && ufw status 2>/dev/null | grep -q "Status: active"; then
    ufw allow 80/tcp >/dev/null && ufw allow 443/tcp >/dev/null && say "Opened ports 80 and 443 in ufw."
  fi

  # --- 4. Start -------------------------------------------------------------------------
  say "Downloading and starting Mochi..."
  cd "$dir"
  docker compose pull -q
  docker compose up -d --remove-orphans

  say "Waiting for Mochi to start..."
  local code=""
  for _ in $(seq 1 60); do
    code="$(docker compose logs mochi 2>/dev/null | grep -o 'one-time setup code: [A-Z0-9-]*' | tail -1 | awk '{print $NF}' || true)"
    if docker compose exec -T mochi node -e "fetch('http://127.0.0.1:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" >/dev/null 2>&1; then
      break
    fi
    sleep 2
  done

  echo
  say "Mochi is running: https://$domain/dashboard"
  if [ -n "$code" ]; then
    say "First visit: choose an admin password. You'll be asked for this one-time setup code: $code"
  else
    say "First visit: choose an admin password. Already set one before? Just log in."
  fi
  say "The HTTPS certificate can take a minute the first time. If the page doesn't load, check that ports 80 and 443 are open."
  echo
  say "Useful commands (in $dir):"
  echo "    docker compose logs -f mochi      # watch the log"
  echo "    docker compose restart mochi      # restart"
  echo "    curl -fsSL https://www.mochichatbot.com/install-vps.sh | sudo bash   # update to the latest Mochi"
  echo
}

main "$@"
