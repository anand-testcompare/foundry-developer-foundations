#!/bin/bash

# Release script for publishing to npm and creating GitHub releases
# Usage: ./scripts/release.sh <package-name> <version>

set -e

PACKAGE=$1
VERSION=$2

if [ -z "$PACKAGE" ] || [ -z "$VERSION" ]; then
  echo "Usage: ./scripts/release.sh <package-name> <version>"
  echo "Example: ./scripts/release.sh foundry-tracing-foundations 1.2.4"
  exit 1
fi

cd "$PACKAGE"

# Update version
npm version "$VERSION" --no-git-tag-version

# Build and test
npm run lint
npm test
npm run build:npm

# Commit version bump
git add package.json package-lock.json
git commit -m "chore: bump $PACKAGE to v$VERSION"

# Create tag
TAG="${PACKAGE}-v${VERSION}"
git tag -a "$TAG" -m "Release $PACKAGE v$VERSION"

# Push changes
git push origin main
git push origin "$TAG"

# Publish to npm (commented out - not package owner)
# npm publish --access public
echo "⚠️  Skipping npm publish (not package owner)"

# Create GitHub release with assets
gh release create "$TAG" \
  --title "$PACKAGE v$VERSION" \
  --generate-notes \
  dist/* README.md LICENSE

echo "✅ Released $PACKAGE v$VERSION to GitHub!"
echo "📦 Note: npm publish skipped (not package owner)"