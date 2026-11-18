/**
 * Configuração pessoal do launcher. Edite aqui nomes, cidades, favoritos e cômodos.
 * Segredos (token do Home Assistant) ficam em web/.env.local — ver .env.example.
 */

import type { AppGroupId } from './services/appGroups';

export interface CityConfig {
  name: string;
  latitude: number;
  longitude: number;
}

export interface FavoriteConfig {
  /** Pacote Android. Confirme no aparelho: adb shell pm list packages | grep -i <nome> */
  packageName: string;
  label: string;
  /** Visual de reserva (navegador ou app sem banner): fundo e cor do texto. */
  fallback: { background: string; color: string };
}

export interface RoomConfig {
  name: string;
  /** entity_id do Home Assistant (domínio climate). */
  entityId: string;
}

export const config = {
  userName: 'patrão',
  subtitle: 'Tudo pronto para assistir?',

  cities: [
    { name: 'Florianópolis', latitude: -27.5954, longitude: -48.548 },
    { name: 'Paris', latitude: 48.8566, longitude: 2.3522 },
  ] satisfies CityConfig[],

  favorites: [
    {
      packageName: 'com.netflix.ninja',
      label: 'Netflix',
      fallback: { background: 'linear-gradient(160deg, #1a1a1a, #050505)', color: '#e50914' },
    },
    {
      packageName: 'com.disney.disneyplus',
      label: 'Disney+',
      fallback: { background: 'linear-gradient(160deg, #123a8c, #071b4d)', color: '#ffffff' },
    },
    {
      packageName: 'com.amazon.avod',
      label: 'Prime Video',
      fallback: { background: 'linear-gradient(160deg, #1f8fff, #0a4fc4)', color: '#ffffff' },
    },
    {
      packageName: 'com.wbd.stream',
      label: 'Max',
      fallback: { background: 'linear-gradient(160deg, #6a2cf5, #3a12b8)', color: '#ffffff' },
    },
    {
      packageName: 'com.crunchyroll.crunchyroid',
      label: 'Crunchyroll',
      fallback: { background: 'linear-gradient(160deg, #ff7a1a, #e14a00)', color: '#ffffff' },
    },
    {
      packageName: 'com.amazon.firetv.youtube',
      label: 'YouTube',
      fallback: { background: 'linear-gradient(160deg, #2a2d36, #15171d)', color: '#ffffff' },
    },
  ] satisfies FavoriteConfig[],

  /**
   * Corrige o grupo de um app em "Todos os aplicativos" (pacote → grupo).
   * Grupos: streaming, video, music, media, games, system, other.
   */
  appGroupOverrides: {} as Record<string, AppGroupId>,

  climate: {
    homeAssistantUrl: (import.meta.env.VITE_HA_URL as string | undefined) ?? '',
    homeAssistantToken: (import.meta.env.VITE_HA_TOKEN as string | undefined) ?? '',
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
