import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import { Settings } from 'lucide-react';
import { config, type CityConfig } from '../config';
import { formatDateLabel, formatTemp, formatTime, greetingFor } from '../lib/format';
import { useNow } from '../lib/useNow';
import { openSystemSettings } from '../services/native';
import { useWeather } from '../services/weather';
import { WeatherIcon } from './WeatherIcon';
import styles from './Header.module.css';

function WeatherBlock({ city }: { city: CityConfig }) {
  const weather = useWeather(city);
  return (
    <div className={styles.weather}>
      <WeatherIcon kind={weather?.icon ?? 'cloud'} size="5.5rem" />
      <div>
        <div className={styles.city}>{city.name}</div>
        <div className={styles.weatherLine}>
          <span className={styles.temp}>{formatTemp(weather?.temperature)}</span>
          <span className={styles.condition}>{weather?.label ?? '…'}</span>
        </div>
      </div>
    </div>
  );
}

function SettingsButton() {
  const { ref, focused } = useFocusable({ focusKey: 'settings', onEnterPress: openSystemSettings });
  return (
    <div ref={ref} className={`${styles.settings} ${focused ? styles.focused : ''}`} aria-label="Configurações">
      <Settings size="2.25rem" strokeWidth={2} />
    </div>
  );
}

export function Header() {
  const now = useNow();
  return (
    <header className={styles.header}>
      <div className={styles.greeting}>
        <h1 className={styles.title}>
          {greetingFor(now)}, {config.userName}.
        </h1>
        <p className={styles.subtitle}>{config.subtitle}</p>
        <span className={styles.underline} />
      </div>

      {config.cities.map((city) => (
        <div key={city.name} className={styles.block}>
          <span className={styles.divider} />
          <WeatherBlock city={city} />
        </div>
      ))}

      <div className={styles.block}>
        <span className={styles.divider} />
        <div className={styles.clock}>
          <div className={styles.time}>{formatTime(now)}</div>
          <div className={styles.date}>{formatDateLabel(now)}</div>
        </div>
      </div>

      <SettingsButton />
    </header>
  );
}
