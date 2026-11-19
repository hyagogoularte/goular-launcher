# Apps: o que aparece e onde

Este documento cataloga os apps de fábrica do Fire TV e os mais comuns no Brasil,
diz onde cada um aparece no Goular e lista as opções para mudar isso. A lista real do
**seu** aparelho sai do script da seção 5.

## 1. Como um app chega à tela

1. **A ponte nativa lista só apps com tela.** `getInstalledApps()` pega os pacotes
   com entrada de TV (`LEANBACK_LAUNCHER`) ou de celular (`LAUNCHER`). Um Fire Stick
   tem de 250 a 350 pacotes, mas a maioria são serviços sem tela (Alexa, teclado,
   atualizações, espelhamento) e esses nunca aparecem.
2. **Os ocultos saem.** São a tela inicial da Amazon e algumas telas de sistema
   (seção 3), mais o que você puser em `config.hiddenApps`.
3. **Cada app recebe um grupo** (`web/src/services/appGroups.ts`):
   1. `config.appGroupOverrides`, a sua correção manual;
   2. o catálogo de pacotes conhecidos (seção 2);
   3. qualquer outro app, ou seja, **todo app novo que não estava no catálogo**, vai
      para **"Outros"**, no fim de "Todos os aplicativos", até ser organizado.
4. **Tudo em ordem alfabética.** Os apps de cada bloco do Início, os grupos de "Todos
   os aplicativos" (com "Outros" por último) e os apps dentro de cada grupo aparecem de
   A a Z, independente da ordem em `config.ts`.
5. **A lista se atualiza sozinha.** Quando você instala, remove ou atualiza um app,
   o Android avisa o Goular (`goular:packages-changed`) e "Todos os aplicativos" é
   recalculada. Ela também é recalculada sempre que você volta ao launcher.

### App novo instalado

Aparece sozinho em **"Outros"**, no fim de "Todos os aplicativos", mesmo que o nome ou a
categoria dele sugiram outro grupo. Só sai de lá quando for organizado:

1. rode `scripts/list-apps.sh`: a seção "Outros — novos, a organizar" lista cada app
   novo com uma **sugestão de grupo** (pela categoria que o app declara e por palavras
   no pacote);
2. peça aqui para organizar, ou faça você mesmo:
   - grupo definitivo: o pacote em `KNOWN_PACKAGES` (`appGroups.ts`) e nome/cor de
     reserva em `config.appCatalog`; um teste garante que os dois andam juntos;
   - correção rápida: só `config.appGroupOverrides`;
   - esconder: `config.hiddenApps`.

Os apps da tabela "Já conhecidos, se você instalar" (seção 2) já entram no grupo certo.

## 2. Catálogo

Conferido no Fire TV Stick 4K de casa (AFTKM, Fire OS 8.1.8.5) em 19/11/2026: 296
pacotes, 28 com tela. Os nomes são os que o próprio app mostra.

**Origem:** *fábrica* vem no Fire TV; *instalado* veio da Appstore ou por sideload.
**Onde:** *Entretenimento* e *Streaming* são os blocos do Início (`config.homeRows`);
*Grade* é "Todos os aplicativos", que mostra só o que não está no Início; *Oculto* não aparece.

### No aparelho

| Grupo | App | Pacote | Origem | Onde |
|---|---|---|---|---|
| Filmes e séries | Netflix | `com.netflix.ninja` | instalado | Entretenimento |
| | Disney+ | `com.disney.disneyplus` | instalado | Entretenimento |
| | Prime Video | `com.amazon.firebat` | fábrica | Entretenimento |
| | HBO Max | `com.hbo.hbonow` | instalado | Entretenimento |
| | Crunchyroll | `com.crunchyroll.crunchyroid` | instalado | Entretenimento |
| | Apple TV | `com.apple.atve.amazon.appletv` | instalado | Entretenimento |
| Vídeos e ao vivo | YouTube | `com.amazon.firetv.youtube` | instalado | Streaming |
| | Twitch | `tv.twitch.android.viewer` | instalado | Streaming |
| | F1 TV | `com.formulaone.production` | instalado | Grade |
| | Notícias | `com.amazon.hedwig` | fábrica | Grade |
| | Amazon Kids | `com.amazon.tahoe` | fábrica | Fora: só a Amazon pode abrir (ver abaixo) |
| | Amazon miniTV | `com.amazon.minitv.android.app` | fábrica | Oculto (`hiddenApps`): só funciona na Índia |
| Música e áudio | Spotify | `com.spotify.tv.android` | instalado | Streaming |
| | Amazon Music | `com.amazon.bueller.music` | fábrica | Grade |
| Mídia e players | Amazon Photos | `com.amazon.bueller.photos` | fábrica | Grade |
| Jogos | Amazon Luna | `com.amazon.spiderpork` | fábrica | Grade |
| | Amazon Game Center | `com.amazon.gamehub` | fábrica | Grade |
| Utilitários e sistema | Appstore | `com.amazon.venezia` | fábrica | Grade. É por ela que entram apps novos; abre direto na loja (ver abaixo) |
| | Amazon Silk | `com.amazon.cloud9` | fábrica | Grade |
| | Interface do perfil do Fire TV | `com.amazon.ftv.profilepicker` | fábrica | Fora: só a Amazon pode abrir |
| | FireTV Troubleshooting | `com.amazon.firetv.troubleshooting` | fábrica | Grade |
| | Configurações da Amazon | `com.amazon.whasettings` | fábrica | Fora: só a Amazon pode abrir |
| | Alexa Smart Home | `com.amazon.smarthomemapviewapp` | fábrica | Grade |
| | Early Access | `com.amazon.tv.earlyaccess` | fábrica | Grade |
| Outros | Amazon Live Shopping | `com.amazon.shoptv.firetv.client` | fábrica | Oculto (`hiddenApps`) |
| Sistema | Início (tela da Amazon) | `com.amazon.tv.launcher` | fábrica | Oculto |
| | Protetor de tela | `com.amazon.ftv.screensaver` | fábrica | Oculto |
| | Monitor do estado do sistema | `com.amazon.ssm` | fábrica | Oculto |

As Configurações do Fire TV não têm tile: abra pela engrenagem do cabeçalho, que leva
direto ao menu Configurações (Rede, Meu Fire TV, Aplicativos…).

### Apps que passam pela tela da Amazon

O HomeWatcher devolve ao Goular toda vez que a tela inicial da Amazon aparece. Alguns
atalhos de fábrica passam por ela e, abertos do jeito padrão, voltavam na hora para o
Goular. A ponte nativa (`LauncherBridge.kt`) contorna assim (conferido no aparelho em
19/11/2026):

| Atalho | Entrada padrão | O que o Goular faz |
|---|---|---|
| Engrenagem (Configurações) | `ACTION_SETTINGS` → tela da Amazon | abre `com.amazon.tv.launcher/.ui.MainSettingsActivity` |
| Appstore | `AppsGridLauncherActivity` → seção Apps da tela da Amazon | abre a loja (`.ade.ADEHomeActivity`), em `LAUNCH_OVERRIDES` |
| Amazon Kids, Perfis, Configurações da Amazon | exigem permissão que só apps da Amazon têm (`com.amazon.profilepicker.permission.LAUNCH`, `com.amazon.whas.API_COMMUNICATION`) | não entram na grade; só abrem pela tela da Amazon |

Outro atalho que volte sozinho para o Goular: rode `adb logcat -s GoularHome`, abra o
app e veja que tela da Amazon apareceu; depois ache a tela própria dele e ponha em
`LAUNCH_OVERRIDES`.

### Já conhecidos, se você instalar

Caem no grupo certo sem configurar nada:

| Grupo | Apps |
|---|---|
| Filmes e séries | Globoplay, Paramount+, MUBI, Stremio |
| Vídeos e ao vivo | SmartTube, YouTube Kids, Pluto TV |
| Música e áudio | Deezer |
| Mídia e players | Plex, Jellyfin, Kodi, VLC |
| Utilitários e sistema | Downloader, X-plore, Send Files to TV |

## 3. Ocultos de fábrica

Ficam em `HIDDEN_PACKAGES` (`appGroups.ts`) e valem para qualquer aparelho:

| Pacote | O que é | Por que sai |
|---|---|---|
| `com.amazon.tv.launcher` | tela inicial da Amazon | o Goular a substitui; abrir dela quebra o fluxo do Home |
| `com.amazon.ftv.screensaver` | protetor de tela | o sistema chama sozinho |
| `com.amazon.ssm` | monitor do estado do sistema | diagnóstico interno |
| `com.amazon.tv.oobe` | assistente da primeira configuração | só se usa uma vez |
| `com.amazon.kor.demo` | modo demonstração de loja | inútil em casa |
| `com.amazon.tmm.tutorialvideoprovider` | vídeos de tutorial | não é app de uso |
| `com.goular.launcher` | o próprio Goular | a ponte já exclui |

Os ocultos por gosto pessoal (miniTV, Live Shopping) ficam em `config.hiddenApps`;
apague a linha para voltarem.

## 4. Opções

| Quero… | Onde |
|---|---|
| mudar os apps do Início | `config.homeRows` em `web/src/config.ts` (blocos Entretenimento e Streaming). Cabem 6 por fileira; um pacote errado mostra "… não está instalado" |
| mudar nome ou cor de reserva de um app | `config.appCatalog`. O nome aparece embaixo do ícone dos apps sem banner; a cor é o fundo desses tiles e o de reserva quando não há arte nenhuma |
| ver as artes oficiais no navegador | `scripts/pull-app-art.sh` (seção 6) |
| tirar um app da grade | `config.hiddenApps: ['com.exemplo.app']` |
| mudar o grupo de um app | `config.appGroupOverrides: { 'org.xbmc.kodi': 'streaming' }`. Grupos: `streaming`, `video`, `music`, `media`, `games`, `system`, `other` |
| ensinar o grupo a todo mundo (não só a mim) | adicione o pacote em `KNOWN_PACKAGES` (`appGroups.ts`) e um teste em `appGroups.test.ts` |
| criar um grupo novo (ex.: Infantil) | `APP_GROUPS` em `appGroups.ts` e um ícone em `GROUP_ICONS` (`AllAppsScreen.tsx`) |
| abrir as configurações do Fire TV | engrenagem do cabeçalho (`openSystemSettings`) ou o tile Configurações |

Ideias para depois:
- **Atalhos para telas de configuração** (Rede, Bluetooth/controles, Tela e som,
  Aplicativos). Precisa de um método novo na ponte que dispare as ações
  `android.settings.*`; o Fire OS atende algumas delas, então cada uma tem de ser
  testada no aparelho.
- **Ordem por uso recente** na grade, em vez da ordem alfabética.

## 5. Ver a lista do seu aparelho

Com o adb conectado ([04-firestick.md](04-firestick.md#2-conectar-via-adb)):

```bash
FIRE_TV_IP=192.168.0.42 scripts/list-apps.sh > apps-firetv.md
```

O relatório traz o modelo e a versão do Fire OS, a situação de cada app do Início
(instalado ou não encontrado) e todos os apps abríveis agrupados como o Goular faria,
com a origem de cada um (de fábrica ou instalado) e o tipo (app de TV ou de celular).
Use `--json` para os dados brutos.

O adb não informa o nome dos apps, só o pacote. Por isso, no relatório, as palavras-chave
olham apenas o pacote; no aparelho elas olham também o nome, e o resultado pode
mudar um pouco. Antes de mudar algo no aparelho, os scripts fazem um backup dele
([04-firestick.md](04-firestick.md#backup-do-aparelho)).

Com o relatório em mãos:
1. corrija os pacotes de `config.homeRows` que aparecerem como **não encontrado**;
2. olhe "Outros" e decida o grupo de cada app (`appGroupOverrides`) ou esconda-o
   (`hiddenApps`);
3. o que for de fábrica e parecer inútil provavelmente é candidato a `hiddenApps`.

## 6. Artes dos apps

Cada tile usa a arte oficial do app instalado, nesta ordem:

1. **banner** do app (320×180), o mesmo da tela inicial da Amazon;
2. sem banner: **ícone** oficial sobre a cor do catálogo, com o nome embaixo. App sem
   ícone recebe o ícone padrão do Android (é o que a própria TV mostra);
3. sem nenhuma imagem: o nome sobre a cor do catálogo.

Na TV as artes vêm direto dos apps (`AppIconPathHandler.kt`). Logos de marcas não
entram no repositório, então para vê-las no `npm run dev` copie-as do aparelho:

```bash
FIRE_TV_IP=192.168.0.42 scripts/pull-app-art.sh
```

O script copia o APK de cada app abrível, extrai o banner e o ícone na maior
resolução (`scripts/lib/apk_art.py`; ícones em XML, como vetores e ícones adaptativos,
viram SVG) e grava em `web/.dev-art/`, que está no `.gitignore` e não vai para o
build. Rode de novo depois de instalar um app. Sem a pasta, o preview mostra os
nomes sobre as cores do catálogo.

No aparelho de casa (nov/2026): 15 apps com banner; 13 só com ícone (Appstore,
Silk, Photos, Kids, Game Center, Alexa Smart Home, Solução de problemas…), dos quais
Early Access, Perfis e Configurações da Amazon usam o ícone padrão do Android.
