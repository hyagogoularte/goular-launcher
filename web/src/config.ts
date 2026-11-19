/**
 * Configuração pessoal do launcher. Edite aqui nomes, cidades, blocos do Início e cômodos.
 * Segredos (token do Home Assistant) ficam em web/.env.local — ver .env.example.
 */

import type { AppGroupId } from './services/appGroups';

export interface CityConfig {
  name: string;
  latitude: number;
  longitude: number;
}

/** Visual de reserva do tile (navegador ou app sem banner): fundo e cor do texto. */
export interface TileArt {
  background: string;
  color: string;
}

export interface CatalogEntry {
  label: string;
  art: TileArt;
}

export interface HomeRowConfig {
  /** Escolhe o ícone do título em HomeScreen.tsx. */
  id: 'entertainment' | 'streaming';
  title: string;
  /** Pacotes Android (até 6; exibidos de A a Z). Confirme com scripts/list-apps.sh. */
  packages: string[];
}

const art = (from: string, to: string, color = '#ffffff'): TileArt => ({
  background: `linear-gradient(160deg, ${from}, ${to})`,
  color,
});

/**
 * Catálogo de apps (docs/06-apps.md): nome e visual de reserva. No Fire TV o tile
 * usa o banner do próprio app, a mesma arte da tela inicial da Amazon; este visual
 * só aparece no navegador ou para app sem banner. Sem logos no repositório.
 */
const appCatalog: Record<string, CatalogEntry> = {
  // Filmes e séries
  'com.netflix.ninja': { label: 'Netflix', art: art('#1a1a1a', '#050505', '#e50914') },
  'com.amazon.firebat': { label: 'Prime Video', art: art('#1f8fff', '#0a4fc4') },
  'com.crunchyroll.crunchyroid': { label: 'Crunchyroll', art: art('#ff7a1a', '#e14a00') },
  'com.hbo.hbonow': { label: 'HBO Max', art: art('#1b1f3a', '#05060f') },
  'com.apple.atve.amazon.appletv': { label: 'Apple TV', art: art('#2b2b2e', '#0d0d0f') },
  'com.disney.disneyplus': { label: 'Disney+', art: art('#123a8c', '#071b4d') },
  'com.globo.globotv': { label: 'Globoplay', art: art('#ff3b30', '#c4001a') },
  'com.cbs.ott': { label: 'Paramount+', art: art('#0b5cff', '#0033a8') },
  'com.paramountplus.android.tv': { label: 'Paramount+', art: art('#0b5cff', '#0033a8') },
  'com.mubi': { label: 'MUBI', art: art('#1c1c1c', '#000000') },
  'com.stremio.one': { label: 'Stremio', art: art('#5b3fa8', '#2a1a5e') },
  // Vídeos e ao vivo
  'com.amazon.firetv.youtube': { label: 'YouTube', art: art('#ffffff', '#e9e9e9', '#ff0000') },
  'tv.twitch.android.viewer': { label: 'Twitch', art: art('#9146ff', '#6a2ad8') },
  'com.formulaone.production': { label: 'F1 TV', art: art('#ff1e00', '#c01600') },
  'com.amazon.hedwig': { label: 'Notícias', art: art('#232f3e', '#131a22') },
  'com.amazon.tahoe': { label: 'Amazon Kids', art: art('#00a8e1', '#0072a8') },
  'com.amazon.minitv.android.app': { label: 'Amazon miniTV', art: art('#232f3e', '#131a22') },
  'com.liskovsoft.smarttubetv.beta': { label: 'SmartTube', art: art('#e62117', '#a3140d') },
  'com.google.android.youtube.tvkids': { label: 'YouTube Kids', art: art('#ff4e45', '#d32f2f') },
  'tv.pluto.android': { label: 'Pluto TV', art: art('#2a2a2a', '#000000', '#fff200') },
  // Música e áudio
  'com.spotify.tv.android': { label: 'Spotify', art: art('#1f1f1f', '#0a0a0a', '#1ed760') },
  'com.amazon.bueller.music': { label: 'Amazon Music', art: art('#25d1da', '#0f8e9a', '#0b1a2b') },
  'deezer.android.tv': { label: 'Deezer', art: art('#a238ff', '#5b1fa8') },
  // Mídia e players
  'com.amazon.bueller.photos': { label: 'Amazon Photos', art: art('#1a98ff', '#0a5fc4') },
  'com.plexapp.android': { label: 'Plex', art: art('#282a2d', '#111214', '#e5a00d') },
  'org.jellyfin.androidtv': { label: 'Jellyfin', art: art('#7a3fd1', '#0f6fb3') },
  'org.xbmc.kodi': { label: 'Kodi', art: art('#17b2e7', '#0d6f94') },
  'org.videolan.vlc': { label: 'VLC', art: art('#ff8800', '#d95f00') },
  // Jogos
  'com.amazon.spiderpork': { label: 'Amazon Luna', art: art('#8c4dff', '#5a1fd1') },
  'com.amazon.gamehub': { label: 'Amazon Game Center', art: art('#232f3e', '#131a22', '#ff9900') },
  // Utilitários e sistema
  'com.amazon.venezia': { label: 'Appstore', art: art('#ff9900', '#e47911', '#131a22') },
  'com.amazon.cloud9': { label: 'Amazon Silk', art: art('#139a9c', '#0a6a6c') },
  'com.amazon.ftv.profilepicker': { label: 'Perfis', art: art('#2c3a55', '#18213a') },
  'com.amazon.firetv.troubleshooting': { label: 'Solução de problemas', art: art('#2c3a55', '#18213a') },
  'com.amazon.whasettings': { label: 'Configurações da Amazon', art: art('#2c3a55', '#18213a') },
  'com.amazon.smarthomemapviewapp': { label: 'Alexa Smart Home', art: art('#00caff', '#0083b8') },
  'com.amazon.tv.earlyaccess': { label: 'Early Access', art: art('#2c3a55', '#18213a') },
  'com.esaba.downloader': { label: 'Downloader', art: art('#ff7f00', '#d35400') },
  'com.lonelycatgames.Xplore': { label: 'X-plore', art: art('#2e7d32', '#1b4d1e') },
  'com.yablio.sendfilestotv': { label: 'Send Files to TV', art: art('#1976d2', '#0d47a1') },
};

/** Fundo da tela: smoke (quase preto, ondas de fumaça) ou classic (azul → roxo). */
export type BackgroundVariant = 'smoke' | 'classic';

export interface RoomConfig {
  name: string;
  /** entity_id do Home Assistant (domínio climate). */
  entityId: string;
}

export const config = {
  userName: 'patrão',
  subtitle: 'Tudo pronto para assistir?',

  background: 'smoke' as BackgroundVariant,

  cities: [
    { name: 'Florianópolis', latitude: -27.5954, longitude: -48.548 },
  ] satisfies CityConfig[],

  /**
   * Blocos de apps do Início, de cima para baixo. Dentro de cada bloco os apps aparecem
   * de A a Z, qualquer que seja a ordem aqui. Os demais ficam em "Todos os aplicativos".
   */
  homeRows: [
    {
      id: 'entertainment',
      title: 'Entretenimento',
      packages: [
        'com.netflix.ninja',
        'com.amazon.firebat', // Prime Video
        'com.crunchyroll.crunchyroid',
        'com.hbo.hbonow', // HBO Max
        'com.apple.atve.amazon.appletv',
        'com.disney.disneyplus',
      ],
    },
    {
      id: 'streaming',
      title: 'Streaming',
      packages: ['com.amazon.firetv.youtube', 'tv.twitch.android.viewer', 'com.spotify.tv.android'],
    },
  ] satisfies HomeRowConfig[],

  appCatalog,

  /**
   * Corrige o grupo de um app em "Todos os aplicativos" (pacote → grupo).
   * Grupos: streaming, video, music, media, games, system, other.
   */
  appGroupOverrides: {} as Record<string, AppGroupId>,

  /** Pacotes que não devem aparecer em "Todos os aplicativos" (além dos de sistema já ocultos). */
  hiddenApps: [
    'com.amazon.minitv.android.app', // Amazon miniTV: só funciona na Índia
    'com.amazon.shoptv.firetv.client', // Amazon Live Shopping
  ] as string[],

  climate: {
    homeAssistantUrl: (import.meta.env?.VITE_HA_URL as string | undefined) ?? '',
    homeAssistantToken: (import.meta.env?.VITE_HA_TOKEN as string | undefined) ?? '',
    /** Sem Home Assistant os cards mostram "–". VITE_CLIMATE_MOCK=1 usa valores de exemplo. */
    mock: import.meta.env?.VITE_CLIMATE_MOCK === '1',
    pollMs: 30_000,
    rooms: [
      { name: 'Sala', entityId: 'climate.sala' },
      { name: 'Escritório', entityId: 'climate.escritorio' },
      { name: 'Quarto Antônio', entityId: 'climate.quarto_antonio' },
      { name: 'Suíte Casal', entityId: 'climate.suite_casal' },
    ] satisfies RoomConfig[],
  },

  weatherRefreshMs: 15 * 60_000,
};
