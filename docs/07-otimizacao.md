# Otimização do Fire TV

Levantamento para deixar o Fire TV leve e rápido ("versão clean") sem quebrar o
Goular nem os apps de streaming. Feito sobre o backup de 19/11/2026
(`backups/20261119/1301/AFTKM-….zip`) do Fire TV Stick 4K (AFTKM, Fire OS 8.1.8.5, Android 11).

> **Nada aqui foi aplicado ainda.** Antes de qualquer mudança existe o backup
> ([04-firestick.md](04-firestick.md#backup-do-aparelho)). Cada item diz como desfazer.

## 1. Retrato do aparelho

| Item | Valor | Leitura |
|---|---|---|
| Memória | 1,7 GB, ~330 MB livres com Prime Video e HBO Max abertos | é o gargalo; cada app em segundo plano pesa |
| Tela inicial da Amazon | ~177 MB residentes | continua viva por trás do Goular (o Fire OS não deixa trocá-la) |
| Armazenamento | 1,9 GB livres de 5,1 GB (38%); 485 MB de cache de apps | abaixo de ~1 GB o Fire OS começa a remover apps sozinho |
| WebView | Chromium 150 (`com.amazon.webview.chromium`) | moderno; é ele que desenha o Goular |
| Pacotes | 296 no total, 12 instalados por você | ~180 são da Amazon |

Processos mais pesados no momento do backup: tela inicial da Amazon (177 MB),
`system_server` (115 MB), Prime Video (110 MB), `com.amazon.adep` (63 MB),
`com.amazon.aca` (59 MB), Alexa (`vizzini`, 58 MB) e o teclado (48 MB).

## 2. O que já está bom

Já vem assim no aparelho, não precisa mexer:

- anúncios com base em interesses desligados (`interestBasedAds=0`, `limit_ad_tracking=1`);
- coleta de dados de uso de apps e do aparelho desligada (`appUsageData=0`, `deviceUsageData=0`,
  `USAGE_METRICS_UPLOAD_ENABLED=0`, `usage_metrics_marketing_enabled=0`);
- downloads automáticos de conteúdo (livros, músicas, vídeos) desligados;
- HDMI-CEC ligado: o controle do Fire TV liga a TV e controla o volume;
- Dolby passthrough disponível.

## 3. Ajustes de configuração (sem remover nada)

Ordem sugerida: do mais seguro para o menos. Todos se desfazem pelo mesmo caminho.

| # | Ajuste | Hoje | Proposto | Como | Ganho |
|---|---|---|---|---|---|
| 1 | Animações do sistema | 1.0 | 0.5 | adb (abaixo) | abrir/fechar apps parece ~2x mais rápido |
| 2 | Vídeo e áudio automáticos no destaque da Amazon | ligado | desligado | *Configurações → Preferências → Conteúdo em destaque* | a tela da Amazon por trás para de baixar vídeo e gastar memória |
| 3 | Notificações de apps | todas | só as que você usa | *Configurações → Preferências → Configurações de notificação* | menos processos acordando |
| 4 | Cache dos apps | 485 MB | ~0 | adb (abaixo) | espaço livre; os apps refazem o cache aos poucos |
| 5 | Apps sem uso | — | desinstalar | *Configurações → Aplicativos → Gerenciar aplicativos* | memória e espaço. Candidatos: F1 TV, Twitch, se não usar |
| 6 | DNS da rede | do roteador | AdGuard de casa | *Configurações → Rede → (sua rede) → Avançado* ou no DHCP do roteador | bloqueia anúncios e telemetria antes de chegarem |
| 7 | Depuração ADB | ligada | desligar quando terminar o desenvolvimento | *Minha Fire TV → Opções do desenvolvedor* | segurança. O Goular não precisa dela para rodar |
| 8 | Wi-Fi | — | rede 5 GHz ou adaptador Ethernet | — | menos travadas em 4K |

Comandos dos itens 1 e 4:

```bash
adb shell settings put global window_animation_scale 0.5
adb shell settings put global transition_animation_scale 0.5
adb shell settings put global animator_duration_scale 0.5
```

```bash
adb shell pm trim-caches 999G
```

Desfazer o item 1: os mesmos comandos com `1.0`.

**Cuidado com o item 6.** Listas de bloqueio agressivas derrubam o Prime Video e a
Appstore. Comece por uma lista só de anúncios e telemetria e teste Prime Video,
Netflix e a Appstore antes de deixar fixo.

**Não mexa:** fontes desconhecidas (o Goular é instalado por fora da Appstore) e o
serviço de acessibilidade *Goular – tela inicial*.

## 4. Remover pacotes da Amazon (versão clean)

O Fire OS 8 não deixa apagar apps de sistema, mas deixa **removê-los para o seu
usuário**. O APK continua na partição do sistema, o app some e para de rodar, e um
comando o traz de volta. Um reset de fábrica também restaura tudo.

```bash
adb shell pm uninstall -k --user 0 <pacote>
```

```bash
adb shell cmd package install-existing <pacote>
```

O primeiro remove o app; o segundo o traz de volta.

Faça em lotes pequenos, reinicie (`adb reboot`) e passe pelo checklist da seção 5
antes do próximo lote.

### Nunca remover

Sem eles o aparelho, o controle ou o Goular param:

| Pacote | Por quê |
|---|---|
| `com.amazon.tv.launcher` | tela inicial da Amazon: o Fire OS precisa dela e o botão Home passa por ela antes do Goular |
| `com.amazon.webview.chromium` | o WebView que desenha o Goular |
| `com.amazon.venezia`, `com.amazon.android.marketplace` | Appstore: atualizações e licenças dos apps |
| `com.amazon.tv.settings.v2`, `com.amazon.tv.settings.core` | Configurações |
| `com.amazon.tv.ime` | teclado na tela |
| `com.amazon.fireinputdevices`, `com.amazon.device.bluetoothpa`, `com.amazon.device.blepa`, `com.amazon.device.bluetoothkeymaplib`, `com.amazon.autopairservice` | controle remoto |
| `com.amazon.dcp`, `com.amazon.identity.auth.device.authorization` | conta Amazon (Prime Video, Appstore) |
| `com.amazon.tcomm*`, `com.amazon.device.messaging*` | comunicação com a nuvem e notificações dos apps |
| `com.amazon.storage.manager`, `com.amazon.device.lowstoragemanager` | gestão de espaço |
| `com.amazon.firebat` | Prime Video |
| `com.amazon.tv.oobe`, `com.amazon.tv.ooberesource` | necessários depois de um reset |
| `com.amazon.client.metrics.api` e pacotes terminados em `.library`/`.sdk` | bibliotecas usadas por outros apps |
| `com.amazon.adep`, `com.amazon.aca` | pesados, mas sem função documentada; deixe |
| `com.amazon.ftv.screensaver` | pode ser o que conta o tempo parado e chama o protetor de tela, inclusive o relógio do Goular |

### Lote 1: propaganda e vitrine da Amazon (risco baixo)

| Pacote | O que é |
|---|---|
| `com.amazon.kso.blackbird` | ofertas e anúncios patrocinados |
| `com.amazon.ftvads.deeplinking` | links dos anúncios |
| `com.amazon.sneakpeek` | prévias em vídeo da tela da Amazon |
| `com.amazon.media.recommendations` | fileiras de recomendação da tela da Amazon |
| `com.amazon.shoptv.client`, `com.amazon.shoptv.firetv.client` | Amazon Live Shopping |
| `com.amazon.minitv.android.app` | Amazon miniTV (só na Índia) |
| `com.amazon.tv.earlyaccess` | programa de prévia de recursos |
| `com.amazon.tmm.tutorial`, `com.amazon.storm.lightning.tutorial` | tutoriais |
| `com.amazon.tv.releasenotes` | "novidades desta versão" |

### Lote 2: telemetria e diagnóstico (risco baixo a médio)

| Pacote | O que é |
|---|---|
| `com.amazon.tv.acr` | reconhecimento automático do que passa na tela |
| `com.amazon.device.telemetry.emitter`, `com.amazon.device.metrics`, `com.amazon.wirelessmetrics.service` | envio de métricas |
| `com.amazon.perfcollection`, `com.amazon.dp.logger`, `com.amazon.neo.minerva.logcat` | coleta de desempenho e logs |
| `com.amazon.device.logmanager`, `com.amazon.device.crashmanager`, `com.amazon.logan` | envio de logs e relatórios de falha |
| `com.amazon.ceviche` | eventos de uso (39 MB em memória) |
| `com.amazon.hybridadidservice` | ID de anúncio |

Se algum app começar a fechar sozinho depois deste lote, restaure o lote inteiro e
volte um pacote por vez.

### Lote 3: recursos que você talvez não use (decida item a item)

| Pacote | Recurso | Remova se… |
|---|---|---|
| `com.amazon.spiderpork`, `com.amazon.gamehub` | Amazon Luna e Game Center | não joga no Fire TV |
| `com.amazon.bueller.photos` | Amazon Photos | não usa fotos/protetor com suas fotos |
| `com.amazon.bueller.music` | Amazon Music | usa só o Spotify |
| `com.amazon.hedwig` | Notícias | não usa |
| `com.amazon.smarthomemapviewapp`, `com.amazon.tv.matter`, `com.amazon.tv.mattercohost` | casa inteligente pela Alexa/Matter | a casa é controlada pelo Home Assistant |
| `com.amazon.whad`, `com.amazon.whisperjoin.middleware.v2.np` | configurar outros aparelhos Amazon pelo Wi-Fi | não tem Echo/Kindle para configurar |
| `com.amazon.audiohome`, `com.amazon.whasettings` | áudio em vários cômodos com Echo | não usa |
| `com.amazon.tv.livetv` | guia de TV ao vivo | não usa canais ao vivo da Amazon |
| `com.amazon.tv.ftvambient` | modo ambiente | prefere o protetor de tela simples |
| `com.amazon.tahoe` | Amazon Kids | não usa perfis infantis |
| `com.amazon.vizzini` e `com.amazon.alexa*` | Alexa e o botão de voz | não usa voz. **Libera ~60 MB, mas o botão de microfone para** |
| `com.amazon.cast.sink`, `com.amazon.dialservice`, `com.amazon.whisperplay.*` | transmitir do celular (YouTube, Netflix) | não usa o "transmitir" |

### Atualizações do sistema (decisão sua)

`com.amazon.device.software.ota` e `com.amazon.tv.forcedotaupdater.v2` instalam
atualizações do Fire OS. Removê-los evita que uma atualização desligue o serviço de
acessibilidade do Goular, mas também corta correções de segurança. Recomendação:
**manter** e, depois de cada atualização, rodar `scripts/enable-home-watcher.sh` se o
Home voltar a abrir a tela da Amazon.

## 5. Checklist depois de cada lote

1. `adb reboot` e esperar a tela inicial.
2. Botão Home abre o Goular.
3. Controle: setas, OK, voltar, volume e, se mantido, o microfone.
4. Abrir e dar play em Netflix, Prime Video, Disney+, HBO Max, YouTube e Spotify.
5. Appstore abre e mostra "Atualizar" nos apps.
6. *Configurações → Aplicativos* mostra os apps normalmente.
7. Memória livre: `adb shell cat /proc/meminfo | head -3`. Compare com os ~330 MB de hoje.

## 6. Voltar ao estado original

- Um pacote: `adb shell cmd package install-existing <pacote>`.
- Todos de uma vez: reinstale a lista de `pacotes/de-fabrica.txt` do backup com
  `install-existing` (os que já estão instalados são ignorados).
- Configurações: os valores originais estão em `configuracoes/*.txt` no backup.
- Último recurso: reset de fábrica (*Minha Fire TV → Restaurar padrões de fábrica*),
  depois reinstalar os apps pela Appstore.
