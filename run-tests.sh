#!/bin/bash
# VaultObscura / VTVault — Full Test Suite Runner
# Usage: ./run-tests.sh [your-vercel-url]
# Example: ./run-tests.sh https://vtvault-v2-jakob25s-projects.vercel.app

set -e

URL=${1:-"https://vtvault-v2-jakob25s-projects.vercel.app"}

echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║          VaultObscura Full Test Suite                 ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
echo "  Testing against: $URL"
echo ""

# Install deps if needed
if ! npx playwright --version > /dev/null 2>&1; then
  echo "Installing Playwright..."
  npx playwright install --with-deps chromium
fi

# Run tests
export TEST_URL=$URL

echo "Running tests..."
echo ""

npx playwright test \
  --reporter=list \
  tests/api.spec.ts \
  tests/pages.spec.ts \
  tests/auth.spec.ts \
  tests/discovery.spec.ts \
  tests/security.spec.ts \
  tests/mobile.spec.ts \
  2>&1

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
  echo "✅  All tests passed"
else
  echo "❌  Some tests failed — check playwright-report/index.html for details"
  echo "    Open with: npx playwright show-report"
fi

echo ""
exit $EXIT_CODE
