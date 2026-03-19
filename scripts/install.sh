#!/bin/sh

set -eu

# Curl-friendly installer for Superplan CLI.
# Default behavior:
# 1. clone the repo into a temporary directory
# 2. install dependencies when needed
# 3. build the CLI
# 4. install it globally through npm
#
# Optional environment variables:
# - SUPERPLAN_REPO_URL: git repository to install from
# - SUPERPLAN_REF: git ref to check out after clone
# - SUPERPLAN_SOURCE_DIR: local source directory to copy instead of cloning
# - SUPERPLAN_INSTALL_PREFIX: custom npm global prefix for the install

SUPERPLAN_REPO_URL="${SUPERPLAN_REPO_URL:-https://github.com/superplan-md/cli.git}"
SUPERPLAN_REF="${SUPERPLAN_REF:-main}"
SUPERPLAN_SOURCE_DIR="${SUPERPLAN_SOURCE_DIR:-}"
SUPERPLAN_INSTALL_PREFIX="${SUPERPLAN_INSTALL_PREFIX:-}"

say() {
  printf '%s\n' "$*"
}

fail() {
  printf 'error: %s\n' "$*" >&2
  exit 1
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    fail "missing required command: $1"
  fi
}

require_command node
require_command npm
require_command mktemp

WORK_DIR="$(mktemp -d "${TMPDIR:-/tmp}/superplan-install-XXXXXX")"
SOURCE_WORKTREE="$WORK_DIR/source"

cleanup() {
  rm -rf "$WORK_DIR"
}

trap cleanup EXIT INT TERM

if [ -n "$SUPERPLAN_INSTALL_PREFIX" ]; then
  export npm_config_prefix="$SUPERPLAN_INSTALL_PREFIX"
fi

if [ -n "$SUPERPLAN_SOURCE_DIR" ]; then
  [ -d "$SUPERPLAN_SOURCE_DIR" ] || fail "SUPERPLAN_SOURCE_DIR does not exist: $SUPERPLAN_SOURCE_DIR"
  say "Copying Superplan source from $SUPERPLAN_SOURCE_DIR"
  mkdir -p "$SOURCE_WORKTREE"
  cp -R "$SUPERPLAN_SOURCE_DIR"/. "$SOURCE_WORKTREE"
else
  require_command git
  say "Cloning Superplan from $SUPERPLAN_REPO_URL"
  git clone "$SUPERPLAN_REPO_URL" "$SOURCE_WORKTREE" >/dev/null 2>&1
  (
    cd "$SOURCE_WORKTREE"
    git checkout "$SUPERPLAN_REF" >/dev/null 2>&1
  ) || fail "failed to check out ref: $SUPERPLAN_REF"
fi

[ -f "$SOURCE_WORKTREE/package.json" ] || fail "package.json not found in installer worktree"

cd "$SOURCE_WORKTREE"

if [ ! -d node_modules ]; then
  say "Installing dependencies"
  npm install >/dev/null
else
  say "Using existing node_modules from source snapshot"
fi

say "Building Superplan"
npm run build >/dev/null

INSTALL_PREFIX="$(npm prefix --global)"
INSTALL_BIN_DIR="$INSTALL_PREFIX/bin"

if [ -n "$SUPERPLAN_SOURCE_DIR" ]; then
  say "Installing Superplan from local source snapshot"
  mkdir -p "$INSTALL_PREFIX/lib/node_modules" "$INSTALL_BIN_DIR"
  rm -rf "$INSTALL_PREFIX/lib/node_modules/superplan"
  cp -R "$SOURCE_WORKTREE" "$INSTALL_PREFIX/lib/node_modules/superplan"
  ln -sf ../lib/node_modules/superplan/dist/cli/main.js "$INSTALL_BIN_DIR/superplan"
else
  say "Packing Superplan"
  PACKAGE_TGZ="$(npm pack)"

  say "Installing Superplan globally with npm"
  npm install --global "$SOURCE_WORKTREE/$PACKAGE_TGZ" >/dev/null
fi

if [ ! -x "$INSTALL_BIN_DIR/superplan" ]; then
  fail "superplan binary was not installed to $INSTALL_BIN_DIR"
fi

say "Installed Superplan to $INSTALL_BIN_DIR/superplan"
say "Run: superplan --version"
