import { memo } from 'react';
import type { WeatherIconKind } from '../services/weather';

const CLOUD = 'M18 52 H47 A10 10 0 0 0 47 32 A13 13 0 0 0 23 29 A11.5 11.5 0 0 0 18 52 Z';

function Sun({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const rays = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4;
    const x1 = cx + Math.cos(a) * (r + 4);
    const y1 = cy + Math.sin(a) * (r + 4);
    const x2 = cx + Math.cos(a) * (r + 9);
    const y2 = cy + Math.sin(a) * (r + 9);
    return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
  });
  return (
    <g>
      <g stroke="#ffc83d" strokeWidth="3" strokeLinecap="round">
        {rays}
      </g>
      <circle cx={cx} cy={cy} r={r} fill="url(#wi-sun)" />
    </g>
  );
}

function Moon({ cx, cy }: { cx: number; cy: number }) {
  return (
    <path
      d={`M${cx + 6} ${cy - 13} A14 14 0 1 0 ${cx + 13} ${cy + 8} A11 11 0 0 1 ${cx + 6} ${cy - 13} Z`}
      fill="url(#wi-moon)"
    />
  );
}

const Cloud = ({ dy = 0 }: { dy?: number }) => <path d={CLOUD} transform={`translate(0 ${dy})`} fill="url(#wi-cloud)" />;

/** Ícones de clima coloridos (SVG inline, sem fontes nem imagens externas). */
export const WeatherIcon = memo(function WeatherIcon({ kind, size }: { kind: WeatherIconKind; size: string }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
      <defs>
        <radialGradient id="wi-sun" cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#fff3a3" />
          <stop offset="1" stopColor="#ffa91f" />
        </radialGradient>
        <linearGradient id="wi-cloud" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#c9d3e6" />
        </linearGradient>
        <linearGradient id="wi-moon" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fdf6c4" />
          <stop offset="1" stopColor="#f2c94c" />
        </linearGradient>
      </defs>

      {kind === 'sun' && <Sun cx={32} cy={32} r={13} />}
      {kind === 'moon' && <Moon cx={30} cy={32} />}
      {kind === 'sun-cloud' && (
        <>
          <Sun cx={24} cy={24} r={10} />
          <Cloud dy={2} />
        </>
      )}
      {kind === 'moon-cloud' && (
        <>
          <Moon cx={22} cy={22} />
          <Cloud dy={2} />
        </>
      )}
      {kind === 'cloud' && <Cloud dy={-4} />}
      {kind === 'fog' && (
        <>
          <Cloud dy={-8} />
          <g stroke="#c9d3e6" strokeWidth="3" strokeLinecap="round">
            <line x1="14" y1="52" x2="50" y2="52" />
            <line x1="20" y1="58" x2="44" y2="58" />
          </g>
        </>
      )}
      {kind === 'rain' && (
        <>
          <Cloud dy={-8} />
          <g stroke="#5ab4ff" strokeWidth="3" strokeLinecap="round">
            <line x1="24" y1="50" x2="21" y2="58" />
            <line x1="33" y1="50" x2="30" y2="58" />
            <line x1="42" y1="50" x2="39" y2="58" />
          </g>
        </>
      )}
      {kind === 'snow' && (
        <>
          <Cloud dy={-8} />
          <g fill="#e6f1ff">
            <circle cx="23" cy="53" r="2.5" />
            <circle cx="32" cy="57" r="2.5" />
            <circle cx="41" cy="53" r="2.5" />
          </g>
        </>
      )}
      {kind === 'storm' && (
        <>
          <Cloud dy={-8} />
          <path d="M34 46 L26 56 H32 L29 63 L39 52 H33 L36 46 Z" fill="#ffc83d" />
        </>
      )}
    </svg>
  );
});
