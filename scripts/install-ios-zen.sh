#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IOS_DIR="$ROOT_DIR/mobile/ios"
DEVICE_NAME="${1:-Zen}"

echo "==> Building Goyo universal bundle..."
cd "$ROOT_DIR"
pnpm build

echo "==> Syncing bundle and offline audio library into iOS app..."
rm -rf "$IOS_DIR/Goyo/www"
cp -R "$ROOT_DIR/dist/public" "$IOS_DIR/Goyo/www"

echo "==> Generating 1024x1024 AppIcon..."
sips -z 1024 1024 "$ROOT_DIR/public/icons/icon-512.png" \
  --out "$IOS_DIR/Goyo/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png" >/dev/null

echo "==> Generating Xcode project via XcodeGen..."
cd "$IOS_DIR"
xcodegen generate

echo "==> Building signed iOS app for physical device ($DEVICE_NAME)..."
xcodebuild \
  -project "$IOS_DIR/Goyo.xcodeproj" \
  -scheme Goyo \
  -configuration Debug \
  -destination "generic/platform=iOS" \
  -derivedDataPath "$IOS_DIR/build" \
  -allowProvisioningUpdates \
  build

APP_PATH="$IOS_DIR/build/Build/Products/Debug-iphoneos/Goyo.app"

echo "==> Installing Goyo.app to $DEVICE_NAME..."
xcrun devicectl device install app --device "$DEVICE_NAME" "$APP_PATH"

echo "==> Launching Goyo on $DEVICE_NAME..."
xcrun devicectl device process launch --device "$DEVICE_NAME" net.bahbi.goyo || true

echo "==> Done! Goyo is installed on $DEVICE_NAME."
