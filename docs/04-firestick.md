# Instalando e configurando no Fire TV Stick

## 1. Ativar o modo desenvolvedor (no Fire Stick)

1. *Configurações → Minha Fire TV → Sobre*. Selecione o nome do aparelho
   (ex.: "Fire TV Stick 4K") e aperte OK **7 vezes** até aparecer
   "Você já é um desenvolvedor".
2. Volte para *Minha Fire TV → Opções do desenvolvedor*:
   - **Depuração ADB**: Ativada
   - **Instalar apps desconhecidos / Apps de fontes desconhecidas**: permitir
3. Anote o IP: *Minha Fire TV → Sobre → Rede* (ex.: `192.168.0.42`).

> O Mac e o Fire Stick precisam estar na mesma rede.

## 2. Conectar via adb

```bash
adb connect 192.168.0.42:5555
```

Na primeira vez a TV pergunta "Permitir depuração USB?" — marque *Sempre permitir* e OK.
Confira:

```bash
adb devices
```

## Backup do aparelho

Antes da primeira mudança num Fire TV (`deploy.sh`, `dev-tv.sh`, `enable-` e
`disable-home-watcher.sh`), os scripts guardam um zip do estado atual dele em
`backups/<aaaammdd>/<hhmm>/<modelo>-<serial>.zip` (ex.: `backups/20261119/1402/AFTKM-….zip`).
Fica dentro do projeto, mas fora do git: com os APKs passa de 300 MB, acima do limite
do GitHub, e traz dados do aparelho. Para fazer um backup a qualquer momento:

```bash
FIRE_TV_IP=192.168.0.42 scripts/backup-device.sh --apks
```

| Pasta no zip | Conteúdo |
|---|---|
| `aparelho/` | modelo, versão do Fire OS, propriedades, armazenamento |
| `pacotes/` | todos os pacotes (de fábrica, instalados, desativados), versões e apps abríveis |
| `configuracoes/` | settings global/secure/system, tela inicial padrão, acessibilidade |
| `estado/` | app em primeiro plano, recentes, processos |
| `apks/` | só com `--apks`: os APKs dos apps que você instalou (~370 MB) |

O zip não guarda dados nem logins dos apps: o Android não deixa copiá-los sem root.
O `LEIA-ME.txt` dentro do zip explica como restaurar. Para pular o backup automático,
use `SKIP_BACKUP=1`.

## 3. Instalar o launcher

```bash
FIRE_TV_IP=192.168.0.42 scripts/deploy.sh
```

O script compila a UI web, gera o APK, instala e abre o Goular. Ele também aparece em
*Seus apps e canais*.

## 4. Confirmar os pacotes do Início

Os nomes de pacote em `web/src/config.ts` variam por região/versão (no Fire OS 8, Prime
Video é `com.amazon.firebat` e HBO Max é `com.hbo.hbonow`). Confira com:

```bash
FIRE_TV_IP=192.168.0.42 scripts/list-apps.sh > apps-firetv.md
```

A seção "Blocos do Início" do relatório marca o que não foi encontrado; ajuste
`config.homeRows`. Um tile com pacote errado mostra o aviso "… não está instalado".
Catálogo e grupos: [06-apps.md](06-apps.md).

## 5. Fazer o Goular abrir no botão Home

```bash
FIRE_TV_IP=192.168.0.42 scripts/enable-home-watcher.sh
```

Isso liga o serviço de acessibilidade *Goular – tela inicial* (também visível em
*Configurações → Acessibilidade*). Aperte Home: a tela da Amazon aparece por um
instante e o Goular assume.

Se alguma tela da Amazon que você quer usar for interceptada (ex.: perfis), veja o nome
dela e adicione um trecho a `PASSTHROUGH_HINTS` em `HomeWatcherService.kt`:

```bash
adb logcat -s GoularHome
```

Para desfazer:

```bash
FIRE_TV_IP=192.168.0.42 scripts/disable-home-watcher.sh
```

> Atualizações do Fire OS às vezes desligam serviços de acessibilidade. Se o Home
> voltar a abrir a tela da Amazon, rode o `enable-home-watcher.sh` de novo.

## 6. Protetor de tela: relógio

Troca o protetor da Amazon por uma tela quase preta, no mesmo degradê do Goular
escurecido, com a data ("QUI. 19 DE NOV.") e, embaixo, a hora em letras maiores, na
mesma largura da data.
O bloco atravessa a tela e, ao bater numa borda, volta na direção oposta. Precisa do Goular instalado (passo 3).

```bash
FIRE_TV_IP=192.168.0.42 scripts/enable-screensaver.sh --testar
```

`--testar` liga o protetor na hora; qualquer tecla do controle sai dele. O tempo até ele
aparecer continua na opção *Protetor de tela* das Configurações do Fire TV. Hora em 24h
ou 12h segue a configuração do aparelho.

Para voltar ao da Amazon:

```bash
FIRE_TV_IP=192.168.0.42 scripts/disable-screensaver.sh
```

> Mexer no protetor de tela pelas Configurações do Fire TV pode trazer o da Amazon de
> volta. Se acontecer, rode o `enable-screensaver.sh` de novo. Não remova o pacote
> `com.amazon.ftv.screensaver` ([07-otimizacao.md](07-otimizacao.md)): ele pode ser o que
> conta o tempo parado e chama o protetor.

## 7. Desenvolver vendo na TV (live reload)

Num terminal:

```bash
cd web && npm run dev
```

Em outro:

```bash
FIRE_TV_IP=192.168.0.42 scripts/dev-tv.sh
```

O APK de debug carrega a UI direto do Vite no Mac: salvou o arquivo, a TV atualiza.
Para depurar, abra `chrome://inspect` no Chrome do Mac e clique em *inspect* no
WebView do Goular. Quando terminar, rode `scripts/deploy.sh` de novo para voltar a
usar a UI embutida no APK.

## 8. Remover tudo

```bash
FIRE_TV_IP=192.168.0.42 scripts/disable-home-watcher.sh
```

```bash
FIRE_TV_IP=192.168.0.42 scripts/disable-screensaver.sh
```

```bash
adb uninstall com.goular.launcher
```

## Problemas comuns

| Sintoma | Causa provável |
|---|---|
| Protetor da Amazon voltou | alguém mexeu em *Protetor de tela* nas Configurações ou o Fire OS atualizou: rode `enable-screensaver.sh` |
| `adb connect` recusa | Depuração ADB desligada, IP mudou ou outra rede |
| Tela preta ao abrir | UI não foi gerada (`cd web && npm run build`) ou erro de JS: veja `chrome://inspect` |
| Tiles mostram só o nome | App sem banner/ícone, ou pacote errado em `config.ts` |
| Clima "--°" | Sem internet; volta sozinho no próximo ciclo (15 min) ou ao reabrir |
| Cards da casa "--°" | Home Assistant inacessível ou CORS ([05-integracoes.md](05-integracoes.md)) |
| Navegação engasga | Ver [03-layout-frontend.md#5-desempenho-no-fire-stick](03-layout-frontend.md#5-desempenho-no-fire-stick) |
