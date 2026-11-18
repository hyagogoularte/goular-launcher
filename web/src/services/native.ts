/**
 * Ponte com a casca Android (android/.../LauncherBridge.kt).
 * No Fire Stick, window.GoularNative é injetado pelo WebView. No navegador
 * (desenvolvimento) ele não existe e usamos dados simulados.
 */

interface NativeBridge {
  getInstalledApps(): string;
  launchApp(packageName: string): boolean;
  openSystemSettings(): void;
  getAppVersion(): string;
}

declare global {
  interface Window {
    GoularNative?: NativeBridge;
  }
}

export interface InstalledApp {
  packageName: string;
  label: string;
  /** Categoria declarada no Android 8+ (video, audio, game, image…), quando houver. */
  category?: string | null;
}

/** Eventos que a casca nativa dispara em window como `goular:<nome>`. */
export type NativeEvent = 'back' | 'resume' | 'home' | 'packages-changed';

const native = (): NativeBridge | undefined =>
  typeof window === 'undefined' ? undefined : window.GoularNative;

export const isNative = (): boolean => native() !== undefined;

/** Domínio servido pelo WebViewAssetLoader (ver AppIconPathHandler.kt). */
const ASSET_ORIGIN = 'http://appassets.androidplatform.net';

export function bannerUrl(packageName: string): string {
  return `${ASSET_ORIGIN}/appicons/banner/${encodeURIComponent(packageName)}`;
}

export function iconUrl(packageName: string): string {
  return `${ASSET_ORIGIN}/appicons/icon/${encodeURIComponent(packageName)}`;
}

const MOCK_APPS: InstalledApp[] = [
  'Netflix:com.netflix.ninja',
  'Disney+:com.disney.disneyplus',
  'Prime Video:com.amazon.avod',
  'Max:com.wbd.stream',
  'Crunchyroll:com.crunchyroll.crunchyroid',
  'YouTube:com.amazon.firetv.youtube',
  'Spotify:com.spotify.tv.android',
  'Globoplay:com.globo.globotv',
  'Plex:com.plexapp.android',
  'Kodi:org.xbmc.kodi',
  'Twitch:tv.twitch.android.viewer',
  'Apple TV:com.apple.atve.amazon.appletv',
  'Pluto TV:tv.pluto.android',
  'Downloader:com.esaba.downloader',
  'VLC:org.videolan.vlc',
  'Amazon Music:com.amazon.bueller.music',
  'Fotos:com.amazon.bueller.photos',
  'Configurações:com.amazon.tv.settings.v2',
].map((s) => {
  const [label, packageName] = s.split(':');
  return { label, packageName };
});

export function listInstalledApps(): InstalledApp[] {
  const bridge = native();
  let apps: InstalledApp[] = MOCK_APPS;
  if (bridge) {
    try {
      apps = JSON.parse(bridge.getInstalledApps()) as InstalledApp[];
    } catch (err) {
      console.error('[goular] getInstalledApps falhou', err);
      return [];
    }
  }
  return [...apps].sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
}

export function launchApp(app: InstalledApp): boolean {
  const bridge = native();
  if (!bridge) {
    notify(`Abrindo ${app.label} (simulado no navegador)`);
    return true;
  }
  const ok = bridge.launchApp(app.packageName);
  if (!ok) notify(`${app.label} não está instalado`);
  return ok;
}

export function openSystemSettings(): void {
  const bridge = native();
  if (bridge) bridge.openSystemSettings();
  else notify('Abrindo configurações do Fire TV (simulado)');
}

export function onNativeEvent(name: NativeEvent, handler: () => void): () => void {
  const type = `goular:${name}`;
  window.addEventListener(type, handler);
  return () => window.removeEventListener(type, handler);
}

/** Mensagem curta na tela (componente Toast escuta este evento). */
export function notify(message: string): void {
  window.dispatchEvent(new CustomEvent('goular:toast', { detail: message }));
}
