import { memo } from 'react';
import styles from './Background.module.css';

/**
 * Fundo azul-marinho → roxo com "ondas" de luz em diagonal.
 * É estático (sem animação nem filter/blur) para ser rasterizado uma vez só:
 * no Fire Stick isso é o que mantém a navegação a 60 fps.
 */
export const Background = memo(function Background() {
  return (
    <div className={styles.root} aria-hidden>
      <svg className={styles.waves} viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
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
        <path
          d="M-80 1080 C 420 930, 820 640, 1920 420 L1920 600 C 1100 760, 640 960, 380 1080 Z"
          fill="url(#bandBlue)"
        />
        {/* faixa roxa no canto inferior direito */}
        <path d="M760 1080 C 1180 900, 1560 780, 1920 690 L1920 1080 Z" fill="url(#bandPurple)" />

        {/* linhas de luz (várias larguras = brilho sem usar blur) */}
        <g fill="none" strokeLinecap="round">
          <path d="M-80 1060 C 440 900, 860 620, 1920 405" stroke="url(#lineCyan)" strokeWidth="14" opacity="0.12" />
          <path d="M-80 1060 C 440 900, 860 620, 1920 405" stroke="url(#lineCyan)" strokeWidth="3" opacity="0.7" />
          <path d="M700 1080 C 1150 880, 1550 770, 1920 680" stroke="url(#linePurple)" strokeWidth="10" opacity="0.15" />
          <path d="M700 1080 C 1150 880, 1550 770, 1920 680" stroke="url(#linePurple)" strokeWidth="2.5" opacity="0.75" />
          <path d="M1480 -20 C 1640 120, 1800 230, 1940 300" stroke="url(#linePurple)" strokeWidth="2" opacity="0.5" />
        </g>
      </svg>
    </div>
  );
});
