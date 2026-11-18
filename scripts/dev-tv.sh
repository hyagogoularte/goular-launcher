#!/usr/bin/env bash
# Live reload na TV: instala um APK de debug que carrega a UI do Vite rodando no Mac.
# Uso: FIRE_TV_IP=192.168.0.42 scripts/dev-tv.sh   (deixe `npm run dev` rodando em web/)
source "$(dirname "$0")/_common.sh"
MAC_IP="${MAC_IP:-$(ipconfig getifaddr en0 || ipconfig getifaddr en1)}"
URL="http://$MAC_IP:5173"
echo "▸ APK de debug apontando para $URL"
(cd "$ROOT/android" && ./gradlew installDebug -PdevServer="$URL")
connect_tv
adb shell am start -n "$PKG/.MainActivity"
echo "✓ Edite web/src e a TV recarrega. Depurar: chrome://inspect no Chrome do Mac"
