#!/usr/bin/env bash
# Mochi installer for macOS and Linux.
# Open source: https://github.com/flatkey-ai/Mochi-ai-chatbot/blob/main/website/public/install.sh
#
# What it does, and nothing else:
#   1. Installs Node.js 22 with nvm (in your home folder, no sudo) if you don't have Node 22.13+.
#   2. Downloads Mochi from GitHub into ~/mochi (or updates it, keeping your .env and data/).
#   3. Installs Mochi's npm packages and creates .env.
#   4. Starts Mochi and opens the dashboard at http://localhost:3000/dashboard,
#      where you choose your admin password the first time.
# Your data stays in ~/mochi/data on this computer. Press Ctrl+C to stop Mochi.
#
# Usage: curl -fsSL https://www.mochichatbot.com/install.sh | bash
# Options (environment variables): MOCHI_DIR (default ~/mochi), MOCHI_NO_START=1 (install only).

set -euo pipefail

# Everything runs inside main(), called on the last line, so bash reads the whole script
# before running any of it (important with "curl ... | bash").
main() {
REPO="flatkey-ai/Mochi-ai-chatbot"
DIR="${MOCHI_DIR:-$HOME/mochi}"
NODE_MAJOR=22
NODE_MIN="22.13.0"

say()  { printf '\033[1;35m🍡 %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m!  %s\033[0m\n' "$*"; }
die()  { printf '\033[1;31mx  %s\033[0m\n' "$*" >&2; exit 1; }

command -v curl >/dev/null 2>&1 || die "curl is required. Install it and run this again."
command -v tar  >/dev/null 2>&1 || die "tar is required. Install it and run this again."

# --- 1. Node.js -------------------------------------------------------------
load_nvm() {
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  # shellcheck disable=SC1091
  if [ -s "$NVM_DIR/nvm.sh" ]; then . "$NVM_DIR/nvm.sh"; fi
  return 0
}

node_ok() {
  command -v node >/dev/null 2>&1 || return 1
  # Let Node compare its own version (sort -V isn't available everywhere).
  node -e 'const [a,b,c]=process.versions.node.split(".").map(Number),[x,y,z]=process.argv[1].split(".").map(Number);process.exit(a>x||(a===x&&(b>y||(b===y&&c>=z)))?0:1)' "$NODE_MIN"
}

load_nvm
if node_ok; then
  say "Node.js $(node -v) found."
else
  say "Installing Node.js $NODE_MAJOR with nvm (inside your home folder, no admin rights needed)..."
  if ! command -v nvm >/dev/null 2>&1; then
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash >/dev/null
    load_nvm
  fi
  command -v nvm >/dev/null 2>&1 || die "Couldn't set up nvm. Install Node.js $NODE_MIN+ from https://nodejs.org and run this again."
  nvm install "$NODE_MAJOR" >/dev/null
  nvm use "$NODE_MAJOR" >/dev/null
  node_ok || die "Node.js install didn't work. Install Node.js $NODE_MIN+ from https://nodejs.org and run this again."
  say "Node.js $(node -v) ready."
fi

# --- 2. Download or update Mochi ---------------------------------------------
if [ -d "$DIR/.git" ] && command -v git >/dev/null 2>&1; then
  say "Updating Mochi in $DIR..."
  git -C "$DIR" pull --ff-only --quiet || warn "Couldn't update with git; keeping the current version."
else
  say "Downloading Mochi into $DIR..."
  tmp="$(mktemp -d)"
  trap 'rm -rf "$tmp"' EXIT
  curl -fsSL "https://codeload.github.com/$REPO/tar.gz/refs/heads/main" | tar -xz -C "$tmp"
  src="$(find "$tmp" -mindepth 1 -maxdepth 1 -type d | head -n1)"
  mkdir -p "$DIR"
  # Copy the new code over the old one; .env and data/ are never touched.
  (cd "$src" && tar -cf - --exclude=./.env --exclude=./data .) | (cd "$DIR" && tar -xf -)
fi
cd "$DIR"

# --- 3. Packages and .env ----------------------------------------------------
say "Installing packages (this takes a minute the first time)..."
npm install --no-audit --no-fund --loglevel=error

if [ ! -f .env ]; then
  cp .env.example .env
  say "Created .env."
fi
PORT="$(grep -E '^PORT=' .env | head -n1 | cut -d= -f2- | tr -dc '0-9')"
PORT="${PORT:-3000}"

if [ "${MOCHI_NO_START:-}" = "1" ]; then
  say "Installed. Start it any time with:  cd \"$DIR\" && npm start"
  exit 0
fi

# --- 4. Start and open the dashboard ------------------------------------------
URL="http://localhost:$PORT/dashboard"
say "Starting Mochi..."
npm start </dev/null &
PID=$!
trap 'kill "$PID" 2>/dev/null || true' INT TERM

for _ in $(seq 1 60); do
  curl -fsS -o /dev/null "http://localhost:$PORT/health" 2>/dev/null && break
  kill -0 "$PID" 2>/dev/null || die "Mochi stopped while starting. See the messages above."
  sleep 1
done

echo
say "Mochi is running: $URL"
say "The first time, the dashboard asks you to choose an admin password."
say "Keep this window open. Press Ctrl+C to stop. Start again later with:  cd \"$DIR\" && npm start"
echo
if command -v open >/dev/null 2>&1; then open "$URL" >/dev/null 2>&1 || true
elif command -v xdg-open >/dev/null 2>&1; then xdg-open "$URL" >/dev/null 2>&1 || true
fi

wait "$PID"
}

main "$@"
