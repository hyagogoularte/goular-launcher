#!/usr/bin/env bash
# Lista os apps do Fire Stick e mostra em que grupo do Goular cada um cai.
# Uso: FIRE_TV_IP=192.168.0.42 scripts/list-apps.sh [--json] > apps.md
#   --json  imprime só os dados brutos (mesmo formato de getInstalledApps)
source "$(dirname "$0")/_common.sh"
connect_tv

shell() { adb shell "$@" | tr -d '\r'; }

# Pacotes que têm uma tela abrível pelo launcher (mesma consulta da ponte nativa).
launchable() {
  shell cmd package query-activities -a android.intent.action.MAIN -c "$1" \
    | grep -oE 'packageName=[A-Za-z0-9_.]+' | cut -d= -f2 | sort -u
}

TV_APPS="$(launchable android.intent.category.LEANBACK_LAUNCHER)"
PHONE_APPS="$(launchable android.intent.category.LAUNCHER)"
SYSTEM="$(shell pm list packages -s | cut -d: -f2 | sort -u)"
ALL_COUNT="$(shell pm list packages | wc -l | tr -d ' ')"
MODEL="$(shell getprop ro.product.model)"
FIREOS="$(shell getprop ro.build.version.name)"

json="$(
  {
    for p in $TV_APPS; do echo "$p tv"; done
    for p in $PHONE_APPS; do grep -qxF "$p" <<< "$TV_APPS" || echo "$p phone"; done
  } | while read -r pkg kind; do
    sys=false; grep -qxF "$pkg" <<< "$SYSTEM" && sys=true
    printf '{"packageName":"%s","label":"%s","isTvApp":%s,"system":%s}\n' \
      "$pkg" "$pkg" "$([[ $kind == tv ]] && echo true || echo false)" "$sys"
  done | paste -sd, - | sed 's/^/[/; s/$/]/'
)"

if [[ "${1:-}" == "--json" ]]; then
  echo "$json"
  exit 0
fi

echo "$json" | node "$ROOT/web/scripts/list-apps.ts" "$MODEL" "$FIREOS" "$ALL_COUNT"
