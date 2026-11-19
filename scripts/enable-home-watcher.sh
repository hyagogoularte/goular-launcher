#!/usr/bin/env bash
# Ativa o serviço de acessibilidade que troca a tela inicial da Amazon pelo Goular.
# Preserva outros serviços de acessibilidade já ativos.
source "$(dirname "$0")/_common.sh"
connect_tv
ensure_backup
current="$(adb shell settings get secure enabled_accessibility_services | tr -d '\r')"
if [[ -z "$current" || "$current" == "null" ]]; then
  next="$SERVICE"
elif [[ ":$current:" == *":$SERVICE:"* ]]; then
  next="$current"
else
  next="$current:$SERVICE"
fi
adb shell settings put secure enabled_accessibility_services "$next"
adb shell settings put secure accessibility_enabled 1
echo "✓ HomeWatcher ativo. Aperte Home no controle para testar."
echo "  Diagnóstico: adb logcat -s GoularHome"
