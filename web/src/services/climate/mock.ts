import type { RoomConfig } from '../../config';
import type { ClimateDevice, ClimateProvider } from './types';

/** Valores da imagem de referência, para desenvolver sem Home Assistant. */
const SEED: Record<string, Omit<ClimateDevice, 'id' | 'name'>> = {
  Sala: { isOn: false, currentTemp: 23, targetTemp: 22 },
  Escritório: { isOn: true, currentTemp: 20, targetTemp: 22 },
  'Quarto Antônio': { isOn: true, currentTemp: 23, targetTemp: 22 },
  'Suíte Casal': { isOn: true, currentTemp: 22, targetTemp: 22 },
};

export class MockClimateProvider implements ClimateProvider {
  readonly kind = 'mock';
  private devices: ClimateDevice[];

  constructor(rooms: RoomConfig[]) {
    this.devices = rooms.map((r) => ({
      id: r.entityId,
      name: r.name,
      ...(SEED[r.name] ?? { isOn: false, currentTemp: 24, targetTemp: 22 }),
    }));
  }

  async list() {
    return this.devices.map((d) => ({ ...d }));
  }

  async setPower(id: string, on: boolean) {
    this.devices = this.devices.map((d) => (d.id === id ? { ...d, isOn: on } : d));
  }

  async setTargetTemp(id: string, temp: number) {
    this.devices = this.devices.map((d) => (d.id === id ? { ...d, targetTemp: temp } : d));
  }
}
