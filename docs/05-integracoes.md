# Integrações

## Clima — Open-Meteo

Sem cadastro nem chave. Cidades em `web/src/config.ts → cities` (nome + latitude/longitude).
Atualiza a cada 15 min e ao voltar de outro app; o último valor fica em `localStorage`
para aparecer instantaneamente ao ligar a TV. Os códigos WMO viram rótulo pt-BR e
ícone em `describeWeather()` (`web/src/services/weather.ts`).

## Ar-condicionado — Home Assistant

Sem configuração, os cards usam dados simulados. Para controlar os aparelhos reais:

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
| `getInstalledApps()` | JSON `[{ packageName, label, isTvApp, category }]` (`category`: video, audio, game, image… no Android 8+, senão `null`) |
| `launchApp(pkg)` | `true` se abriu; `false` se não está instalado |
| `openSystemSettings()` | abre as configurações do Fire TV |
| `getAppVersion()` | versão do APK |

Imagens: `http://appassets.androidplatform.net/appicons/banner/<pkg>` e `/icon/<pkg>`.

Eventos disparados em `window`: `goular:back`, `goular:home`, `goular:resume`,
`goular:packages-changed`.

## Grupos em "Todos os aplicativos"

Ao abrir a aba, os blocos Casa e Favoritos dão lugar a uma seção por grupo
(`web/src/services/appGroups.ts`). Cada app é classificado nesta ordem:

1. `config.appGroupOverrides` (`web/src/config.ts`) — sua correção manual, ex.:
   `{ 'org.xbmc.kodi': 'streaming' }`;
2. lista de pacotes conhecidos;
3. categoria declarada pelo app no Android 8+ (vem da ponte nativa);
4. palavras-chave no pacote/nome;
5. "Outros".

Grupos sem apps não aparecem. Voltar retorna ao Início.
