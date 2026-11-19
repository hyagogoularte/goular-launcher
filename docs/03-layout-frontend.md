# Reproduzindo o layout com frontend

Referência: [reference/home-reference.webp](reference/home-reference.webp).

## 1. Decompor a imagem em grade e tokens

A imagem foi medida em pixels e convertida para uma tela de 1920×1080
(fator 1920 / 1672 ≈ 1,15). Daí saem os tokens em `web/src/styles/tokens.css`:

| Elemento | Medida (1920×1080) | Token / regra |
|---|---|---|
| Margem lateral | ~80 px | `--page-x: 5rem` |
| Saudação | ~44 px, bold | `--fs-display: 2.75rem` |
| Relógio | ~68 px, bold, números tabulares | `--fs-clock: 4.25rem` |
| Abas | 72 px de altura, pílula | `height: 4.5rem; --radius-pill` |
| Cards de ar | 4 colunas, ~166 px de altura, gap 24 px | `flex: 1`, `gap: 1.5rem` |
| Tiles de apps | 6 colunas, proporção 1,9:1 (banner 16:9 com `cover`), gap 24 px | `grid-template-columns: repeat(6, 1fr)` |
| Cor do foco | smoke: prata `#D7DDEB` com halo cinza-azulado; classic: ciano `#2EE6F2` | `--c-accent`, `--c-accent-glow`, `--c-accent-haze` |
| Brilho dos apps | smoke: fumaça; classic: magenta | `--c-tile-ring`, `--c-tile-glow`, `--c-tile-haze` |
| Verde "ligado" | `#4ADE80` | `--c-power-on` |

Hierarquia vertical: Header → 3,25rem → Abas → 2,5rem → "Casa" → cards → 2,5rem →
"Entretenimento" → tiles → 2,5rem → "Streaming" → tiles. Os blocos ficam juntos para
os três caberem em 1080 sem rolar (último tile termina em ~1024px).

## 2. Uma escala só: `rem` atrelado à largura

```css
html { font-size: min(calc(100vw / 120), calc(100vh / 67.5)); }
```

1rem = 16 px numa tela de 1920 px. O Fire Stick 1080p costuma expor o WebView como
960×540 CSS px (densidade 2×); o mesmo CSS escala sozinho. **Regra:** nos componentes,
só `rem` ou tokens — nunca `px` fixo (exceto bordas de 1–2 px).

## 3. Componentes

| Na imagem | Componente |
|---|---|
| "Boa noite, patrão." + sublinhado | `Header` (saudação muda com a hora) |
| Clima de Florianópolis (cidades em `config.cities`) | `Header › WeatherBlock` + `WeatherIcon` (SVG próprio) |
| 23:23 / Terça, 17 de Nov. | `Header` + `useNow` (atualiza na virada do minuto) |
| Engrenagem | `Header › SettingsButton` → configurações do Fire TV |
| Início / Todos os aplicativos | `NavTabs` |
| Casa | `SectionTitle` + `ClimateCard` × 4 |
| Entretenimento / Streaming | `SectionTitle` + `AppTile` (6 por fileira), de `config.homeRows` |
| Fundo com ondas | `Background` (gradientes + SVG estático). `config.background`: `smoke` (padrão: quase preto, ondas em tom de fumaça) ou `classic` (azul → roxo da referência) |

## 4. Foco e navegação por controle remoto

- Lib: `@noriginmedia/norigin-spatial-navigation`. Cada item usa `useTvFocusable`
  (`navigation/spatial.tsx`), que embrulha o `useFocusable` da lib e devolve
  `focused` + `pointerProps`; linhas são `FocusGroup` com `saveLastFocusedChild`
  (subir e descer volta ao último item da linha).
- **Mouse** (USB/Bluetooth no Fire TV, apps como Mouse Toggle, ou o navegador):
  o foco é um só. Passar o mouse sobre um item move o foco para ele; clicar
  equivale ao OK; a roda rola "Todos os aplicativos". O modo ponteiro
  (`navigation/pointer.ts`) liga com movimento real do mouse e desliga na primeira
  tecla — assim a grade rolando sob um cursor parado não rouba o foco do D-pad, e o
  cursor some enquanto se usa o controle.
- Foco inicial: primeiro app do Entretenimento (`fav-0-0`; os tiles do Início são
  `fav-<bloco>-<posição>`). Voltar: na grade de apps volta ao Início; no Início, leva o
  foco ao Entretenimento. **Voltar nunca fecha o launcher.**
- No navegador: setas = D-pad, Enter = OK, Esc/Backspace = voltar; mouse funciona como descrito acima.
- Visual do foco:
  - abas, cards e engrenagem → borda `--c-accent` + brilho, `scale(1.03–1.08)`;
  - apps → borda `--c-tile-ring` + brilho `--c-tile-glow`, `scale(1.08)`.
  - As cores seguem o fundo: no `smoke` (padrão) prata e fumaça, no `classic` ciano e
    magenta (`[data-theme]` em `tokens.css`).

## 5. Desempenho no Fire Stick

A GPU do Fire Stick é modesta; o que custa caro no WebView:

| Evite | Use |
|---|---|
| `backdrop-filter: blur()` (vidro fosco) | fundo `rgba` semitransparente + gradiente sutil |
| animar `box-shadow`, `border`, `width` | brilho num `::after` e animar só `opacity`; zoom com `transform` |
| `filter: blur()` no fundo | linhas sobrepostas com opacidades diferentes (fundo é rasterizado uma vez) |
| re-render a cada segundo | relógio atualiza na virada do minuto |
| `scroll-behavior: smooth` | `scrollIntoView({ block: 'nearest' })` sem animação |
| imagens gigantes | banners 320×180 cacheados no nativo |

Para medir: com o APK de debug, abra `chrome://inspect` no Chrome do Mac →
*inspect* → aba Performance → grave enquanto navega.

O build gera JS para Chromium 87+ (`build.target` em `vite.config.ts`) e evita
`aspect-ratio`, por compatibilidade com WebViews antigos do Fire OS 7.

## 6. Usando skills do Claude Code no frontend

- **Skill do projeto `tv-ui`** (`.claude/skills/tv-ui/SKILL.md`): regras deste
  launcher (tokens, foco, desempenho, como criar um componente novo). O Claude Code a
  carrega sozinho quando você pede algo de UI aqui; você também pode chamar `/tv-ui`.
- **Plugin `frontend-design`** (Anthropic): direção visual e acabamento de
  componentes. Instale pelo catálogo de plugins e peça, por exemplo:
  *"use frontend-design + tv-ui para criar o diálogo de temperatura do ar"*.
- **`design:design-handoff`**: gera uma ficha de specs (medidas, estados, tokens) a
  partir de uma imagem — útil para novas telas antes de codar.
- **`design:design-critique`**: compare um screenshot da TV com a referência e peça
  a lista de diferenças.
- **Navegador embutido do Claude Code**: com `npm run dev` rodando
  (`.claude/launch.json` → "web"), o Claude abre o preview, navega com as setas e tira
  screenshots para conferir contra a referência.

Fluxo recomendado para uma tela nova: imagem → `design-handoff` (specs) → tokens
novos em `tokens.css` → componentes seguindo `tv-ui` → preview no navegador →
`design-critique` contra a imagem → `scripts/dev-tv.sh` para ver na TV.
