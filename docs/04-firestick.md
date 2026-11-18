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

## 3. Instalar o launcher

```bash
FIRE_TV_IP=192.168.0.42 scripts/deploy.sh
```

O script compila a UI web, gera o APK, instala e abre o Goular. Ele também aparece em
*Seus apps e canais*.

## 4. Confirmar os pacotes dos favoritos

Os nomes de pacote em `web/src/config.ts` variam por região/versão. Liste o que está
instalado:

```bash
adb shell pm list packages | sort
```

Busque por `netflix`, `disney`, `avod`/`prime`, `wbd`/`hbo`, `crunchyroll`, `youtube`
e ajuste `config.favorites`. Um favorito com pacote errado mostra o aviso
"… não está instalado".

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

## 6. Desenvolver vendo na TV (live reload)

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

## 7. Remover tudo

```bash
FIRE_TV_IP=192.168.0.42 scripts/disable-home-watcher.sh
```

```bash
adb uninstall com.goular.launcher
```

## Problemas comuns

| Sintoma | Causa provável |
|---|---|
| `adb connect` recusa | Depuração ADB desligada, IP mudou ou outra rede |
| Tela preta ao abrir | UI não foi gerada (`cd web && npm run build`) ou erro de JS: veja `chrome://inspect` |
| Tiles mostram só o nome | App sem banner/ícone, ou pacote errado em `config.ts` |
| Clima "--°" | Sem internet; volta sozinho no próximo ciclo (15 min) ou ao reabrir |
| Cards da casa "--°" | Home Assistant inacessível ou CORS ([05-integracoes.md](05-integracoes.md)) |
| Navegação engasga | Ver [03-layout-frontend.md#5-desempenho-no-fire-stick](03-layout-frontend.md#5-desempenho-no-fire-stick) |
