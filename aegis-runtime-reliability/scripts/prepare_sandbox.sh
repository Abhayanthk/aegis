#!/usr/bin/env bash
set -Eeuo pipefail

# One-time, idempotent AEGIS setup. Run this before BASELINE.
# Usage: prepare_sandbox.sh <repository> <npm|pnpm|yarn>

repo_dir="${1:?repository path required}"
manager="${2:?package manager required}"
skill_dir="$(cd "$(dirname "$0")/.." && pwd)"
marker="$skill_dir/.aegis-prepared"

if ! command -v node >/dev/null 2>&1; then
  if [[ -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ]]; then
    # shellcheck disable=SC1090
    . "${NVM_DIR:-$HOME/.nvm}/nvm.sh"
    nvm install --lts >/dev/null
    nvm use --lts >/dev/null
  else
    echo "SETUP_FAILED: node is unavailable and nvm is unavailable; provision Node >=18 in the sandbox" >&2
    exit 127
  fi
fi

command -v npm >/dev/null 2>&1 || { echo "SETUP_FAILED: npm is unavailable after Node setup" >&2; exit 127; }
node_major="$(node -p 'process.versions.node.split(".")[0]')"
(( node_major >= 18 )) || { echo "SETUP_FAILED: Node >=18 required (found $(node --version))" >&2; exit 1; }

install_if_needed() {
  local dir="$1"; shift
  local lock="$1"; shift
  local deps="$dir/node_modules"
  local stamp="$dir/.aegis-lock.sha256"
  local digest="$(shasum -a 256 "$lock" | awk '{print $1}')"
  if [[ -d "$deps" && -f "$stamp" && "$(<"$stamp")" == "$digest" ]]; then
    echo "SKIP: dependencies already prepared in $dir"
    return
  fi
  (cd "$dir" && "$@")
  printf '%s' "$digest" > "$stamp"
  echo "INSTALLED: $dir"
}

install_if_needed "$skill_dir/scripts" "$skill_dir/scripts/package-lock.json" npm ci
case "$manager" in
  npm)  install_if_needed "$repo_dir" "$repo_dir/package-lock.json" npm ci ;;
  pnpm) install_if_needed "$repo_dir" "$repo_dir/pnpm-lock.yaml" pnpm install --frozen-lockfile ;;
  yarn) install_if_needed "$repo_dir" "$repo_dir/yarn.lock" yarn install --immutable ;;
  *) echo "SETUP_FAILED: unsupported package manager '$manager'" >&2; exit 2 ;;
esac

printf 'node=%s\nnpm=%s\nmanager=%s\n' "$(node --version)" "$(npm --version)" "$manager" > "$marker"
echo "PREPARED: $marker"
