#!/usr/bin/env bash
# Fotografa o estado atual do Fire Stick num zip em backups/<aaaammdd>/<hhmm>/
# (dentro do projeto, fora do git: com APKs passa de 300 MB).
# Uso: FIRE_TV_IP=192.168.0.42 scripts/backup-device.sh [--apks]
#   --apks  inclui os APKs dos apps instalados por você (centenas de MB)
# Os scripts que mudam o aparelho chamam isto sozinhos na primeira vez (ensure_backup).
# O que entra e como restaurar: docs/04-firestick.md#backup-do-aparelho
source "$(dirname "$0")/_common.sh"
connect_tv

WITH_APKS=false
[[ "${1:-}" == "--apks" ]] && WITH_APKS=true

tv() { adb shell "$@" </dev/null | tr -d '\r'; }

SERIAL="$(tv getprop ro.serialno)"
MODEL="$(tv getprop ro.product.model)"
STAMP="$(date +%Y%m%d/%H%M)" # uma pasta por dia e, dentro, uma por horário
NAME="$MODEL-$SERIAL"
OUT="$ROOT/backups/$STAMP"
[[ -e "$OUT/$NAME.zip" ]] && { echo "✗ Já existe backups/$STAMP/$NAME.zip; espere um minuto" >&2; exit 1; }
DIR="$OUT/$NAME"
mkdir -p "$DIR"/{aparelho,pacotes,configuracoes,estado}
echo "▸ Backup de $MODEL em backups/$STAMP/$NAME.zip"

# Aparelho
tv getprop > "$DIR/aparelho/getprop.txt"
{
  echo "modelo: $MODEL"
  echo "fire_os: $(tv getprop ro.build.version.name)"
  echo "android: $(tv getprop ro.build.version.release) (SDK $(tv getprop ro.build.version.sdk))"
  echo "serial: $SERIAL"
  echo "data: $(date '+%Y-%m-%d %H:%M:%S %z')"
} > "$DIR/aparelho/resumo.txt"
tv df -h /data /system > "$DIR/aparelho/armazenamento.txt" 2>/dev/null || true

# Pacotes: todos, de fábrica, instalados, desativados, caminhos e versões
tv pm list packages -f -i -U | sort > "$DIR/pacotes/todos-com-apk-e-instalador.txt"
tv pm list packages -s | cut -d: -f2 | sort > "$DIR/pacotes/de-fabrica.txt"
tv pm list packages -3 | cut -d: -f2 | sort > "$DIR/pacotes/instalados.txt"
tv pm list packages -d | cut -d: -f2 | sort > "$DIR/pacotes/desativados.txt"
# roda no aparelho: uma ida e volta só, em vez de uma por pacote
tv 'for p in $(pm list packages | cut -d: -f2); do
  d=$(dumpsys package $p)
  v=$(echo "$d" | grep -m1 versionName= | sed "s/.*versionName=//")
  c=$(echo "$d" | grep -m1 versionCode= | sed "s/.*versionCode=\([0-9]*\).*/\1/")
  u=$(echo "$d" | grep -m1 lastUpdateTime= | sed "s/.*lastUpdateTime=//")
  echo "$p	$v	$c	$u"
done' | sort > "$DIR/pacotes/versoes.tsv"
"$ROOT/scripts/list-apps.sh" --json > "$DIR/pacotes/abriveis.json"

# Configurações do sistema (Android settings) e quem é a tela inicial
for ns in global secure system; do tv settings list "$ns" | sort > "$DIR/configuracoes/$ns.txt"; done
tv cmd package resolve-activity --brief -a android.intent.action.MAIN -c android.intent.category.HOME \
  > "$DIR/configuracoes/tela-inicial.txt"
tv settings get secure enabled_accessibility_services > "$DIR/configuracoes/acessibilidade.txt"

# O que está rodando agora
tv dumpsys activity activities | grep -E 'mResumedActivity|topResumedActivity|Hist #' \
  > "$DIR/estado/atividades.txt" || true
tv dumpsys activity recents | grep -E 'Recent #|realActivity' > "$DIR/estado/recentes.txt" || true
tv ps -A -o USER,PID,RSS,NAME > "$DIR/estado/processos.txt"

# APKs dos apps instalados por você (os de fábrica voltam com um reset)
if $WITH_APKS; then
  echo "▸ Copiando APKs"
  while read -r pkg; do
    paths="$(tv pm path "$pkg" | cut -d: -f2)"
    [[ -z "$paths" ]] && continue
    mkdir -p "$DIR/apks/$pkg"
    for p in $paths; do adb pull "$p" "$DIR/apks/$pkg/" </dev/null >/dev/null 2>&1 || echo "  ✗ não copiou $p" >&2; done
  done < "$DIR/pacotes/instalados.txt"
fi

cat > "$DIR/LEIA-ME.txt" <<EOF
Backup do Fire TV $MODEL feito pelo goular-launcher em $(date '+%Y-%m-%d %H:%M').

aparelho/       modelo, versão do Fire OS, propriedades, armazenamento
pacotes/        todos os pacotes, de fábrica, instalados, desativados, versões,
                apps abríveis (abriveis.json, formato de getInstalledApps)
configuracoes/  settings global/secure/system, tela inicial, acessibilidade
estado/         atividade em primeiro plano, recentes, processos
apks/           (só com --apks) APKs dos apps que você instalou

Não inclui dados nem logins dos apps: o Android não deixa copiá-los sem root.

Restaurar:
- um app:         adb install-multiple apks/<pacote>/*.apk
- acessibilidade: adb shell settings put secure enabled_accessibility_services "\$(cat configuracoes/acessibilidade.txt)"
- uma config:     adb shell settings put <global|secure|system> <chave> <valor>  (veja os .txt)
- tirar o Goular: scripts/disable-home-watcher.sh e adb uninstall com.goular.launcher
EOF

(cd "$OUT" && zip -qr "$NAME.zip" "$NAME" && rm -rf "$NAME")
echo "✓ backups/$STAMP/$NAME.zip ($(du -h "$OUT/$NAME.zip" | cut -f1))"
