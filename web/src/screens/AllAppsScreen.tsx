import { LayoutGrid } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AppTile } from '../components/AppTile';
import { SectionTitle } from '../components/SectionTitle';
import { config } from '../config';
import { FocusGroup } from '../navigation/spatial';
import { listInstalledApps, onNativeEvent, type InstalledApp } from '../services/native';
import styles from './Screens.module.css';

export const FIRST_APP_KEY = 'app-0';

const fallbackFor = (pkg: string) => config.favorites.find((f) => f.packageName === pkg)?.fallback;

export function AllAppsScreen() {
  const [apps, setApps] = useState<InstalledApp[]>(() => listInstalledApps());

  useEffect(() => {
    const reload = () => setApps(listInstalledApps());
    const offs = [onNativeEvent('packages-changed', reload), onNativeEvent('resume', reload)];
    return () => offs.forEach((off) => off());
  }, []);

  return (
    <section className={`${styles.section} ${styles.fill}`}>
      <SectionTitle Icon={LayoutGrid}>{`Todos os aplicativos (${apps.length})`}</SectionTitle>
      <div className={styles.scroller}>
        <FocusGroup focusKey="apps-grid" className={styles.appsGrid}>
          {apps.map((app, i) => (
            <AppTile key={app.packageName} focusKey={`app-${i}`} app={app} fallback={fallbackFor(app.packageName)} />
          ))}
        </FocusGroup>
      </div>
    </section>
  );
}
