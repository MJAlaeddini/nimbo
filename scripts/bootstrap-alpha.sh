#!/usr/bin/env bash
#
# One-time setup for the alpha checkout, on the same server as production but in its own
# directory, its own docker compose project, and its own port — so it never touches the
# production containers, volume, or .env.
#
# Piped in over ssh by .github/workflows/deploy-alpha.yml and run as
# `bash -s -- <app-dir> <web-port> <repo-url>`, the same way deploy.sh is: the copy that
# runs is the copy from the commit being deployed, and it never lives on the server.
#
# Idempotent — safe to run on every deploy. It only ever creates what is missing; an
# existing checkout or .env is left alone, so the alpha admin/staff passwords stay stable
# across deploys instead of rotating on every push.

set -euo pipefail

APP_DIR="${1:?usage: bootstrap-alpha.sh <app-dir> <web-port> <repo-url>}"
WEB_PORT="${2:?usage: bootstrap-alpha.sh <app-dir> <web-port> <repo-url>}"
REPO_URL="${3:?usage: bootstrap-alpha.sh <app-dir> <web-port> <repo-url>}"

# Same reason as in deploy.sh: this arrives as text through ssh, and a leading ~ inside
# quotes is not expanded by the shell.
APP_DIR="${APP_DIR/#\~/$HOME}"

say() { printf '\n== %s\n' "$*"; }

if [ ! -d "$APP_DIR/.git" ]; then
  say "cloning $REPO_URL into $APP_DIR"
  git clone --quiet "$REPO_URL" "$APP_DIR"
else
  say "$APP_DIR already exists, leaving the checkout as is"
fi

if [ ! -f "$APP_DIR/.env" ]; then
  say "writing a fresh alpha .env (generated passwords, printed once below)"
  ADMIN_PASSWORD="$(openssl rand -hex 12)"
  SESSION_SECRET="$(openssl rand -hex 32)"
  MENTOR_PASSWORD="$(openssl rand -hex 8)"
  LEAD_PASSWORD="$(openssl rand -hex 8)"
  {
    printf 'ADMIN_USER=nimbo\n'
    printf 'ADMIN_PASSWORD=%s\n' "$ADMIN_PASSWORD"
    printf 'SESSION_SECRET=%s\n' "$SESSION_SECRET"
    printf 'MENTOR_PASSWORD=%s\n' "$MENTOR_PASSWORD"
    printf 'LEAD_PASSWORD=%s\n' "$LEAD_PASSWORD"
    printf 'WEB_PORT=%s\n' "$WEB_PORT"
  } > "$APP_DIR/.env"
  chmod 600 "$APP_DIR/.env"

  printf '\n  alpha credentials (shown once — the .env on the server is now the only other copy):\n'
  printf '    admin console  (#/admin):  user nimbo       password %s\n' "$ADMIN_PASSWORD"
  printf '    staff panel    (#/panel):  any mentor        password %s\n' "$MENTOR_PASSWORD"
  printf '                               lead              password %s\n' "$LEAD_PASSWORD"
else
  say "$APP_DIR/.env already exists, leaving credentials as is"
fi

say "bootstrap done"
