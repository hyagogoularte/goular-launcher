# Integrações

## Clima — Open-Meteo

Sem cadastro nem chave. Cidades em `web/src/config.ts → cities` (nome + latitude/longitude).
Atualiza a cada 15 min e ao voltar de outro app; o último valor fica em `localStorage`
para aparecer instantaneamente ao ligar a TV. Os códigos WMO viram rótulo pt-BR e
ícone em `describeWeather()` (`web/src/services/weather.ts`).

## Ar-condicionado — Home Assistant

Sem configuração (ou com um aparelho fora do ar no HA), o card mostra "–" no tom de
desligado: nada de temperatura inventada. Para desenhar os cards com valores de
exemplo, ponha `VITE_CLIMATE_MOCK=1` em `web/.env.local`. Para os aparelhos reais:

### 1. Entidades
Cada ar precisa ser uma entidade `climate.*` no Home Assistant (integrações típicas:
Midea, LG ThinQ, Daikin, Sensibo, Tuya, ou IR via Broadlink + SmartIR). Ajuste os
`entityId` em `config.climate.rooms`:

```ts
rooms: [
  { name: 'Sala', entityId: 'climate.sala' },
  ...
]
```

### 2. Token
No Home Assistant: *Perfil → Segurança → Tokens de acesso de longa duração → Criar*.
Crie `web/.env.local` (ignorado pelo git) a partir de `web/.env.example`:

```bash
VITE_HA_URL=http://192.168.0.10:8123
VITE_HA_TOKEN=<token>
```

> O token é embutido no APK no build. Aceitável para um aparelho pessoal na rede de
> casa; não distribua esse APK. Prefira um usuário do HA só para o launcher.

### 3. CORS
O WebView chama o HA a partir da origem `http://appassets.androidplatform.net`
(e do Vite em dev). Libere em `configuration.yaml` e reinicie o HA:

```yaml
http:
  cors_allowed_origins:
    - http://appassets.androidplatform.net
    - http://localhost:5173
```

### 4. Comportamento
- Lista atualizada a cada 30 s e ao voltar para o launcher.
- OK no card liga/desliga (`climate.turn_on` / `climate.turn_off`) de forma otimista;
  se a chamada falhar, o card volta ao estado anterior e aparece um aviso.
- `(22°)` é a temperatura-alvo (`attributes.temperature`), mostrada só com o ar ligado.

### Outra plataforma?
Implemente `ClimateProvider` (`web/src/services/climate/types.ts`) e escolha-o em
`createProvider()` (`web/src/services/climate/index.ts`).

## Apps instalados — ponte nativa

`window.GoularNative` (só existe no Fire Stick):

| Método | Retorno |
|---|---|
| `getInstalledApps()` | JSON `[{ packageName, label, isTvApp, category }]` (`category`: video, audio, game, image… no Android 8+, senão `null`). Deixa de fora apps que exigem permissão da Amazon para abrir |
| `launchApp(pkg)` | `true` se abriu; `false` se não está instalado ou não pode ser aberto. Usa a tela própria do app quando a padrão passa pela tela da Amazon (`LAUNCH_OVERRIDES`) |
| `openSystemSettings()` | abre o menu Configurações do Fire TV (`MainSettingsActivity`; `ACTION_SETTINGS` só de reserva) |
| `getAppVersion()` | versão do APK |

Imagens: `http://appassets.androidplatform.net/appicons/banner/<pkg>` e `/icon/<pkg>`
(PNG; 404 quando o app não tem banner ou o banner é só cor/degradê, e o tile usa o
ícone). No `npm run dev`, as mesmas URLs são `/dev-art/banner/<pkg>` e `/dev-art/icon/<pkg>`,
servidas pelo Vite a partir de `web/.dev-art/` (`scripts/pull-app-art.sh`).

Eventos disparados em `window`: `goular:back`, `goular:home`, `goular:resume`,
`goular:packages-changed`.

## Grupos em "Todos os aplicativos"

Ao abrir a aba, os blocos do Início dão lugar a uma seção por grupo
(`web/src/services/appGroups.ts`). Os apps que já estão no Início não se repetem. Apps ocultos (tela inicial da Amazon, telas de
sistema e `config.hiddenApps`) ficam de fora. Os demais recebem o grupo assim:

1. `config.appGroupOverrides` (`web/src/config.ts`) — sua correção manual, ex.:
   `{ 'org.xbmc.kodi': 'streaming' }`;
2. lista de pacotes conhecidos (o catálogo);
3. qualquer app fora do catálogo (todo app novo) vai para "Outros" até ser organizado.

A categoria que o app declara no Android 8+ e as palavras-chave do pacote não mudam a
tela: viram só a sugestão de grupo do relatório de `scripts/list-apps.sh`.

Grupos aparecem de A a Z ("Outros" sempre por último) e, dentro de cada um, os apps
de A a Z pelo nome do tile, sem diferenciar acento e maiúscula. Grupos sem apps não
aparecem. Voltar retorna ao Início. Catálogo completo e como
listar os apps do aparelho: [06-apps.md](06-apps.md).
