# Funções compartilhadas pelos scripts. Não execute diretamente.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PKG="com.goular.launcher"
SERVICE="$PKG/$PKG.HomeWatcherService"

# Gradle 8.11 não roda em JDK 25: usa o JDK 21 do Android Studio ou o do Homebrew.
if [[ -z "${JAVA_HOME:-}" ]]; then
  for jdk in "/Applications/Android Studio.app/Contents/jbr/Contents/Home" \
             "/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home"; do
    [[ -d "$jdk" ]] && { export JAVA_HOME="$jdk"; break; }
  done
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

# Antes da primeira mudança num aparelho, guarda um backup dele em backups/.
# Pule com SKIP_BACKUP=1.
ensure_backup() {
  [[ "${SKIP_BACKUP:-}" == 1 ]] && return 0
  local serial
  serial="$(adb shell getprop ro.serialno | tr -d '\r')"
  if ! compgen -G "$ROOT/backups/*/*/*-$serial.zip" >/dev/null; then
    echo "▸ Primeira vez neste aparelho: fazendo backup antes de mudar algo"
    "$ROOT/scripts/backup-device.sh"
  fi
}

# Protetor de tela do Goular e o original da Amazon (valor do backup de 19/11/2026).
SCREENSAVER="$PKG/$PKG.ClockDreamService"
AMAZON_SCREENSAVER="com.amazon.ftv.screensaver/.app.services.ScreensaverService"
