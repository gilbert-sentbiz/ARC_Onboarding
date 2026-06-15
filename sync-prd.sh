#!/bin/zsh
# PRD 로컬 → GitHub 싱크
SRC="$HOME/Desktop/ARC_Onboarding/arc-client-portal-spec.md"
DEST="$(dirname "$0")/docs/arc-client-portal-spec.md"

cp "$SRC" "$DEST" && echo "✓ PRD copied"

cd "$(dirname "$0")"
git add docs/arc-client-portal-spec.md
git diff --cached --quiet && echo "✓ No changes" && exit 0
git commit -m "docs: sync PRD" && git push && echo "✓ Pushed to GitHub"
