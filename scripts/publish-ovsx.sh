#!/bin/sh

set -eu

SERVICE_NAME="wtf-commit.ovsx"
VSIX_FILE="wtf-commit-${npm_package_version}.vsix"

get_pat() {
  if [ -n "${OVSX_PAT:-}" ]; then
    printf '%s' "$OVSX_PAT"
    return 0
  fi

  if [ "$(uname -s)" = "Darwin" ] && command -v security >/dev/null 2>&1; then
    security find-generic-password -a "${USER}" -s "${SERVICE_NAME}" -w 2>/dev/null || true
    return 0
  fi

  printf ''
}

PAT="$(get_pat)"

if [ -z "$PAT" ]; then
  echo "Open VSX token not found." >&2
  echo "Set OVSX_PAT or save it in macOS Keychain with service '${SERVICE_NAME}'." >&2
  exit 1
fi

exec pnpm exec ovsx publish "$VSIX_FILE" --pat "$PAT"
