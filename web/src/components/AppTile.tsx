import { useState } from 'react';
import type { TileArt } from '../config';
import { useTvFocusable } from '../navigation/spatial';
import { bannerUrl, hasAppArt, iconUrl, launchApp, type InstalledApp } from '../services/native';
import styles from './AppTile.module.css';

interface Props {
  app: InstalledApp;
  focusKey: string;
  fallback?: TileArt;
}

type Art = 'banner' | 'icon' | 'text';

/**
 * Tile de app com a arte oficial: o banner do próprio app (320x180) ou, se ele não
 * tiver banner, o ícone sobre a cor do catálogo. No Fire Stick as artes vêm da casca
 * nativa; no `npm run dev`, de web/.dev-art (scripts/pull-app-art.sh). Nenhuma logo
 * de marca fica no repositório. Sem arte nenhuma → nome sobre a cor do catálogo.
 */
export function AppTile({ app, focusKey, fallback }: Props) {
  const [art, setArt] = useState<Art>(() => (hasAppArt() ? 'banner' : 'text'));
  const { ref, focused, pointerProps } = useTvFocusable({
    focusKey,
    onSelect: () => launchApp(app),
    scrollOnFocus: true,
  });

  return (
    <div
      ref={ref}
      {...pointerProps}
      className={`${styles.tile} ${focused ? styles.focused : ''}`}
      style={art === 'banner' ? undefined : { background: fallback?.background }}
      aria-label={app.label}
    >
      {art === 'banner' && (
        <img className={styles.banner} src={bannerUrl(app.packageName)} alt="" onError={() => setArt('icon')} />
      )}
      {art === 'icon' && (
        // Sem banner: ícone oficial com o nome embaixo (vários apps de sistema usam o
        // mesmo ícone padrão do Android, então só o ícone não basta para diferenciá-los).
        <div className={styles.iconArt}>
          <img className={styles.icon} src={iconUrl(app.packageName)} alt="" onError={() => setArt('text')} />
          <span className={styles.iconLabel} style={{ color: fallback?.color }}>
            {app.label}
          </span>
        </div>
      )}
      {art === 'text' && (
        <span className={styles.label} style={{ color: fallback?.color }}>
          {app.label}
        </span>
      )}
    </div>
  );
}
