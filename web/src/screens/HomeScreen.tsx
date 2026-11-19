import { CirclePlay, Clapperboard, House, type LucideIcon } from 'lucide-react';
import { AppTile } from '../components/AppTile';
import { ClimateCard } from '../components/ClimateCard';
import { SectionTitle } from '../components/SectionTitle';
import { config, type HomeRowConfig } from '../config';
import { FocusGroup } from '../navigation/spatial';
import { byName } from '../services/appGroups';
import { artFor, labelFor } from '../services/catalog';
import { useClimate } from '../services/climate';
import styles from './Screens.module.css';

/** Foco inicial: primeiro app do primeiro bloco (Entretenimento). */
export const FIRST_FAVORITE_KEY = 'fav-0-0';

const ROW_ICONS: Record<HomeRowConfig['id'], LucideIcon> = {
  entertainment: Clapperboard,
  streaming: CirclePlay,
};

/** Apps de um bloco, sempre de A a Z pelo nome que aparece no tile. */
const sortedRow = (packages: string[]) =>
  packages.map((pkg) => ({ packageName: pkg, label: labelFor(pkg) })).sort((a, b) => byName(a.label, b.label));

export function HomeScreen() {
  const { devices } = useClimate();

  return (
    <>
      {/* Por enquanto só visualização: sem foco nem liga/desliga. Para reativar,
          volte a envolver em <FocusGroup focusKey="climate-row"> e passe
          onToggle={togglePower} de useClimate(). */}
      <section className={styles.section}>
        <SectionTitle Icon={House}>Casa</SectionTitle>
        <div className={styles.climateRow}>
          {devices.map((d) => (
            <ClimateCard key={d.id} device={d} />
          ))}
        </div>
      </section>

      {config.homeRows.map((row, ri) => (
        <section key={row.id} className={styles.section}>
          <SectionTitle Icon={ROW_ICONS[row.id]}>{row.title}</SectionTitle>
          <FocusGroup focusKey={`home-row-${row.id}`} className={styles.favoritesRow}>
            {sortedRow(row.packages).map((app, i) => (
              <AppTile key={app.packageName} focusKey={`fav-${ri}-${i}`} app={app} fallback={artFor(app.packageName)} />
            ))}
          </FocusGroup>
        </section>
      ))}
    </>
  );
}
