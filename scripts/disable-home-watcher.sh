#!/usr/bin/env bash
# Desfaz enable-home-watcher.sh: o Fire TV volta a usar só a tela inicial da Amazon.
source "$(dirname "$0")/_common.sh"
connect_tv
current="$(adb shell settings get secure enabled_accessibility_services | tr -d '\r')"
next="$(tr ':' '\n' <<< "$current" | grep -vxF "$SERVICE" | paste -sd: - || true)"
if [[ -z "$next" ]]; then
  adb shell settings delete secure enabled_accessibility_services >/dev/null
else
  adb shell settings put secure enabled_accessibility_services "$next"
fi
echo "✓ HomeWatcher desativado"
