# Arquitetura

```
┌──────────────────────── Fire TV Stick (Fire OS) ────────────────────────┐
│                                                                         │
│  HomeWatcherService ──(tela inicial da Amazon apareceu)──► MainActivity │
│  (acessibilidade)                                             │         │
│                                                               ▼         │
│  ┌────────────────────────── WebView ────────────────────────────────┐  │
│  │  http://appassets.androidplatform.net/assets/www/index.html       │  │
│  │                                                                   │  │
│  │  React UI (web/)  ◄── eventos goular:back|home|resume|packages-…  │  │
│  │      │                                                            │  │
│  │      ├─ window.GoularNative.* ──► LauncherBridge (Kotlin)         │  │
│  │      │      getInstalledApps / launchApp / openSystemSettings     │  │
│  │      ├─ <img src=/appicons/banner/<pkg>> ──► AppIconPathHandler   │  │
│  │      ├─ fetch Open-Meteo (https)                                  │  │
│  │      └─ fetch Home Assistant (http, rede local)                   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

## Estrutura de pastas

```
goular-launcher/
├── web/                      UI (React 19 + Vite + TypeScript)
│   └── src/
│       ├── config.ts         ← nome, cidades, blocos do Início, catálogo de apps, cômodos (edite aqui)
│       ├── styles/tokens.css ← cores, raios, tipografia, movimento
│       ├── components/       Header, NavTabs, ClimateCard, AppTile, Background…
│       ├── screens/          HomeScreen, AllAppsScreen
│       ├── navigation/       inicialização do D-pad e FocusGroup
│       ├── services/         native (ponte), weather, climate/(mock | homeAssistant)
│       └── lib/              formatação de data/hora, useNow
├── android/                  casca nativa (Kotlin, sem Compose, só androidx.webkit)
│   └── app/src/main/
│       ├── java/com/goular/launcher/
│       │   ├── MainActivity.kt
│       │   ├── LauncherBridge.kt
│       │   ├── AppIconPathHandler.kt
│       │   ├── ClockDreamService.kt   ← protetor de tela (relógio)
│       │   └── HomeWatcherService.kt
│       └── assets/www/       ← gerado por `npm run build` (ignorado no git)
├── scripts/                  deploy, live reload na TV, HomeWatcher, protetor de tela, backup
└── docs/                     esta documentação + imagem de referência
```

## Por que cada peça existe

**WebViewAssetLoader em vez de `file://`** — a página ganha uma origem http normal
(`http://appassets.androidplatform.net`), então `fetch`, `localStorage` e CORS se
comportam como num site. Usamos http (não https) para poder chamar o Home Assistant
em `http://` na rede local sem bloqueio de *mixed content*.

**Banners servidos pelo nativo** — todo app de Android TV publica um banner 320×180.
Servindo-o como imagem, os tiles mostram a arte oficial de cada serviço sem que
nenhuma logo de terceiros fique no repositório. App sem banner mostra o ícone oficial
com o nome embaixo (sem ícone, o Android entrega o ícone padrão dele). No `npm run dev`
as mesmas artes vêm de `web/.dev-art/`, copiadas do Fire TV por
`scripts/pull-app-art.sh` (fora do git e do build). Sem nenhuma arte, o tile mostra o
nome sobre a cor da marca (`fallback` em `config.ts`).

**Eventos em vez de chamadas** — o nativo nunca chama funções do React; ele só
dispara `window.dispatchEvent(new Event('goular:<nome>'))`. Isso mantém o acoplamento
mínimo e permite simular tudo no navegador (Escape = voltar).

**HomeWatcherService** — desde o Fire OS 6.2 a Amazon impede trocar o launcher
padrão (o seletor de "tela inicial" não existe e desativar o launcher da Amazon via
adb foi bloqueado). O caminho que funciona é um serviço de acessibilidade que percebe a
tela inicial da Amazon aparecendo e abre o Goular por cima. Ele só escuta
`typeWindowStateChanged` do pacote `com.amazon.tv.launcher` e não lê conteúdo de tela.
Limitação conhecida: a tela da Amazon pode piscar por uma fração de segundo.

**ClockDreamService** — o protetor de tela do Fire OS é um `DreamService` do Android;
o da Amazon (`com.amazon.ftv.screensaver`) é só o escolhido por padrão. O Goular traz o
seu: fundo quase preto no degradê do Goular e um bloco com data e hora quicando nas bordas, desenhado direto no `Canvas` (sem
WebView, para gastar pouca memória enquanto a TV está parada). A troca é a configuração
`secure screensaver_components`, feita por `scripts/enable-screensaver.sh`.

**Provedores de clima da casa** — `ClimateProvider` é uma interface; hoje existem
`MockClimateProvider` e `HomeAssistantClimateProvider`. Trocar de plataforma de
automação é escrever outra classe, sem tocar na UI.
