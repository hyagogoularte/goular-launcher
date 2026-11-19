#!/usr/bin/env bash
# Copia do Fire TV o banner e o ícone oficiais de cada app abrível para web/.dev-art/
# (fora do git), para o preview no navegador mostrar as mesmas artes da TV.
# Na TV o Goular lê as artes direto dos apps instalados; isto é só para desenvolvimento.
# Ícones em XML (vetor, adaptativo) viram SVG; app sem ícone recebe o ícone padrão do
# Android, como na TV.
# Uso: FIRE_TV_IP=192.168.0.42 scripts/pull-app-art.sh
source "$(dirname "$0")/_common.sh"
connect_tv
require python3

OUT="$ROOT/web/.dev-art"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$OUT/banner" "$OUT/icon"

shell() { adb shell "$@" </dev/null | tr -d '\r'; }

# "pacote icone banner" de cada app abrível: primeiro o da activity, senão o do app
# (mesma regra do Android ao desenhar o banner/ícone de um atalho).
art_ids() {
  for cat in LEANBACK_LAUNCHER LAUNCHER; do
    shell cmd package query-activities -a android.intent.action.MAIN -c "android.intent.category.$cat"
  done | awk '
    # A linha de ícone da activity some quando ela não tem rótulo/ícone próprios.
    /^ *ActivityInfo:/   { level = "act"; aic = "0x0"; abn = "0x0" }
    /^ *ApplicationInfo:/ { level = "app" }
    /packageName=/ && level == "act" { sub(/.*packageName=/, ""); pkg = $1 }
    / icon=0x/ {
      ic = "0x0"; bn = "0x0"
      for (i = 1; i <= NF; i++) {
        if ($i ~ /^icon=/) ic = substr($i, 6)
        if ($i ~ /^banner=/) bn = substr($i, 8)
      }
      if (level == "act") { aic = ic; abn = bn }
      else if (!(pkg in seen)) {
        seen[pkg] = 1
        print pkg, (aic != "0x0" ? aic : ic), (abn != "0x0" ? abn : bn)
      }
    }'
}

# Ícone padrão do Android (android.R.drawable.sym_def_app_icon), para apps sem ícone.
FRAMEWORK="$TMP/framework-res.apk"
DEFAULT_ICON=0x01080093
adb pull /system/framework/framework-res.apk "$FRAMEWORK" </dev/null >/dev/null 2>&1 || FRAMEWORK=""

ok=0; sem=()
while read -r pkg icon banner; do
  rm -f "$OUT/banner/$pkg".* "$OUT/icon/$pkg".*
  apks=()
  for path in $(shell pm path "$pkg" | cut -d: -f2); do
    local_apk="$TMP/$pkg-$(basename "$path")"
    adb pull "$path" "$local_apk" </dev/null >/dev/null 2>&1 || echo "  ✗ não consegui copiar $path" >&2
    apks+=("$local_apk")
  done
  got=""
  for kind in banner icon; do
    id="$([[ $kind == banner ]] && echo "$banner" || echo "$icon")"
    from=("${apks[@]}")
    if [[ "$id" == 0x0 ]]; then
      [[ $kind == icon && -n "$FRAMEWORK" ]] || continue
      id=$DEFAULT_ICON; from=("$FRAMEWORK")
    fi
    if python3 -I "$ROOT/scripts/lib/apk_art.py" "$id" "$OUT/$kind/$pkg" "${from[@]}" >/dev/null; then
      got+="$kind "
      if [[ $id == "$DEFAULT_ICON" ]]; then got+="(padrão do Android) "; fi
    fi
  done
  rm -f "${apks[@]}"
  if [[ -n "$got" ]]; then
    ok=$((ok + 1)); printf '  ✓ %-40s %s\n' "$pkg" "$got"
  else
    sem+=("$pkg")
  fi
done < <(art_ids)

echo "▸ $ok apps com arte em web/.dev-art/"
if ((${#sem[@]})); then
  echo "▸ Sem banner nem ícone (ficam com o texto do catálogo): ${sem[*]}"
fi
