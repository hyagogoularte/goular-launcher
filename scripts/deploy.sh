#!/usr/bin/env bash
# Compila a UI web + APK e instala no Fire Stick.
# Uso: FIRE_TV_IP=192.168.0.42 scripts/deploy.sh [debug|release]
source "$(dirname "$0")/_common.sh"
VARIANT="${1:-debug}"
TASK="assemble$(tr '[:lower:]' '[:upper:]' <<< "${VARIANT:0:1}")${VARIANT:1}"
connect_tv
ensure_backup

echo "▸ UI web"
(cd "$ROOT/web" && npm run build)

echo "▸ APK ($VARIANT)"
[[ -x "$ROOT/android/gradlew" ]] || { echo "✗ android/gradlew ausente. Veja docs/02-ambiente.md (passo do Gradle wrapper)" >&2; exit 1; }
(cd "$ROOT/android" && ./gradlew "$TASK")
APK="$ROOT/android/app/build/outputs/apk/$VARIANT/app-$VARIANT.apk"

echo "▸ Instalando"
connect_tv
adb install -r "$APK"
adb shell am start -n "$PKG/.MainActivity"
echo "✓ Goular Launcher instalado e aberto"
