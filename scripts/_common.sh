# Funções compartilhadas pelos scripts. Não execute diretamente.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PKG="com.goular.launcher"
SERVICE="$PKG/$PKG.HomeWatcherService"

# Gradle 8.11 não roda em JDK 25: usa o JDK 21 que vem com o Android Studio.
if [[ -z "${JAVA_HOME:-}" && -d "/Applications/Android Studio.app/Contents/jbr/Contents/Home" ]]; then
  export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
fi
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export PATH="$ANDROID_HOME/platform-tools:$PATH"

require() {
  command -v "$1" >/dev/null 2>&1 || { echo "✗ '$1' não encontrado. Veja docs/02-ambiente.md" >&2; exit 1; }
}

# Conecta ao Fire Stick se FIRE_TV_IP estiver definido (ex.: FIRE_TV_IP=192.168.0.42)
connect_tv() {
  require adb
  if [[ -n "${FIRE_TV_IP:-}" ]]; then
    adb connect "$FIRE_TV_IP:5555" >/dev/null
  fi
  if ! adb get-state >/dev/null 2>&1; then
    echo "✗ Nenhum Fire TV conectado. Rode: FIRE_TV_IP=<ip> $0" >&2
    exit 1
  fi
}
