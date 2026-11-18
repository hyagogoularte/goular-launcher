export interface ClimateDevice {
  id: string;
  name: string;
  isOn: boolean;
  currentTemp: number | null;
  targetTemp: number | null;
}

/**
 * Contrato de qualquer integração de ar-condicionado. Hoje: simulado e
 * Home Assistant. Para outra (SmartThings, Tuya, Sensibo...), implemente
 * esta interface e registre em ./index.ts.
 */
export interface ClimateProvider {
  readonly kind: string;
  list(): Promise<ClimateDevice[]>;
  setPower(id: string, on: boolean): Promise<void>;
  setTargetTemp(id: string, temp: number): Promise<void>;
}
