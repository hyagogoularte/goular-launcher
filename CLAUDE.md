# goular-launcher

Launcher pessoal para Fire TV Stick. UI React/Vite/TS em `web/`, exibida num WebView
pela casca Kotlin em `android/`. Documentação em `docs/` (português).

## Comandos
- `cd web && npm run dev` — preview (launch config "web" em `.claude/launch.json`)
- `cd web && npm test` / `npx tsc --noEmit` — sempre rodar após mudanças em `web/`
- `cd web && npm run build` — saída vai para `android/app/src/main/assets/www` (gitignored)
- Android: não há SDK neste Mac até o usuário seguir `docs/02-ambiente.md`; não
  tente `./gradlew` sem verificar que `android/gradlew` existe.

## Regras
- Qualquer trabalho de UI: siga a skill `.claude/skills/tv-ui/SKILL.md`.
- Referência visual: `docs/reference/home-reference.webp`. Compare screenshots do
  preview (1600×900 ou 1920×1080) com ela.
- Textos da interface e da documentação em português do Brasil.
- Não adicione logos/imagens de marcas ao repositório: tiles usam o banner do app
  instalado (nativo) ou o fallback de texto em `config.ts`.
- Segredos só em `web/.env.local`.
- Ao mudar a ponte nativa, atualize juntos: `LauncherBridge.kt`,
  `web/src/services/native.ts` e a tabela em `docs/05-integracoes.md`.
