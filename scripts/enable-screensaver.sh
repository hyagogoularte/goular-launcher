#!/usr/bin/env bash
# Troca o protetor de tela da Amazon pelo relógio do Goular (data e hora quicando nas bordas).
# Uso: FIRE_TV_IP=192.168.0.42 scripts/enable-screensaver.sh [--testar]
#   --testar  liga o protetor na hora, para conferir
# Desfazer: scripts/disable-screensaver.sh
source "$(dirname "$0")/_common.sh"
connect_tv
ensure_backup

if ! adb shell pm list packages "$PKG" | grep -q "package:$PKG\$"; then
  echo "✗ Goular não instalado. Rode antes: scripts/deploy.sh" >&2
  exit 1
fi

adb shell settings put secure screensaver_components "$SCREENSAVER"
adb shell settings put secure screensaver_enabled 1
echo "✓ Protetor de tela: relógio do Goular"
echo "  O tempo até ele aparecer continua na opção 'Protetor de tela' das Configurações do Fire TV."

if [[ "${1:-}" == "--testar" ]]; then
  # Somnambulator (SystemUI) inicia o protetor configurado imediatamente.
  adb shell am start -n com.android.systemui/.Somnambulator >/dev/null 2>&1 \
    && echo "▸ Protetor ligado agora. Aperte qualquer tecla do controle para sair." \
    || echo "  Não deu para ligar na hora; espere o tempo configurado sem mexer no controle."
fi
