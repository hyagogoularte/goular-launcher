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

/** `npm run dev` no navegador: artes copiadas do Fire TV (scripts/pull-app-art.sh). */
const isDevPreview = (): boolean => !isNative() && import.meta.env?.DEV === true;

/** Há de onde tirar a arte oficial dos apps: a casca nativa ou o preview de desenvolvimento. */
export const hasAppArt = (): boolean => isNative() || isDevPreview();

function artUrl(kind: 'banner' | 'icon', packageName: string): string {
  const base = isDevPreview() ? '/dev-art' : `${ASSET_ORIGIN}/appicons`;
  return `${base}/${kind}/${encodeURIComponent(packageName)}`;
}

export const bannerUrl = (packageName: string): string => artUrl('banner', packageName);
export const iconUrl = (packageName: string): string => artUrl('icon', packageName);

/** Espelha o Fire TV Stick 4K de casa (scripts/list-apps.sh, nov/2026). */
const MOCK_APPS: InstalledApp[] = [
  'Netflix:com.netflix.ninja',
  'Disney+:com.disney.disneyplus',
  'Prime Video:com.amazon.firebat',
  'HBO Max:com.hbo.hbonow',
  'Crunchyroll:com.crunchyroll.crunchyroid',
  'Apple TV:com.apple.atve.amazon.appletv',
  'YouTube:com.amazon.firetv.youtube',
  'Twitch:tv.twitch.android.viewer',
  'F1 TV:com.formulaone.production',
  'Notícias:com.amazon.hedwig',
  'Amazon Kids:com.amazon.tahoe',
  'Amazon miniTV:com.amazon.minitv.android.app',
  'Spotify:com.spotify.tv.android',
  'Amazon Music:com.amazon.bueller.music',
  'Amazon Photos:com.amazon.bueller.photos',
  'Amazon Luna:com.amazon.spiderpork',
  'Amazon Game Center:com.amazon.gamehub',
  'Appstore:com.amazon.venezia',
  'Amazon Silk:com.amazon.cloud9',
  'Interface do perfil do Fire TV:com.amazon.ftv.profilepicker',
  'FireTV Troubleshooting:com.amazon.firetv.troubleshooting',
  'Configurações da Amazon:com.amazon.whasettings',
  'Alexa Smart Home:com.amazon.smarthomemapviewapp',
  'Early Access:com.amazon.tv.earlyaccess',
  'Amazon Live Shopping:com.amazon.shoptv.firetv.client',
  'Monitor do estado do sistema:com.amazon.ssm',
  'Início:com.amazon.tv.launcher',
  'Protetor de tela:com.amazon.ftv.screensaver',
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
  return [...apps].sort((a, b) => a.label.localeCompare(b.label, 'pt-BR', { sensitivity: 'base' }));
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
