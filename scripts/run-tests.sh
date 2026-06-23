#!/bin/bash
# ObscuraVT — Full Playwright test suite
# Usage: ./scripts/run-tests.sh [base-url]
# Example: ./scripts/run-tests.sh https://obscuravt-git-staging-jakob25s-projects.vercel.app

set -e

URL=${1:-"https://obscuravt-git-staging-jakob25s-projects.vercel.app"}

echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║          ObscuraVT Playwright Test Suite              ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
echo "  Testing against: $URL"
echo ""

if ! npx playwright --version > /dev/null 2>&1; then
  echo "Installing Playwright browsers..."
  npx playwright install --with-deps chromium
fi

export PLAYWRIGHT_BASE_URL=$URL

echo "Running tests..."
echo ""

npx playwright test \
  --reporter=list \
  tests/pages.spec.ts \
  tests/api.spec.ts \
  tests/discovery.spec.ts \
  tests/security.spec.ts \
  tests/mobile.spec.ts \
  2>&1

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
  echo "All tests passed"
else
  echo "Some tests failed — run: npx playwright show-report"
fi

echo ""
exit $EXIT_CODE