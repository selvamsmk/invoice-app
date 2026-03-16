#!/usr/bin/env bash
set -e

APP_NAME="VMT Invoice App"
VERSION="1.0.0"

ARCH="$(uname -m)"
RELEASE_DIR="release"

ZIP_NAME="vmt-invoice-app-${VERSION}-macos-${ARCH}.zip"

BUNDLE_PATH="apps/desktop/src-tauri/target/release/bundle/macos"
APP_PATH="$BUNDLE_PATH/$APP_NAME.app"

mkdir -p "$RELEASE_DIR"

echo "▶ Fixing permissions"
chmod +x "$APP_PATH/Contents/MacOS/"*

echo "▶ Clearing extended attributes"
xattr -cr "$APP_PATH"

echo "▶ Ad-hoc code signing"
codesign --force --deep --sign - "$APP_PATH"

echo "▶ Verifying signature"
codesign --verify --deep --strict "$APP_PATH"

echo "▶ Creating distributable ZIP"
rm -f "$RELEASE_DIR/$ZIP_NAME"

ditto -c -k --sequesterRsrc --keepParent \
  "$APP_PATH" \
  "$RELEASE_DIR/$ZIP_NAME"

echo ""
echo "✅ Release created"
echo "📦 $RELEASE_DIR/$ZIP_NAME"