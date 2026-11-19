import { afterEach, describe, expect, it, vi } from 'vitest';
import { HomeAssistantClimateProvider } from './homeAssistant';

const rooms = [
  { name: 'Sala', entityId: 'climate.sala' },
  { name: 'Escritório', entityId: 'climate.escritorio' },
  { name: 'Suíte', entityId: 'climate.suite' },
];

function stubStates(states: Record<string, object | 'erro'>) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const id = url.split('/').pop() ?? '';
      const body = states[id];
      if (body === 'erro' || body === undefined) return new Response('', { status: 500 });
      return new Response(JSON.stringify(body), { status: 200 });
    }),
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('HomeAssistantClimateProvider.list', () => {
  it('marca como sem dados aparelho indisponível ou com erro, e lê os demais', async () => {
    stubStates({
      'climate.sala': { state: 'cool', attributes: { current_temperature: 23.4, temperature: 22 } },
      'climate.escritorio': { state: 'unavailable', attributes: {} },
      'climate.suite': 'erro',
    });
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    const [sala, escritorio, suite] = await new HomeAssistantClimateProvider('http://ha', 't', rooms).list();

    expect(sala).toMatchObject({ available: true, isOn: true, currentTemp: 23.4, targetTemp: 22 });
    for (const d of [escritorio, suite]) {
      expect(d).toMatchObject({ available: false, isOn: false, currentTemp: null, targetTemp: null });
    }
  });

  it('desligado continua com dados', async () => {
    stubStates({ 'climate.sala': { state: 'off', attributes: { current_temperature: 25 } } });
    const [sala] = await new HomeAssistantClimateProvider('http://ha', 't', rooms.slice(0, 1)).list();
    expect(sala).toMatchObject({ available: true, isOn: false, currentTemp: 25 });
  });
});
