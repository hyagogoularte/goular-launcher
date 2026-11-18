import { CirclePlay, House } from 'lucide-react';
import { AppTile } from '../components/AppTile';
import { ClimateCard } from '../components/ClimateCard';
import { SectionTitle } from '../components/SectionTitle';
import { config } from '../config';
import { FocusGroup } from '../navigation/spatial';
import { useClimate } from '../services/climate';
import styles from './Screens.module.css';

export const FIRST_FAVORITE_KEY = 'fav-0';

export function HomeScreen() {
  const { devices, togglePower } = useClimate();

  return (
    <>
      <section className={styles.section}>
        <SectionTitle Icon={House}>Casa</SectionTitle>
        <FocusGroup focusKey="climate-row" className={styles.climateRow}>
          {devices.map((d) => (
            <ClimateCard key={d.id} device={d} onToggle={togglePower} />
          ))}
        </FocusGroup>
      </section>

      <section className={styles.section}>
        <SectionTitle Icon={CirclePlay}>Favoritos</SectionTitle>
        <FocusGroup focusKey="favorites-row" className={styles.favoritesRow}>
          {config.favorites.map((f, i) => (
            <AppTile
              key={f.packageName}
              focusKey={`fav-${i}`}
              app={{ packageName: f.packageName, label: f.label }}
              fallback={f.fallback}
            />
          ))}
        </FocusGroup>
      </section>
    </>
  );
}
