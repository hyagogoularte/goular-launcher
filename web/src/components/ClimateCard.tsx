import { AirVent, Power } from 'lucide-react';
import { formatTemp } from '../lib/format';
import { useTvFocusable } from '../navigation/spatial';
import type { ClimateDevice } from '../services/climate';
import styles from './ClimateCard.module.css';

interface Props {
  device: ClimateDevice;
  /** Sem `onToggle` o card é só visualização (não recebe foco). */
  onToggle?: (id: string) => void;
}

/** Card de um ar-condicionado. Com `onToggle`, OK no controle liga/desliga. */
export function ClimateCard({ device, onToggle }: Props) {
  const { ref, focused, pointerProps } = useTvFocusable({
    focusKey: `climate-${device.id}`,
    onSelect: () => onToggle?.(device.id),
    focusable: onToggle != null,
  });

  return (
    <div
      ref={ref}
      {...pointerProps}
      className={`${styles.card} ${focused ? styles.focused : ''}`}
      aria-label={`${device.name}, ${device.isOn ? 'ligado' : 'desligado'}`}
    >
      <div className={styles.icon}>
        <AirVent size="4rem" strokeWidth={1.4} />
      </div>
      <span className={styles.divider} />
      <div className={styles.body}>
        <div className={styles.row}>
          <span className={styles.name}>{device.name}</span>
          <span className={`${styles.power} ${device.isOn ? styles.on : ''}`}>
            <Power size="2rem" strokeWidth={2.5} />
          </span>
        </div>
        <div className={styles.row}>
          <span className={styles.temp}>{formatTemp(device.currentTemp)}</span>
          {device.isOn && device.targetTemp != null && (
            <span className={styles.target}>({formatTemp(device.targetTemp)})</span>
          )}
        </div>
      </div>
    </div>
  );
}
