#!/usr/bin/env bash
set -e

APP_NAME="VMT Invoice App (Alpha)"
ARCH="$(uname -m)"
RELEASE_DIR="release"
ZIP_NAME="VMT-Invoice-App-Alpha-macos-${ARCH}.zip"

BUNDLE_PATH="apps/desktop/src-tauri/target/release/bundle/macos"
APP_PATH="$BUNDLE_PATH/$APP_NAME.app"

mkdir -p "$RELEASE_DIR"

echo "▶ Fixing permissions"
chmod +x "$APP_PATH/Contents/MacOS/"*

echo "▶ Clearing extended attributes"
xattr -cr "$APP_PATH"

echo "▶ Ad-hoc code signing (.app)"
codesign --force --deep --sign - "$APP_PATH"

echo "▶ Verifying code signature"
codesign --verify --deep --strict "$APP_PATH"

echo "▶ Creating ZIP"
rm -f "$RELEASE_DIR/$ZIP_NAME"
ditto -c -k --sequesterRsrc --keepParent \
  "$APP_PATH" \
  "$RELEASE_DIR/$ZIP_NAME"

echo "✅ macOS alpha release ready:"
echo "📦 $RELEASE_DIR/$ZIP_NAME"
