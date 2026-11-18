import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import { useState } from 'react';
import type { FavoriteConfig } from '../config';
import { scrollIntoViewIfNeeded } from '../navigation/spatial';
import { bannerUrl, iconUrl, isNative, launchApp, type InstalledApp } from '../services/native';
import styles from './AppTile.module.css';

interface Props {
  app: InstalledApp;
  focusKey: string;
  fallback?: FavoriteConfig['fallback'];
}

type Art = 'banner' | 'icon' | 'text';

/**
 * Tile de app. No Fire Stick usa o banner oficial do próprio app (320x180,
 * servido pela casca nativa), então nenhuma logo de marca fica no repositório.
 * Sem banner → ícone; sem ícone (ou no navegador) → nome sobre fundo da marca.
 */
export function AppTile({ app, focusKey, fallback }: Props) {
  const [art, setArt] = useState<Art>(() => (isNative() ? 'banner' : 'text'));
  const { ref, focused } = useFocusable({
    focusKey,
    onEnterPress: () => launchApp(app),
    onFocus: () => scrollIntoViewIfNeeded(ref.current),
  });

  return (
    <div
      ref={ref}
      className={`${styles.tile} ${focused ? styles.focused : ''}`}
      style={art === 'banner' ? undefined : { background: fallback?.background }}
      aria-label={app.label}
    >
      {art === 'banner' && (
        <img className={styles.banner} src={bannerUrl(app.packageName)} alt="" onError={() => setArt('icon')} />
      )}
      {art === 'icon' && (
        <img className={styles.icon} src={iconUrl(app.packageName)} alt="" onError={() => setArt('text')} />
      )}
      {art === 'text' && (
        <span className={styles.label} style={{ color: fallback?.color }}>
          {app.label}
        </span>
      )}
    </div>
  );
}
