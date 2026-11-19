import {
  CirclePlay,
  Clapperboard,
  Film,
  Gamepad2,
  LayoutGrid,
  Music,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AppTile } from '../components/AppTile';
import { SectionTitle } from '../components/SectionTitle';
import { config } from '../config';
import { FocusGroup } from '../navigation/spatial';
import { groupApps, type AppGroupId } from '../services/appGroups';
import { artFor, HOME_PACKAGES, labelFor } from '../services/catalog';
import { listInstalledApps, onNativeEvent, type InstalledApp } from '../services/native';
import styles from './Screens.module.css';

/** Foco inicial ao abrir a aba: primeiro app do primeiro grupo. */
export const FIRST_APP_KEY = 'app-0-0';

const GROUP_ICONS: Record<AppGroupId, LucideIcon> = {
  streaming: Film,
  video: CirclePlay,
  music: Music,
  media: Clapperboard,
  games: Gamepad2,
  system: Wrench,
  other: LayoutGrid,
};

/**
 * "Todos os aplicativos": ocupa o lugar dos blocos do Início com uma seção por
 * grupo (Filmes e séries, Música…). Os apps que já estão no Início não se repetem.
 */
export function AllAppsScreen() {
  const [apps, setApps] = useState<InstalledApp[]>(() => listInstalledApps());
  const groups = useMemo(
    () =>
      groupApps(
        apps
          .filter((a) => !HOME_PACKAGES.has(a.packageName))
          .map((a) => ({ ...a, label: labelFor(a.packageName, a.label) })),
        config.appGroupOverrides,
        config.hiddenApps,
      ),
    [apps],
  );

  useEffect(() => {
    const reload = () => setApps(listInstalledApps());
    const offs = [onNativeEvent('packages-changed', reload), onNativeEvent('resume', reload)];
    return () => offs.forEach((off) => off());
  }, []);

  return (
    // roda do mouse: a grade não tem barra de rolagem (overflow: hidden), então rola à mão
    <div className={styles.scroller} data-scroller onWheel={(e) => (e.currentTarget.scrollTop += e.deltaY)}>
      {groups.map((group, gi) => (
        <section key={group.id} className={styles.groupSection} data-scroll-anchor>
          <SectionTitle Icon={GROUP_ICONS[group.id]}>{`${group.label} (${group.apps.length})`}</SectionTitle>
          <FocusGroup focusKey={`apps-${group.id}`} className={styles.appsGrid}>
            {group.apps.map((app, ai) => (
              <AppTile
                key={app.packageName}
                focusKey={`app-${gi}-${ai}`}
                app={app}
                fallback={artFor(app.packageName)}
              />
            ))}
          </FocusGroup>
        </section>
      ))}
    </div>
  );
}
