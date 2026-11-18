import type { RoomConfig } from '../../config';
import type { ClimateDevice, ClimateProvider } from './types';

interface HaState {
  entity_id: string;
  state: string;
  attributes: { current_temperature?: number; temperature?: number };
}

/**
 * Integração com Home Assistant via REST API.
 * Requisitos no HA (configuration.yaml), ver docs/05-integracoes.md:
 *   http:
 *     cors_allowed_origins:
 *       - http://appassets.androidplatform.net
 *       - http://localhost:5173
 */
export class HomeAssistantClimateProvider implements ClimateProvider {
  readonly kind = 'home-assistant';

  constructor(
    private readonly baseUrl: string,
    private readonly token: string,
    private readonly rooms: RoomConfig[],
  ) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl.replace(/\/$/, '')}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`Home Assistant ${res.status} em ${path}`);
    return (await res.json()) as T;
  }

  async list(): Promise<ClimateDevice[]> {
    return Promise.all(
      this.rooms.map(async (room) => {
        try {
          const s = await this.request<HaState>(`/api/states/${room.entityId}`);
          return {
            id: room.entityId,
            name: room.name,
            isOn: s.state !== 'off' && s.state !== 'unavailable',
            currentTemp: s.attributes.current_temperature ?? null,
            targetTemp: s.attributes.temperature ?? null,
          };
        } catch (err) {
          console.warn('[goular] HA', room.entityId, err);
          return { id: room.entityId, name: room.name, isOn: false, currentTemp: null, targetTemp: null };
        }
      }),
    );
  }

  async setPower(id: string, on: boolean) {
    await this.request(`/api/services/climate/${on ? 'turn_on' : 'turn_off'}`, {
      method: 'POST',
      body: JSON.stringify({ entity_id: id }),
    });
  }

  async setTargetTemp(id: string, temp: number) {
    await this.request('/api/services/climate/set_temperature', {
      method: 'POST',
      body: JSON.stringify({ entity_id: id, temperature: temp }),
    });
  }
}
