import type { InstalledApp } from './native';

/** Grupos da tela "Todos os aplicativos". A ordem na tela é alfabética (ver GROUPS_IN_ORDER). */
export const APP_GROUPS = [
  { id: 'streaming', label: 'Filmes e séries' },
  { id: 'video', label: 'Vídeos e ao vivo' },
  { id: 'music', label: 'Música e áudio' },
  { id: 'media', label: 'Mídia e players' },
  { id: 'games', label: 'Jogos' },
  { id: 'system', label: 'Utilitários e sistema' },
  { id: 'other', label: 'Outros' },
] as const;

export type AppGroupId = (typeof APP_GROUPS)[number]['id'];

/** Ordem alfabética (pt-BR, sem diferenciar acentos/maiúsculas), usada em toda a UI. */
export const byName = (a: string, b: string): number => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });

/** Grupos de A a Z; "Outros" sempre por último, por ser o que sobra. */
export const GROUPS_IN_ORDER = [...APP_GROUPS].sort((a, b) =>
  a.id === 'other' ? 1 : b.id === 'other' ? -1 : byName(a.label, b.label),
);

/**
 * Pacotes conhecidos: os que vêm de fábrica no Fire TV e os mais comuns no Brasil.
 * Catálogo comentado em docs/06-apps.md. Para corrigir um app, use config.appGroupOverrides.
 */
const KNOWN_PACKAGES: Record<string, AppGroupId> = {
  // Filmes e séries
  'com.netflix.ninja': 'streaming',
  'com.disney.disneyplus': 'streaming',
  'com.amazon.firebat': 'streaming', // Prime Video no Fire OS 8
  'com.amazon.avod': 'streaming',
  'com.amazon.avod.thirdpartyclient': 'streaming',
  'com.wbd.stream': 'streaming',
  'com.hbo.hbonow': 'streaming', // HBO Max no Fire TV
  'com.crunchyroll.crunchyroid': 'streaming',
  'com.globo.globotv': 'streaming',
  'com.apple.atve.amazon.appletv': 'streaming',
  'com.paramountplus.android.tv': 'streaming',
  'com.cbs.ott': 'streaming',
  'com.mubi': 'streaming',
  'com.stremio.one': 'streaming',
  // Vídeos e ao vivo
  'com.amazon.firetv.youtube': 'video',
  'com.amazon.firetv.youtube.tv': 'video',
  'com.google.android.youtube.tv': 'video',
  'com.google.android.youtube.tvkids': 'video',
  'com.liskovsoft.smarttubetv': 'video',
  'com.liskovsoft.smarttubetv.beta': 'video',
  'tv.twitch.android.viewer': 'video',
  'tv.twitch.android.app': 'video',
  'tv.pluto.android': 'video',
  'com.formulaone.production': 'video', // F1 TV
  'com.amazon.hedwig': 'video', // Notícias
  'com.amazon.minitv.android.app': 'video', // Amazon miniTV (Índia)
  'com.amazon.tahoe': 'video', // Amazon Kids
  // Música e áudio
  'com.spotify.tv.android': 'music',
  'com.amazon.bueller.music': 'music',
  'com.deezer.android.tv': 'music',
  'deezer.android.tv': 'music',
  // Mídia e players
  'com.plexapp.android': 'media',
  'org.jellyfin.androidtv': 'media',
  'org.xbmc.kodi': 'media',
  'org.videolan.vlc': 'media',
  'com.amazon.bueller.photos': 'media',
  // Jogos
  'com.amazon.spiderpork': 'games', // Amazon Luna
  'com.amazon.gamehub': 'games', // Amazon Game Center
  'com.amazon.luna': 'games',
  'com.amazon.ags.app': 'games',
  // Utilitários e sistema
  'com.amazon.venezia': 'system', // Appstore
  'com.amazon.cloud9': 'system', // Amazon Silk
  'com.amazon.ftv.profilepicker': 'system', // perfis do Fire TV
  'com.amazon.firetv.troubleshooting': 'system', // FireTV Troubleshooting
  'com.amazon.whasettings': 'system', // Configurações da Amazon
  'com.amazon.smarthomemapviewapp': 'system', // Alexa Smart Home
  'com.amazon.tv.earlyaccess': 'system', // Early Access (prévia de recursos)
  'com.amazon.tv.settings.v2': 'system',
  'com.android.settings': 'system',
  'com.esaba.downloader': 'system',
  'com.lonelycatgames.Xplore': 'system',
  'com.yablio.sendfilestotv': 'system',
};

/**
 * Nunca aparecem em "Todos os aplicativos": a tela inicial da Amazon (o Goular
 * a substitui) e telas de sistema que não fazem sentido abrir pelo launcher.
 * Para esconder mais algum, use config.hiddenApps.
 */
export const HIDDEN_PACKAGES: ReadonlySet<string> = new Set([
  'com.amazon.tv.launcher', // tela inicial da Amazon
  'com.amazon.tv.oobe', // assistente da primeira configuração
  'com.amazon.kor.demo', // modo demonstração de loja
  'com.amazon.ftv.screensaver', // protetor de tela
  'com.amazon.tmm.tutorialvideoprovider', // vídeos de tutorial
  'com.amazon.ssm', // Monitor do estado do sistema (diagnóstico interno)
  'com.goular.launcher', // o próprio Goular (a ponte já exclui)
]);

/**
 * As regras abaixo (categoria do Android e palavras-chave) NÃO decidem o grupo na
 * tela: app fora do catálogo vai para "Outros" até ser organizado. Elas só geram a
 * sugestão de grupo do relatório (scripts/list-apps.sh), para ajudar a organizar.
 *
 * Categoria declarada pelo próprio app no Android 8+ (ApplicationInfo.category),
 * repassada pela ponte nativa como texto.
 */
const ANDROID_CATEGORY: Record<string, AppGroupId> = {
  video: 'streaming',
  audio: 'music',
  game: 'games',
  image: 'media',
  productivity: 'system',
  news: 'video',
};

/**
 * Palavras no pacote ou no nome, da mais específica para a mais
 * genérica. "tv" fica por último porque quase todo pacote de Fire TV tem ".tv.".
 */
const KEYWORDS: [RegExp, AppGroupId][] = [
  [/netflix|disney|prime ?video|hbo|\bmax\b|crunchyroll|globoplay|paramount|starplus|telecine|looke|mubi|\bvix\b|filmes|movies?|series|cinema/i, 'streaming'],
  [/spotify|music|m[uú]sica|deezer|radio|r[aá]dio|podcast|audio|tidal/i, 'music'],
  [/game|jogo|arcade|xbox|luna|steam|retroarch|emulat/i, 'games'],
  [/plex|kodi|vlc|player|media|m[ií]dia|photo|foto|jellyfin|emby/i, 'media'],
  [/settings|configura|downloader|file|arquivo|browser|navegador|silk|vpn|cleaner|tool|util|appstore|loja/i, 'system'],
  [/youtube|twitch|pluto|live|ao vivo|iptv|canal|canais|news|not[ií]cias|\btv\b/i, 'video'],
];

export interface AppWithCategory extends InstalledApp {
  category?: string | null;
}

/**
 * Grupo do app na tela: correção manual (config.appGroupOverrides), depois o catálogo.
 * Qualquer app novo, que não estava no catálogo, fica em "Outros" (no fim de
 * "Todos os aplicativos") até ser organizado.
 */
export function classifyApp(app: AppWithCategory, overrides: Record<string, AppGroupId> = {}): AppGroupId {
  return overrides[app.packageName] ?? KNOWN_PACKAGES[app.packageName] ?? 'other';
}

/** O app já foi organizado (está no catálogo ou tem correção manual)? */
export function isCataloged(packageName: string, overrides: Record<string, AppGroupId> = {}): boolean {
  return packageName in overrides || packageName in KNOWN_PACKAGES;
}

/**
 * Palpite de grupo para um app de "Outros", usado só no relatório: categoria que o
 * app declara, depois palavras no pacote/nome. undefined = sem palpite.
 */
export function suggestGroup(app: AppWithCategory): AppGroupId | undefined {
  const byCategory = app.category ? ANDROID_CATEGORY[app.category] : undefined;
  if (byCategory) return byCategory;
  const haystack = `${app.packageName} ${app.label}`;
  return KEYWORDS.find(([re]) => re.test(haystack))?.[1];
}

export interface AppGroup {
  id: AppGroupId;
  label: string;
  apps: AppWithCategory[];
}

export function isHiddenApp(packageName: string, hidden: readonly string[] = []): boolean {
  return HIDDEN_PACKAGES.has(packageName) || hidden.includes(packageName);
}

/** Agrupa em grupos de A a Z com apps de A a Z; apps ocultos e grupos vazios ficam de fora. */
export function groupApps(
  apps: AppWithCategory[],
  overrides: Record<string, AppGroupId> = {},
  hidden: readonly string[] = [],
): AppGroup[] {
  const buckets = new Map<AppGroupId, AppWithCategory[]>();
  for (const app of apps) {
    if (isHiddenApp(app.packageName, hidden)) continue;
    const id = classifyApp(app, overrides);
    const list = buckets.get(id) ?? [];
    list.push(app);
    buckets.set(id, list);
  }
  return GROUPS_IN_ORDER.filter((g) => buckets.has(g.id)).map((g) => ({
    id: g.id,
    label: g.label,
    apps: buckets.get(g.id)!.sort((a, b) => byName(a.label, b.label)),
  }));
}
