#!/bin/bash

# GitHub-only release script (no npm publish)
# Usage: ./scripts/github-release.sh <package-name>

set -e

PACKAGE=$1

if [ -z "$PACKAGE" ]; then
  echo "Usage: ./scripts/github-release.sh <package-name>"
  echo "Example: ./scripts/github-release.sh foundry-tracing-foundations"
  exit 1
fi

cd "$PACKAGE"

# Get current version from package.json
VERSION=$(node -p "require('./package.json').version")

# Build
echo "📦 Building $PACKAGE v$VERSION..."
npm run lint
npm test
npm run build:npm

# Create tag if it doesn't exist
TAG="${PACKAGE}-v${VERSION}"
if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "⚠️  Tag $TAG already exists"
else
  echo "🏷️  Creating tag $TAG..."
  git tag -a "$TAG" -m "Release $PACKAGE v$VERSION"
  git push origin "$TAG"
fi

# Create GitHub release with built assets
echo "🚀 Creating GitHub release..."
gh release create "$TAG" \
  --title "$PACKAGE v$VERSION" \
  --generate-notes \
  --verify-tag \
  dist/* README.md LICENSE || echo "ℹ️  Release may already exist"

echo "✅ Created GitHub release for $PACKAGE v$VERSION!"
echo "📦 View at: https://github.com/doriansmiley/foundry-developer-foundations/releases/tag/$TAG"