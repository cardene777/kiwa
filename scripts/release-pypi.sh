#!/usr/bin/env bash
# release-pypi.sh — local PyPI publish flow for kiwa-test-py.
#
# CI is intentionally disabled for kiwa, so this script is the canonical path:
#   1. Build sdist + wheel under kiwa-py/dist/
#   2. Run `twine check` to validate metadata + long_description rendering
#   3. Upload to TestPyPI first (smoke), then to real PyPI on --prod
#
# Requirements (one-off):
#   pip install --user build twine
#
# Usage:
#   bash scripts/release-pypi.sh             # build + twine check only
#   bash scripts/release-pypi.sh --testpypi  # build + upload to TestPyPI
#   bash scripts/release-pypi.sh --prod      # build + upload to real PyPI
#
# Auth:
#   Stored in ~/.pypirc (testpypi / pypi sections) OR
#   exported as TWINE_USERNAME=__token__ TWINE_PASSWORD=pypi-<token>

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PKG_DIR="${REPO_ROOT}/kiwa-py"
DIST_DIR="${PKG_DIR}/dist"

MODE="${1:-check}"

if [[ ! -d "${PKG_DIR}" ]]; then
  echo "release-pypi: ${PKG_DIR} not found" >&2
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "release-pypi: python3 not on PATH" >&2
  exit 1
fi

cd "${PKG_DIR}"

# 1. Clean previous dist/.
rm -rf "${DIST_DIR}"

# 2. Build sdist + wheel.
echo "▶ building sdist + wheel..."
python3 -m build --sdist --wheel --outdir "${DIST_DIR}"

# 3. Validate metadata + long_description.
echo "▶ twine check..."
python3 -m twine check "${DIST_DIR}"/*

case "${MODE}" in
  check)
    echo "✓ build + check only (no upload). Run with --testpypi or --prod to publish."
    ;;
  --testpypi)
    echo "▶ uploading to TestPyPI..."
    python3 -m twine upload --repository testpypi "${DIST_DIR}"/*
    echo "✓ uploaded to TestPyPI. Verify with: pip install --index-url https://test.pypi.org/simple/ kiwa-test-py"
    ;;
  --prod)
    echo "▶ uploading to real PyPI..."
    read -r -p "kiwa-test-py を本番 PyPI に push します。 続行? [y/N] " confirm
    if [[ "${confirm}" != "y" && "${confirm}" != "Y" ]]; then
      echo "✗ aborted"
      exit 1
    fi
    python3 -m twine upload "${DIST_DIR}"/*
    echo "✓ uploaded to PyPI: https://pypi.org/project/kiwa-test-py/"
    ;;
  *)
    echo "release-pypi: unknown mode '${MODE}'" >&2
    echo "Usage: $0 [check|--testpypi|--prod]" >&2
    exit 1
    ;;
esac
