#!/usr/bin/env bash
# Desfaz enable-screensaver.sh: volta o protetor de tela da Amazon.
source "$(dirname "$0")/_common.sh"
connect_tv
ensure_backup
adb shell settings put secure screensaver_components "$AMAZON_SCREENSAVER"
echo "✓ Protetor de tela da Amazon restaurado"
