import { memo } from 'react';
import type { BackgroundVariant } from '../config';
import styles from './Background.module.css';

/** As mesmas três ondas nos dois fundos: diagonal principal, canto inferior direito e topo. */
const WAVE_MAIN = 'M-80 1060 C 440 900, 860 620, 1920 405';
const WAVE_LOW = 'M700 1080 C 1150 880, 1550 770, 1920 680';
const WAVE_TOP = 'M1480 -20 C 1640 120, 1800 230, 1940 300';
const BAND_MAIN = 'M-80 1080 C 420 930, 820 640, 1920 420 L1920 600 C 1100 760, 640 960, 380 1080 Z';
const BAND_LOW = 'M760 1080 C 1180 900, 1560 780, 1920 690 L1920 1080 Z';

/**
 * Fundo da tela. Estático (sem animação nem filter/blur) para ser rasterizado uma
 * vez só: no Fire Stick isso é o que mantém a navegação a 60 fps.
 * - smoke: quase preto, ondas em tom de fumaça (padrão);
 * - classic: azul-marinho → roxo com ondas de luz coloridas.
 * Escolha em config.background.
 */
export const Background = memo(function Background({ variant }: { variant: BackgroundVariant }) {
  return (
    <div className={`${styles.root} ${styles[variant]}`} aria-hidden>
      <svg className={styles.waves} viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
        {variant === 'smoke' ? <SmokeWaves /> : <ClassicWaves />}
      </svg>
    </div>
  );
});

/**
 * Fumaça sem blur: cada onda é desenhada em camadas, da mais larga e transparente à
 * mais fina e visível, e o traço some nas pontas (gradiente ao longo da linha).
 */
function SmokeWaves() {
  return (
    <>
      <defs>
        {/* névoa: cinza-azulado bem fraco, mais denso no meio da faixa */}
        <linearGradient id="smokeHaze" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#9aa6c4" stopOpacity="0" />
          <stop offset="0.45" stopColor="#9aa6c4" stopOpacity="0.09" />
          <stop offset="1" stopColor="#9aa6c4" stopOpacity="0" />
        </linearGradient>
        {/* traço: aparece e some ao longo da onda, como um fio de fumaça */}
        <linearGradient id="smokeLine" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#d7ddeb" stopOpacity="0" />
          <stop offset="0.35" stopColor="#d7ddeb" stopOpacity="0.9" />
          <stop offset="0.75" stopColor="#c3c9dc" stopOpacity="0.6" />
          <stop offset="1" stopColor="#c3c9dc" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="smokeLineLow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c3c9dc" stopOpacity="0" />
          <stop offset="0.6" stopColor="#c3c9dc" stopOpacity="0.7" />
          <stop offset="1" stopColor="#d7ddeb" stopOpacity="0.4" />
        </linearGradient>
      </defs>

      <path d={BAND_MAIN} fill="url(#smokeHaze)" />
      <path d={BAND_LOW} fill="url(#smokeHaze)" opacity="0.6" />

      <g fill="none" strokeLinecap="round">
        <SmokeStroke d={WAVE_MAIN} stroke="url(#smokeLine)" scale={1} />
        <SmokeStroke d={WAVE_LOW} stroke="url(#smokeLineLow)" scale={0.8} />
        <SmokeStroke d={WAVE_TOP} stroke="url(#smokeLineLow)" scale={0.6} />
      </g>
    </>
  );
}

/** Larguras e opacidades das camadas de uma onda de fumaça (do halo ao fio). */
const SMOKE_LAYERS = [
  { width: 160, opacity: 0.025 },
  { width: 90, opacity: 0.04 },
  { width: 44, opacity: 0.06 },
  { width: 18, opacity: 0.09 },
  { width: 6, opacity: 0.13 },
  { width: 2, opacity: 0.24 },
];

function SmokeStroke({ d, stroke, scale }: { d: string; stroke: string; scale: number }) {
  return (
    <>
      {SMOKE_LAYERS.map((l) => (
        <path key={l.width} d={d} stroke={stroke} strokeWidth={l.width * scale} opacity={l.opacity} />
      ))}
    </>
  );
}

function ClassicWaves() {
  return (
    <>
      <defs>
        <linearGradient id="bandBlue" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#1d6bff" stopOpacity="0.55" />
          <stop offset="0.55" stopColor="#2446d6" stopOpacity="0.25" />
          <stop offset="1" stopColor="#6d28d9" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="bandPurple" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#4c1d95" stopOpacity="0" />
          <stop offset="0.5" stopColor="#7c3aed" stopOpacity="0.45" />
          <stop offset="1" stopColor="#a855f7" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id="lineCyan" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#38bdf8" stopOpacity="0.9" />
          <stop offset="0.6" stopColor="#6366f1" stopOpacity="0.6" />
          <stop offset="1" stopColor="#c084fc" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="linePurple" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a855f7" stopOpacity="0" />
          <stop offset="0.6" stopColor="#c084fc" stopOpacity="0.8" />
          <stop offset="1" stopColor="#e879f9" stopOpacity="0.9" />
        </linearGradient>
      </defs>

      {/* faixa azul que atravessa a tela de baixo-esquerda para cima-direita */}
      <path d={BAND_MAIN} fill="url(#bandBlue)" />
      {/* faixa roxa no canto inferior direito */}
      <path d={BAND_LOW} fill="url(#bandPurple)" />

      {/* linhas de luz (várias larguras = brilho sem usar blur) */}
      <g fill="none" strokeLinecap="round">
        <path d={WAVE_MAIN} stroke="url(#lineCyan)" strokeWidth="14" opacity="0.12" />
        <path d={WAVE_MAIN} stroke="url(#lineCyan)" strokeWidth="3" opacity="0.7" />
        <path d={WAVE_LOW} stroke="url(#linePurple)" strokeWidth="10" opacity="0.15" />
        <path d={WAVE_LOW} stroke="url(#linePurple)" strokeWidth="2.5" opacity="0.75" />
        <path d={WAVE_TOP} stroke="url(#linePurple)" strokeWidth="2" opacity="0.5" />
      </g>
    </>
  );
}
