import { describe, expect, it } from 'vitest';
import { classifyApp, groupApps } from './appGroups';

const app = (packageName: string, label: string, category?: string) => ({ packageName, label, category });

describe('classifyApp', () => {
  it('usa pacotes conhecidos', () => {
    expect(classifyApp(app('com.netflix.ninja', 'Netflix'))).toBe('streaming');
    expect(classifyApp(app('com.spotify.tv.android', 'Spotify'))).toBe('music');
    expect(classifyApp(app('org.xbmc.kodi', 'Kodi'))).toBe('media');
  });

  it('override da configuração vence tudo', () => {
    expect(classifyApp(app('com.netflix.ninja', 'Netflix'), { 'com.netflix.ninja': 'other' })).toBe('other');
  });

  it('usa a categoria do Android quando o pacote é desconhecido', () => {
    expect(classifyApp(app('com.exemplo.corrida', 'Corrida', 'game'))).toBe('games');
    expect(classifyApp(app('com.exemplo.som', 'Som', 'audio'))).toBe('music');
  });

  it('cai em palavras-chave e depois em Outros', () => {
    expect(classifyApp(app('com.exemplo.radio', 'Rádio Floripa'))).toBe('music');
    expect(classifyApp(app('com.exemplo.files', 'Gerenciador'))).toBe('system');
    expect(classifyApp(app('com.exemplo.x', 'Coisa'))).toBe('other');
  });
});

describe('groupApps', () => {
  it('agrupa na ordem fixa, ordena por nome e omite grupos vazios', () => {
    const groups = groupApps([
      app('com.spotify.tv.android', 'Spotify'),
      app('com.wbd.stream', 'Max'),
      app('com.netflix.ninja', 'Netflix'),
      app('com.disney.disneyplus', 'Disney+'),
    ]);
    expect(groups.map((g) => g.id)).toEqual(['streaming', 'music']);
    expect(groups[0].apps.map((a) => a.label)).toEqual(['Disney+', 'Max', 'Netflix']);
  });
});
