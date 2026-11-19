import { useCallback, useEffect, useState } from 'react';
import { config, type RoomConfig } from '../../config';
import { notify, onNativeEvent } from '../native';
import { HomeAssistantClimateProvider } from './homeAssistant';
import { MockClimateProvider } from './mock';
import { type ClimateDevice, type ClimateProvider, unavailableDevice } from './types';

export type { ClimateDevice } from './types';

/** Sem integração configurada: todos os cômodos sem dados ("–", tom de desligado). */
class UnconfiguredClimateProvider implements ClimateProvider {
  readonly kind = 'none';
  constructor(private readonly rooms: RoomConfig[]) {}
  async list() {
    return this.rooms.map(unavailableDevice);
  }
  async setPower(): Promise<void> {
    throw new Error('ar-condicionado sem integração configurada');
  }
  async setTargetTemp(): Promise<void> {
    throw new Error('ar-condicionado sem integração configurada');
  }
}

function createProvider(): ClimateProvider {
  const { homeAssistantUrl, homeAssistantToken, mock, rooms } = config.climate;
  if (homeAssistantUrl && homeAssistantToken) {
    return new HomeAssistantClimateProvider(homeAssistantUrl, homeAssistantToken, rooms);
  }
  return mock ? new MockClimateProvider(rooms) : new UnconfiguredClimateProvider(rooms);
}

const provider = createProvider();

/** Lista de ar-condicionados com polling e alternância otimista de energia. */
export function useClimate() {
  const [devices, setDevices] = useState<ClimateDevice[]>(() => config.climate.rooms.map(unavailableDevice));

  const refresh = useCallback(() => {
    provider.list().then(setDevices).catch((err) => console.warn('[goular] clima casa', err));
  }, []);

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, config.climate.pollMs);
    const off = onNativeEvent('resume', refresh);
    return () => {
      window.clearInterval(timer);
      off();
    };
  }, [refresh]);

  const togglePower = useCallback(
    (id: string) => {
      const device = devices.find((d) => d.id === id);
      if (!device?.available) return;
      const next = !device.isOn;
      setDevices((list) => list.map((d) => (d.id === id ? { ...d, isOn: next } : d)));
      provider
        .setPower(id, next)
        .catch((err) => {
          console.warn('[goular] setPower', err);
          notify(`Não consegui ${next ? 'ligar' : 'desligar'} ${device.name}`);
          setDevices((list) => list.map((d) => (d.id === id ? { ...d, isOn: !next } : d)));
        });
    },
    [devices],
  );

  return { devices, togglePower, providerKind: provider.kind };
}
