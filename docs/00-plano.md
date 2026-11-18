# Plano de implementação

Objetivo: substituir a tela inicial do Fire TV Stick por um launcher próprio, fiel à
[imagem de referência](reference/home-reference.webp): saudação, clima de duas cidades,
relógio, controle dos ar-condicionados da casa e atalhos para os apps favoritos.

## Decisão principal: UI web + casca Android fina

| Opção | Prós | Contras | Veredito |
|---|---|---|---|
| **React (Vite) dentro de um WebView Android** | Usa conhecimento de frontend; recarrega ao vivo na TV; preview no navegador do Mac; CSS reproduz o visual com fidelidade | WebView é mais pesado que UI nativa; exige cuidado com efeitos caros | **Escolhida** |
| Kotlin + Jetpack Compose for TV | Melhor desempenho; acesso direto às APIs | Curva de aprendizado; sem preview no navegador; iteração visual mais lenta | Plano B se o WebView ficar lento no seu modelo |
| React Native for TV | Nativo + React | Toolchain pesada, mais uma camada de bugs | Não compensa para uma tela |

A casca Android (≈300 linhas de Kotlin) faz só o que o navegador não pode: listar e
abrir apps, entregar banners dos apps, capturar o botão voltar e "sequestrar" o botão
Home. Toda a interface é web — então a pergunta "como reproduzo o layout com frontend"
vira simplesmente "como faço uma página 1920×1080 navegável por setas".

> ⚠️ **Confira o modelo do seu Fire Stick.** Os modelos com **Vega OS** (ex.: Fire TV
> Stick 4K Select, 2025) não rodam APKs Android. Este projeto atende os modelos com
> **Fire OS** 6/7/8 (Fire TV Stick 2ª/3ª gen, Lite, 4K, 4K Max). Veja em
> *Configurações → Minha Fire TV → Sobre*.

## Fases

### Fase 0 — Ambiente ✅ documentado
- [02-ambiente.md](02-ambiente.md): Node, Android Studio/SDK, adb, Gradle wrapper.
- [04-firestick.md](04-firestick.md): modo desenvolvedor e adb pela rede.

### Fase 1 — UI no navegador ✅ implementado
- Tokens de design extraídos da referência (`web/src/styles/tokens.css`).
- Escala única 1920×1080 em `rem` (funciona igual no Mac e no WebView 960×540@2x).
- Componentes: Header (saudação, clima, relógio, engrenagem), abas, cards de ar,
  tiles de apps, fundo estático em SVG.
- Navegação por D-pad com `@noriginmedia/norigin-spatial-navigation`.
- Clima real (Open-Meteo, sem chave) com cache local.
- Ar-condicionado simulado (mesmos valores da imagem).
- Tela "Todos os aplicativos": substitui Casa e Favoritos por seções por grupo (Filmes e séries, Vídeos e ao vivo, Música, Mídia, Jogos, Utilitários, Outros), rolando pelo foco.
- Testes unitários dos formatadores e do mapeamento de clima (`npm test`).

### Fase 2 — Casca Android ✅ implementado (precisa compilar no seu Mac)
- `MainActivity`: WebView em tela cheia, `WebViewAssetLoader` servindo `assets/www`.
- `LauncherBridge` (`window.GoularNative`): listar apps, abrir app, abrir configurações.
- `AppIconPathHandler`: banners/ícones oficiais dos apps como PNG para o WebView.
- Botão voltar vira evento para a UI; Home com o launcher aberto volta ao início.
- `HomeWatcherService`: serviço de acessibilidade que abre o Goular quando a tela
  inicial da Amazon aparece.
- Scripts: `deploy.sh`, `dev-tv.sh` (live reload na TV), `enable/disable-home-watcher.sh`.

### Fase 3 — Primeiro deploy na TV ⏭️ próximo passo (você)
1. Instalar Android Studio e gerar o Gradle wrapper ([02-ambiente.md](02-ambiente.md)).
2. Ativar adb no Fire Stick ([04-firestick.md](04-firestick.md)).
3. `FIRE_TV_IP=<ip> scripts/deploy.sh`
4. Confirmar os nomes de pacote dos favoritos (`adb shell pm list packages`) e ajustar
   `web/src/config.ts`.
5. `scripts/enable-home-watcher.sh` e testar o botão Home.
6. Medir fluidez: `chrome://inspect` → Performance. Se travar, ver
   [03-layout-frontend.md](03-layout-frontend.md#5-desempenho-no-fire-stick).

### Fase 4 — Casa de verdade
- Home Assistant: `.env.local` + CORS ([05-integracoes.md](05-integracoes.md)).
- Ajuste de temperatura: diálogo com − / + ao segurar OK (ou botão Menu) no card.
- Indicador de erro/offline nos cards.

### Fase 5 — Polimento
- Tela de configurações do launcher (nome, cidades, favoritos editáveis na TV,
  salvos em `localStorage`).
- Reordenar favoritos pela grade "Todos os aplicativos" (botão Menu → "Fixar").
- Wallpaper alternativo / modo dia e noite.
- Protetor de tela respeitado (o launcher não segura a tela ligada).
- Assinatura release com keystore própria.

## Critérios de pronto
- Visual: screenshot da TV lado a lado com a referência, diferenças só de conteúdo.
- Navegação: todo elemento alcançável só com setas + OK; voltar nunca fecha o launcher.
- Desempenho: navegação sem engasgos visíveis no Fire Stick (meta 60 fps, aceitável 30).
- Robustez: sem internet, clima mostra o último valor; HA fora do ar não quebra a tela.
