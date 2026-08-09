#!/usr/bin/env bash
#
# Update a running instance to a given commit, on the server, without losing the data.
#
# Piped in over ssh by .github/workflows/deploy-server.yml and run as `bash -s -- <sha>`,
# so it never lives on the server: the copy that runs is the copy from the commit being
# deployed. It is also fine to run by hand:
#
#   APP_DIR=~/nimbo bash scripts/deploy.sh <sha>
#
# The data — weeks, scores, challenges, the roster the panel has edited — lives in the
# roadmap-data volume, not in the image. `up -d --build` replaces containers and leaves
# volumes alone, so an update is not supposed to touch it. This script is the belt to that
# suspenders: it copies the data off the volume before anything is rebuilt, refuses to
# continue if that copy is not readable JSON, checks the data is still there afterwards,
# and puts the old commit back if the new one does not come up healthy.
#
# `docker compose down -v` is the one command that deletes the volume. It is not here, and
# it must not be added.

set -euo pipefail

TARGET_SHA="${1:?usage: deploy.sh <commit-sha>}"

APP_DIR="${APP_DIR:-$HOME/nimbo}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
BACKUP_DIR="${BACKUP_DIR:-$HOME/nimbo-deploy-backups}"

# These arrive as text through ssh, and a leading ~ inside quotes is not expanded by the
# shell — `cd "~/nimbo"` looks for a directory actually named "~". Expand it here so a
# DEPLOY_PATH of ~/nimbo means what whoever typed it meant.
APP_DIR="${APP_DIR/#\~/$HOME}"
BACKUP_DIR="${BACKUP_DIR/#\~/$HOME}"
KEEP_BACKUPS="${KEEP_BACKUPS:-20}"
HEALTH_RETRIES="${HEALTH_RETRIES:-30}"
HEALTH_DELAY="${HEALTH_DELAY:-2}"

say() { printf '\n== %s\n' "$*"; }
die() { printf '\nFAILED: %s\n' "$*" >&2; exit 1; }

# --- where we are ------------------------------------------------------------

if ! cd "$APP_DIR" 2>/dev/null; then
  printf 'checkouts that look like this one, under %s:\n' "$HOME" >&2
  find "$HOME" -maxdepth 3 -name docker-compose.yml -not -path '*/node_modules/*' -printf '  %h\n' 2>/dev/null | head -n 10 >&2 || true
  die "no such directory: $APP_DIR (set the DEPLOY_PATH repository variable to the checkout's path)"
fi
[ -d .git ] || die "$APP_DIR is not a git checkout"
[ -f "$COMPOSE_FILE" ] || die "$APP_DIR/$COMPOSE_FILE is missing"
[ -f .env ] || die "$APP_DIR/.env is missing — compose needs ADMIN_PASSWORD and SESSION_SECRET and will refuse to start without it"

if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose -f "$COMPOSE_FILE")
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE=(docker-compose -f "$COMPOSE_FILE")
else
  die "neither 'docker compose' nor 'docker-compose' is installed"
fi

# Tracked files belong to the repository: a deploy makes the checkout match the commit being
# deployed, so hand edits to them are printed and then dropped rather than quietly pinning
# the server to an old version. Untracked and ignored files are never touched by any of this,
# which is what keeps .env — the passwords the whole thing runs on, and the one file that is
# deliberately not in the repository — exactly where it is.
if ! git diff --quiet HEAD -- 2>/dev/null; then
  say "local edits to tracked files, discarding them"
  git --no-pager diff --stat HEAD -- >&2
fi

PREVIOUS_SHA="$(git rev-parse HEAD)"
say "at $PREVIOUS_SHA, going to $TARGET_SHA"

# --- copy the data off the volume, first --------------------------------------

mkdir -p "$BACKUP_DIR"
STAMP="$(date -u +%Y%m%d-%H%M%S)"
BACKUP="$BACKUP_DIR/roadmap-$STAMP.json"

# `run --rm --no-deps` mounts the same volume without needing the api to be up, so this
# works whether or not the site is currently running, and on a machine that has never run
# it. An instance that has never been written to has no data file yet; that is the one
# case where there is nothing to copy and nothing to lose.
say "copying the data off the volume"
if "${COMPOSE[@]}" run --rm --no-deps -T --entrypoint sh api -c 'test -f /data/roadmap.json' >/dev/null 2>&1; then
  "${COMPOSE[@]}" run --rm --no-deps -T --entrypoint node api \
    -e 'JSON.parse(require("fs").readFileSync("/data/roadmap.json","utf8"))' \
    || die "/data/roadmap.json is not readable JSON — refusing to rebuild on top of data that is already damaged"

  "${COMPOSE[@]}" run --rm --no-deps -T --entrypoint cat api /data/roadmap.json > "$BACKUP"
  [ -s "$BACKUP" ] || die "the copy came out empty"
  printf '   %s (%s bytes)\n' "$BACKUP" "$(wc -c < "$BACKUP" | tr -d ' ')"
  HAD_DATA=yes

  # Keep the last KEEP_BACKUPS. These are the copies from deploys; the api keeps its own
  # daily ones inside the volume, which is a different safety net for a different accident.
  ls -1t "$BACKUP_DIR"/roadmap-*.json 2>/dev/null | tail -n "+$((KEEP_BACKUPS + 1))" | while read -r old; do
    rm -f "$old"
  done
else
  say "no data file yet — first run on this machine, nothing to copy"
  HAD_DATA=no
fi

# Which volume is holding it. If a deploy ever silently switched to a different volume the
# data would look deleted while sitting safely in the old one, so it is worth an assertion.
volume_name() {
  "${COMPOSE[@]}" ps -q api 2>/dev/null | head -n1 | xargs -r docker inspect \
    -f '{{range .Mounts}}{{if eq .Destination "/data"}}{{.Name}}{{end}}{{end}}' 2>/dev/null || true
}
VOLUME_BEFORE="$(volume_name)"

# --- bring up the new commit --------------------------------------------------

say "fetching"
git fetch --prune origin
git rev-parse --verify "$TARGET_SHA^{commit}" >/dev/null 2>&1 || die "commit $TARGET_SHA is not in the fetched history"

say "checking out $TARGET_SHA"
git checkout --force --detach "$TARGET_SHA"

# --force replaces tracked files only. If .env went missing here something is very wrong,
# and compose would fail halfway up rather than at all, so check before building.
[ -f .env ] || die ".env disappeared during the checkout — not building without it"

say "building and starting"
"${COMPOSE[@]}" up -d --build

# --- is it actually up, and is the data still there? --------------------------

# Asked inside the api container: node is certainly there, and the answer comes from the
# process that owns the data rather than from a proxy in front of it.
health() {
  "${COMPOSE[@]}" exec -T api node -e '
    fetch("http://127.0.0.1:8080/api/health")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("http " + r.status))))
      .then((h) => { console.log(JSON.stringify(h)); process.exit(0); })
      .catch((e) => { console.error(e.message); process.exit(1); });
  ' 2>/dev/null
}

say "waiting for the api"
HEALTH=""
for _ in $(seq 1 "$HEALTH_RETRIES"); do
  if HEALTH="$(health)"; then break; fi
  HEALTH=""
  sleep "$HEALTH_DELAY"
done

rollback() {
  say "rolling back to $PREVIOUS_SHA"
  git checkout --force --detach "$PREVIOUS_SHA"
  "${COMPOSE[@]}" up -d --build
  printf '\nThe old commit is back up. The data was never touched, and a copy from just\n'
  printf 'before this deploy is at:\n  %s\n' "${BACKUP:-<none: there was no data yet>}"
}

if [ -z "$HEALTH" ]; then
  "${COMPOSE[@]}" logs --tail 40 api >&2 || true
  rollback
  die "the new commit did not answer /api/health in $((HEALTH_RETRIES * HEALTH_DELAY))s"
fi
printf '   %s\n' "$HEALTH"

VOLUME_AFTER="$(volume_name)"
if [ -n "$VOLUME_BEFORE" ] && [ "$VOLUME_BEFORE" != "$VOLUME_AFTER" ]; then
  rollback
  die "the data volume changed from '$VOLUME_BEFORE' to '$VOLUME_AFTER' — the old data is still in '$VOLUME_BEFORE', do not run 'down -v'"
fi

if [ "$HAD_DATA" = yes ]; then
  say "checking the data survived"
  "${COMPOSE[@]}" exec -T api node -e '
    const data = JSON.parse(require("fs").readFileSync("/data/roadmap.json", "utf8"));
    const weeks = (data.weeks || []).length;
    if (weeks === 0) { console.error("the data file has no weeks in it"); process.exit(1); }
    console.log("weeks: " + weeks + ", challenges: " + (data.challenges || []).length);
  ' || {
    rollback
    die "the data did not read back cleanly after the deploy — the copy from before it is at $BACKUP"
  }
fi

say "deployed $TARGET_SHA"
[ "$HAD_DATA" = yes ] && printf 'data copy from before this deploy: %s\n' "$BACKUP"
exit 0
