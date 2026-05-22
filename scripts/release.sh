#!/usr/bin/env bash
#
# Open a release PR for the Postcrate app.
#
#   ./scripts/release.sh 0.2.0
#
# What it does:
#   1. Verifies you are on the `dev` branch with a clean working tree.
#   2. Pulls latest `dev`.
#   3. Bumps version in package.json and src-tauri/Cargo.toml.
#      (tauri.conf.json reads its version from package.json automatically.)
#   4. Runs `pnpm tsc --noEmit` and `cargo check` to confirm the bump compiles.
#   5. Commits as "release: vX.Y.Z" and pushes `dev`.
#   6. Opens a PR `dev` -> `main`.
#
# After merging the PR, the Release workflow on `main` builds bundles for
# macOS (universal), Windows, and Linux in parallel, signs each with the
# Tauri updater key, and creates the GitHub release with the bundles and
# `latest.json` (the updater manifest). Build takes ~15-25 minutes.
#
# Requires: jq, pnpm, cargo, node, gh CLI authenticated.

set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <version>" >&2
  echo "Example: $0 0.2.0" >&2
  exit 1
fi

VERSION="$1"

if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[A-Za-z0-9.-]+)?$ ]]; then
  echo "Error: '$VERSION' is not valid semver (e.g. 0.2.0, 1.0.0-beta.1)" >&2
  exit 1
fi

for cmd in jq gh pnpm cargo node; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Error: '$cmd' not found in PATH." >&2
    exit 1
  fi
done

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$CURRENT_BRANCH" != "dev" ]]; then
  echo "Error: must be on the 'dev' branch (currently on '$CURRENT_BRANCH')." >&2
  echo "Switch with: git checkout dev" >&2
  exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Error: working tree has uncommitted changes. Commit or stash first." >&2
  exit 1
fi

echo "==> Pulling latest dev"
git pull --ff-only

echo "==> Bumping version to $VERSION"

# package.json
node -e "
  const fs = require('fs');
  const p = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  p.version = '$VERSION';
  fs.writeFileSync('./package.json', JSON.stringify(p, null, 2) + '\n');
"

# src-tauri/Cargo.toml — scope to the [package] section's version line only
sed -i.bak -E "/^\[package\]/,/^\[/ s/^version = \"[^\"]+\"/version = \"$VERSION\"/" src-tauri/Cargo.toml
rm src-tauri/Cargo.toml.bak

echo "==> Verifying"
pnpm tsc --noEmit
( cd src-tauri && cargo check --quiet )

echo "==> Committing and pushing"
git add package.json src-tauri/Cargo.toml
[ -f src-tauri/Cargo.lock ] && git add src-tauri/Cargo.lock || true
git commit -m "release: v$VERSION"
git push origin dev

echo "==> Opening release PR"
PR_URL=$(gh pr create \
  --base main \
  --head dev \
  --title "release: v$VERSION" \
  --body "Bumps Postcrate to \`v$VERSION\`.

After merge, the Release workflow on \`main\` will:
1. Build bundles for macOS (universal), Windows, and Linux in parallel.
2. Sign each bundle with the Tauri updater key.
3. Publish the GitHub release with bundles and \`latest.json\`.

Build takes about 15-25 minutes.")

echo ""
echo "Release PR opened: $PR_URL"
echo "Review and merge. The Release workflow on main will build + publish."
