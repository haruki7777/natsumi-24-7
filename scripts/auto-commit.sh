#!/usr/bin/env bash
set -euo pipefail

MESSAGE_PREFIX="${1:-auto-sync}"

cd "$(dirname "$0")/.."

if [[ ! -d .git ]]; then
  echo "This script must run inside a cloned Git repository." >&2
  exit 1
fi

BRANCH="$(git branch --show-current)"
if [[ -z "$BRANCH" ]]; then
  echo "Could not resolve the current Git branch." >&2
  exit 1
fi

git add -A

if [[ -z "$(git status --porcelain)" ]]; then
  echo "No changes to commit."
  exit 0
fi

if git status --porcelain | grep -E '\.env($|\.|/)' >/dev/null; then
  echo "Refusing to auto-commit .env files. Check .gitignore and remove secrets from the working tree." >&2
  exit 1
fi

git commit -m "$MESSAGE_PREFIX: $(date -Iseconds)"
git pull --rebase origin "$BRANCH"
git push origin "$BRANCH"
