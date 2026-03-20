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
# - SUPERPLAN_OVERLAY_SOURCE_PATH: prebuilt overlay bundle or executable to install
# - SUPERPLAN_OVERLAY_INSTALL_DIR: install directory for the overlay bundle or executable
# - SUPERPLAN_OVERLAY_EXECUTABLE_RELATIVE_PATH: relative executable path inside the installed overlay bundle

SUPERPLAN_REPO_URL="${SUPERPLAN_REPO_URL:-https://github.com/superplan-md/cli.git}"
SUPERPLAN_REF="${SUPERPLAN_REF:-dev}"
SUPERPLAN_SOURCE_DIR="${SUPERPLAN_SOURCE_DIR:-}"
SUPERPLAN_INSTALL_PREFIX="${SUPERPLAN_INSTALL_PREFIX:-}"
SUPERPLAN_OVERLAY_SOURCE_PATH="${SUPERPLAN_OVERLAY_SOURCE_PATH:-}"
SUPERPLAN_OVERLAY_INSTALL_DIR="${SUPERPLAN_OVERLAY_INSTALL_DIR:-${HOME}/.local/share/superplan/overlay}"
SUPERPLAN_OVERLAY_EXECUTABLE_RELATIVE_PATH="${SUPERPLAN_OVERLAY_EXECUTABLE_RELATIVE_PATH:-}"

OVERLAY_INSTALL_METHOD=""
OVERLAY_INSTALL_PATH=""
OVERLAY_EXECUTABLE_PATH=""

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

resolve_overlay_executable_path() {
  install_path="$1"

  if [ -n "$SUPERPLAN_OVERLAY_EXECUTABLE_RELATIVE_PATH" ] && [ -f "$install_path/$SUPERPLAN_OVERLAY_EXECUTABLE_RELATIVE_PATH" ]; then
    printf '%s\n' "$install_path/$SUPERPLAN_OVERLAY_EXECUTABLE_RELATIVE_PATH"
    return 0
  fi

  if [ -d "$install_path/Contents/MacOS" ]; then
    find "$install_path/Contents/MacOS" -type f | sort | head -n 1
    return 0
  fi

  if [ -f "$install_path" ]; then
    printf '%s\n' "$install_path"
    return 0
  fi

  find "$install_path" -maxdepth 2 -type f -perm -u+x 2>/dev/null | sort | head -n 1
}

install_overlay_companion() {
  if [ -z "$SUPERPLAN_OVERLAY_SOURCE_PATH" ]; then
    return 0
  fi

  [ -e "$SUPERPLAN_OVERLAY_SOURCE_PATH" ] || fail "SUPERPLAN_OVERLAY_SOURCE_PATH does not exist: $SUPERPLAN_OVERLAY_SOURCE_PATH"

  mkdir -p "$SUPERPLAN_OVERLAY_INSTALL_DIR"

  overlay_name="$(basename "$SUPERPLAN_OVERLAY_SOURCE_PATH")"
  OVERLAY_INSTALL_PATH="$SUPERPLAN_OVERLAY_INSTALL_DIR/$overlay_name"

  rm -rf "$OVERLAY_INSTALL_PATH"
  cp -R "$SUPERPLAN_OVERLAY_SOURCE_PATH" "$OVERLAY_INSTALL_PATH"

  OVERLAY_EXECUTABLE_PATH="$(resolve_overlay_executable_path "$OVERLAY_INSTALL_PATH")"
  [ -n "$OVERLAY_EXECUTABLE_PATH" ] || fail "failed to resolve overlay executable inside $OVERLAY_INSTALL_PATH"

  OVERLAY_INSTALL_METHOD="copied_prebuilt"
}

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

if [ -n "$SUPERPLAN_OVERLAY_SOURCE_PATH" ]; then
  say "Installing Superplan overlay companion"
  install_overlay_companion
fi

if [ ! -x "$INSTALL_BIN_DIR/superplan" ]; then
  fail "superplan binary was not installed to $INSTALL_BIN_DIR"
fi

INSTALL_STATE_DIR="${HOME}/.config/superplan"
INSTALL_STATE_PATH="$INSTALL_STATE_DIR/install.json"
INSTALL_METHOD="remote_repo"

if [ -n "$SUPERPLAN_SOURCE_DIR" ]; then
  INSTALL_METHOD="local_source"
fi

mkdir -p "$INSTALL_STATE_DIR"
node - "$INSTALL_STATE_PATH" "$INSTALL_METHOD" "$SUPERPLAN_REPO_URL" "$SUPERPLAN_REF" "$SUPERPLAN_INSTALL_PREFIX" "$INSTALL_PREFIX" "$INSTALL_BIN_DIR" "$SUPERPLAN_SOURCE_DIR" "$SUPERPLAN_OVERLAY_SOURCE_PATH" "$SUPERPLAN_OVERLAY_INSTALL_DIR" "$OVERLAY_INSTALL_METHOD" "$OVERLAY_INSTALL_PATH" "$OVERLAY_EXECUTABLE_PATH" "$SUPERPLAN_OVERLAY_EXECUTABLE_RELATIVE_PATH" <<'EOF'
const fs = require('node:fs');

const [
  installStatePath,
  installMethod,
  repoUrl,
  ref,
  requestedPrefix,
  installPrefix,
  installBinDir,
  sourceDir,
  overlaySourcePath,
  overlayInstallDir,
  overlayInstallMethod,
  overlayInstallPath,
  overlayExecutablePath,
  overlayExecutableRelativePath,
] = process.argv.slice(2);

const metadata = {
  install_method: installMethod,
  repo_url: repoUrl,
  ref,
  install_prefix: installPrefix,
  install_bin: installBinDir,
  installed_at: new Date().toISOString(),
};

if (requestedPrefix) {
  metadata.requested_install_prefix = requestedPrefix;
}

if (sourceDir) {
  metadata.source_dir = sourceDir;
}

if (overlayInstallMethod && overlayInstallPath) {
  metadata.overlay = {
    install_method: overlayInstallMethod,
    source_path: overlaySourcePath || undefined,
    install_dir: overlayInstallDir || undefined,
    install_path: overlayInstallPath,
    executable_path: overlayExecutablePath || undefined,
    executable_relative_path: overlayExecutableRelativePath || undefined,
    installed_at: new Date().toISOString(),
  };
}

fs.writeFileSync(installStatePath, JSON.stringify(metadata, null, 2));
EOF

say "Installed Superplan to $INSTALL_BIN_DIR/superplan"
if [ -n "$OVERLAY_INSTALL_PATH" ]; then
  say "Installed Superplan overlay to $OVERLAY_INSTALL_PATH"
fi
say "Run: superplan --version"
