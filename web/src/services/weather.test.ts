import { describe, expect, it } from 'vitest';
import { describeWeather } from './weather';

describe('describeWeather', () => {
  it('céu limpo depende de dia/noite', () => {
    expect(describeWeather(0, true)).toEqual({ label: 'Ensolarado', icon: 'sun' });
    expect(describeWeather(0, false)).toEqual({ label: 'Céu limpo', icon: 'moon' });
  });

  it('mapeia grupos WMO', () => {
    expect(describeWeather(3, true).label).toBe('Nublado');
    expect(describeWeather(45, true).icon).toBe('fog');
    expect(describeWeather(53, true).label).toBe('Garoa');
    expect(describeWeather(81, false).icon).toBe('rain');
    expect(describeWeather(73, true).icon).toBe('snow');
    expect(describeWeather(96, true).icon).toBe('storm');
  });

  it('código desconhecido cai em nublado', () => {
    expect(describeWeather(4, true).icon).toBe('cloud');
  });
});
