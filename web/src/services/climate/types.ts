import type { RoomConfig } from '../../config';

export interface ClimateDevice {
  id: string;
  name: string;
  /** false: sem dados (integração não configurada, aparelho fora do ar ou erro). */
  available: boolean;
  isOn: boolean;
  currentTemp: number | null;
  targetTemp: number | null;
}

/** Aparelho sem dados: o card mostra "–" no tom de desligado. */
export function unavailableDevice(room: RoomConfig): ClimateDevice {
  return { id: room.entityId, name: room.name, available: false, isOn: false, currentTemp: null, targetTemp: null };
}

/**
 * Contrato de qualquer integração de ar-condicionado. Hoje: Home Assistant
 * e simulado (só com VITE_CLIMATE_MOCK=1). Para outra (SmartThings, Tuya, Sensibo...), implemente
 * esta interface e registre em ./index.ts.
 */
export interface ClimateProvider {
  readonly kind: string;
  list(): Promise<ClimateDevice[]>;
  setPower(id: string, on: boolean): Promise<void>;
  setTargetTemp(id: string, temp: number): Promise<void>;
}
