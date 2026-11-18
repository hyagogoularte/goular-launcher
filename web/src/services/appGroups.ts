import type { InstalledApp } from './native';

/** Grupos da tela "Todos os aplicativos", na ordem em que aparecem. */
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

/** Pacotes conhecidos. Para corrigir um app, use config.appGroupOverrides. */
const KNOWN_PACKAGES: Record<string, AppGroupId> = {
  'com.netflix.ninja': 'streaming',
  'com.disney.disneyplus': 'streaming',
  'com.amazon.avod': 'streaming',
  'com.amazon.avod.thirdpartyclient': 'streaming',
  'com.wbd.stream': 'streaming',
  'com.hbo.hbonow': 'streaming',
  'com.crunchyroll.crunchyroid': 'streaming',
  'com.globo.globotv': 'streaming',
  'com.apple.atve.amazon.appletv': 'streaming',
  'com.paramountplus.android.tv': 'streaming',
  'com.amazon.firetv.youtube': 'video',
  'com.google.android.youtube.tv': 'video',
  'tv.twitch.android.viewer': 'video',
  'tv.twitch.android.app': 'video',
  'tv.pluto.android': 'video',
  'com.spotify.tv.android': 'music',
  'com.amazon.bueller.music': 'music',
  'com.deezer.android.tv': 'music',
  'com.plexapp.android': 'media',
  'org.xbmc.kodi': 'media',
  'org.videolan.vlc': 'media',
  'com.amazon.bueller.photos': 'media',
  'com.esaba.downloader': 'system',
  'com.amazon.tv.settings.v2': 'system',
  'com.android.settings': 'system',
};

/**
 * Categoria declarada pelo próprio app no Android 8+ (ApplicationInfo.category),
 * repassada pela ponte nativa como texto.
 */
const ANDROID_CATEGORY: Record<string, AppGroupId> = {
  video: 'streaming',
  audio: 'music',
  game: 'games',
  image: 'media',
  productivity: 'system',
};

/** Último recurso: palavras no pacote ou no nome. */
const KEYWORDS: [RegExp, AppGroupId][] = [
  [/netflix|disney|prime ?video|hbo|\bmax\b|crunchyroll|globoplay|paramount|starplus|filmes|movies?|series/i, 'streaming'],
  [/youtube|twitch|pluto|live|ao vivo|\btv\b|news|not[ií]cias/i, 'video'],
  [/spotify|music|m[uú]sica|deezer|radio|r[aá]dio|podcast|audio|tidal/i, 'music'],
  [/plex|kodi|vlc|player|media|m[ií]dia|photo|foto|jellyfin|emby/i, 'media'],
  [/game|jogo|arcade|xbox|luna|steam/i, 'games'],
  [/settings|configura|downloader|file|arquivo|browser|navegador|silk|vpn|cleaner|tool|util/i, 'system'],
];

export interface AppWithCategory extends InstalledApp {
  category?: string | null;
}

export function classifyApp(app: AppWithCategory, overrides: Record<string, AppGroupId> = {}): AppGroupId {
  const byOverride = overrides[app.packageName];
  if (byOverride) return byOverride;
  const byPackage = KNOWN_PACKAGES[app.packageName];
  if (byPackage) return byPackage;
  const byCategory = app.category ? ANDROID_CATEGORY[app.category] : undefined;
  if (byCategory) return byCategory;
  const haystack = `${app.packageName} ${app.label}`;
  return KEYWORDS.find(([re]) => re.test(haystack))?.[1] ?? 'other';
}

export interface AppGroup {
  id: AppGroupId;
  label: string;
  apps: AppWithCategory[];
}

/** Agrupa e ordena; grupos vazios ficam de fora. */
export function groupApps(apps: AppWithCategory[], overrides: Record<string, AppGroupId> = {}): AppGroup[] {
  const buckets = new Map<AppGroupId, AppWithCategory[]>();
  for (const app of apps) {
    const id = classifyApp(app, overrides);
    const list = buckets.get(id) ?? [];
    list.push(app);
    buckets.set(id, list);
  }
  return APP_GROUPS.filter((g) => buckets.has(g.id)).map((g) => ({
    id: g.id,
    label: g.label,
    apps: buckets.get(g.id)!.sort((a, b) => a.label.localeCompare(b.label, 'pt-BR')),
  }));
}
