#!/usr/bin/env bash
set -e

echo "🚀 Running Tauri build"
bun run tauri:build:desktop

echo "📦 Running macOS release packaging"
bash scripts/release-macos.sh
