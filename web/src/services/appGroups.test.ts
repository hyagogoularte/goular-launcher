import { describe, expect, it } from 'vitest';
import { classifyApp, groupApps, isCataloged, isHiddenApp, suggestGroup } from './appGroups';
import { config } from '../config';

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

  it('app novo, fora do catálogo, vai para Outros mesmo com categoria ou nome sugestivo', () => {
    expect(classifyApp(app('com.exemplo.corrida', 'Corrida', 'game'))).toBe('other');
    expect(classifyApp(app('com.exemplo.radio', 'Rádio Floripa'))).toBe('other');
    expect(classifyApp(app('com.exemplo.x', 'Coisa'))).toBe('other');
    expect(isCataloged('com.exemplo.x')).toBe(false);
    expect(isCataloged('com.netflix.ninja')).toBe(true);
  });

  it('organizar = override ou entrada no catálogo tira o app de Outros', () => {
    expect(classifyApp(app('com.exemplo.corrida', 'Corrida'), { 'com.exemplo.corrida': 'games' })).toBe('games');
  });

  it('apps de fábrica do Fire TV têm grupo certo', () => {
    expect(classifyApp(app('com.amazon.venezia', 'Appstore'))).toBe('system');
    expect(classifyApp(app('com.amazon.cloud9', 'Silk'))).toBe('system');
    expect(classifyApp(app('com.amazon.bueller.photos', 'Amazon Photos'))).toBe('media');
    expect(classifyApp(app('com.amazon.firebat', 'Prime Video'))).toBe('streaming');
    expect(classifyApp(app('com.amazon.spiderpork', 'Amazon Luna'))).toBe('games');
    expect(classifyApp(app('com.formulaone.production', 'F1 TV'))).toBe('video');
  });
});

describe('suggestGroup (só para o relatório)', () => {
  it('usa a categoria do Android, depois palavras-chave', () => {
    expect(suggestGroup(app('com.exemplo.corrida', 'Corrida', 'game'))).toBe('games');
    expect(suggestGroup(app('com.exemplo.som', 'Som', 'audio'))).toBe('music');
    expect(suggestGroup(app('com.exemplo.files', 'Gerenciador'))).toBe('system');
    expect(suggestGroup(app('com.exemplo.x', 'Coisa'))).toBeUndefined();
  });

  it('"tv" no pacote só decide quando nenhuma palavra mais específica bate', () => {
    expect(suggestGroup(app('com.estudio.corrida.tv', 'Corrida Game'))).toBe('games');
    expect(suggestGroup(app('br.com.radio.tv', 'Rádio ao vivo'))).toBe('music');
    expect(suggestGroup(app('br.com.canal.tv', 'Canal Local'))).toBe('video');
  });
});

describe('catálogo', () => {
  it('todo app com nome/visual no catálogo também tem grupo (senão cairia em Outros)', () => {
    const semGrupo = Object.keys(config.appCatalog).filter((pkg) => !isCataloged(pkg) && !isHiddenApp(pkg));
    expect(semGrupo).toEqual([]);
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

  it('grupos de A a Z com "Outros" por último; nomes sem diferenciar acento e maiúscula', () => {
    const groups = groupApps([
      app('com.exemplo.x', 'Coisa'),
      app('com.amazon.venezia', 'Appstore'),
      app('tv.twitch.android.viewer', 'Twitch'),
      app('com.amazon.spiderpork', 'Amazon Luna'),
      app('com.amazon.bueller.music', 'Amazon Music'),
      app('com.amazon.bueller.photos', 'Amazon Photos'),
      app('com.netflix.ninja', 'Netflix'),
      app('com.amazon.hedwig', 'Notícias'),
      app('com.formulaone.production', 'f1 TV'),
      app('com.amazon.tahoe', 'Amazon Kids'),
    ]);
    expect(groups.map((g) => g.label)).toEqual([
      'Filmes e séries',
      'Jogos',
      'Mídia e players',
      'Música e áudio',
      'Utilitários e sistema',
      'Vídeos e ao vivo',
      'Outros',
    ]);
    expect(groups.find((g) => g.id === 'video')!.apps.map((a) => a.label)).toEqual([
      'Amazon Kids',
      'f1 TV',
      'Notícias',
      'Twitch',
    ]);
  });
});

describe('apps ocultos', () => {
  it('esconde a tela inicial da Amazon e os pacotes de config.hiddenApps', () => {
    expect(isHiddenApp('com.amazon.tv.launcher')).toBe(true);
    expect(isHiddenApp('com.amazon.ssm')).toBe(true);
    expect(isHiddenApp('com.exemplo.x', ['com.exemplo.x'])).toBe(true);
    expect(isHiddenApp('com.netflix.ninja')).toBe(false);
    const groups = groupApps(
      [app('com.amazon.tv.launcher', 'Início'), app('com.netflix.ninja', 'Netflix'), app('com.exemplo.x', 'X')],
      {},
      ['com.exemplo.x'],
    );
    expect(groups.flatMap((g) => g.apps.map((a) => a.packageName))).toEqual(['com.netflix.ninja']);
  });
});
