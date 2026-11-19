---
name: tv-ui
description: Regras para criar ou alterar a interface do Goular Launcher (React em web/src) — layout 1920x1080 em rem, design tokens, foco por controle remoto (D-pad) com norigin-spatial-navigation e limites de desempenho do WebView do Fire TV Stick. Use para qualquer componente, tela, estilo ou ajuste visual neste projeto.
---

# TV UI — Goular Launcher

## Antes de codar
1. Abra `docs/reference/home-reference.webp` (ou a imagem nova que o usuário mandou).
2. Meça em pixels, converta para 1920×1080 e depois para rem (`px / 16`).
3. Valor novo e reutilizável (cor, raio, tamanho de fonte)? Crie um token em
   `web/src/styles/tokens.css`. Não espalhe cores literais pelos módulos.

## Layout
- Palco fixo 120rem × 67.5rem (`App.module.css`); 1rem = 16px a 1920 de largura.
- Só `rem`/tokens nos componentes. `px` apenas para bordas de 1–2px.
- CSS Modules (`Componente.module.css`) ao lado do `.tsx`.
- Sem `aspect-ratio` (WebView antigo): use o truque de `padding-bottom` (ver `AppTile.module.css`).

## Foco (D-pad + mouse)
- Todo elemento interativo usa `useTvFocusable` (`web/src/navigation/spatial.tsx`)
  com `focusKey` estável e descritivo (`fav-0-0`, `climate-<id>`, `tab-home`), ação em
  `onSelect` e `{...pointerProps}` espalhado no elemento. Assim OK do controle e
  clique do mouse fazem a mesma coisa, e passar o mouse por cima move o foco.
  Não use `useFocusable` direto nem `onClick` solto em itens.
- Agrupe linhas/grades em `FocusGroup` (`web/src/navigation/spatial.tsx`).
- Estado visual via classe `.focused` — nunca `:focus`/outline nativo.
- Padrão de foco:
  - Cores só por token (`--c-accent*`, `--c-tile-*`): elas mudam com o fundo
    (`[data-theme='smoke']` em `tokens.css`). Nunca escreva ciano/magenta direto.
  - controles (abas, cards, botões): `::after` com borda `--c-accent` + brilho,
    `transform: scale(1.03–1.08)`;
  - apps/conteúdo: borda `--c-tile-ring` + `--c-tile-glow`, `scale(var(--scale-tile-focus))`.
- Itens em áreas roláveis passam `scrollOnFocus: true` (rola só quando o foco vem do D-pad).
- Modo ponteiro (`navigation/pointer.ts`): liga com movimento real do mouse, desliga
  na primeira tecla; o cursor só aparece nesse modo.
- Botão voltar chega como evento `goular:back`; nunca deve "sair" do launcher.
- Teste no navegador: setas, Enter, Esc. Pressione as teclas com ~300ms de intervalo
  (o throttle da navegação descarta repetições mais rápidas que 90ms).

## Desempenho (Fire Stick)
- Anime só `transform` e `opacity`. Brilho = pseudo-elemento com `opacity`.
- Proibido: `backdrop-filter`, `filter: blur` em áreas grandes, animação de
  `box-shadow`/tamanho, `scroll-behavior: smooth`, timers de 1s para UI.
- Fundos e decorações estáticos (SVG/gradiente renderizados uma vez, `memo`).
- Dados externos: cache em `localStorage` (com try/catch) e mostre o último valor.

## Nativo
- Acesso a apps/sistema só via `web/src/services/native.ts`, sempre com fallback
  simulado para o navegador (o preview precisa funcionar sem o Fire Stick).

## Conferência final
1. `cd web && npx tsc --noEmit && npm test`
2. Preview (`.claude/launch.json` → "web") em 1600×900: screenshot e comparação com a referência.
3. Navegar por todos os elementos novos só com o teclado — e depois só com o mouse
   (hover foca, clique seleciona).
