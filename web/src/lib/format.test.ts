import { describe, expect, it } from 'vitest';
import { formatDateLabel, formatTemp, formatTime, greetingFor } from './format';

describe('format', () => {
  // 17/11/2026 é uma terça-feira, como na imagem de referência.
  const ref = new Date(2026, 10, 17, 23, 23);

  it('formata hora com zero à esquerda', () => {
    expect(formatTime(ref)).toBe('23:23');
    expect(formatTime(new Date(2026, 0, 1, 7, 5))).toBe('07:05');
  });

  it('formata data como na referência', () => {
    expect(formatDateLabel(ref)).toBe('Terça, 17 de Nov.');
  });

  it('escolhe a saudação pela hora', () => {
    expect(greetingFor(new Date(2026, 0, 1, 8))).toBe('Bom dia');
    expect(greetingFor(new Date(2026, 0, 1, 14))).toBe('Boa tarde');
    expect(greetingFor(ref)).toBe('Boa noite');
    expect(greetingFor(new Date(2026, 0, 1, 3))).toBe('Boa noite');
  });

  it('arredonda temperatura', () => {
    expect(formatTemp(22.6)).toBe('23°');
    expect(formatTemp(null)).toBe('--°');
  });
});
