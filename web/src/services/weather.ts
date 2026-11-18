import { useEffect, useState } from 'react';
import { config, type CityConfig } from '../config';
import { onNativeEvent } from './native';

export type WeatherIconKind =
  | 'sun'
  | 'moon'
  | 'sun-cloud'
  | 'moon-cloud'
  | 'cloud'
  | 'fog'
  | 'rain'
  | 'snow'
  | 'storm';

export interface Weather {
  temperature: number;
  label: string;
  icon: WeatherIconKind;
  fetchedAt: number;
}

/** Traduz o código WMO do Open-Meteo para rótulo pt-BR + ícone. */
export function describeWeather(code: number, isDay: boolean): { label: string; icon: WeatherIconKind } {
  if (code === 0) return isDay ? { label: 'Ensolarado', icon: 'sun' } : { label: 'Céu limpo', icon: 'moon' };
  if (code === 1) return { label: isDay ? 'Ensolarado' : 'Poucas nuvens', icon: isDay ? 'sun-cloud' : 'moon-cloud' };
  if (code === 2) return { label: 'Parc. nublado', icon: isDay ? 'sun-cloud' : 'moon-cloud' };
  if (code === 3) return { label: 'Nublado', icon: 'cloud' };
  if (code === 45 || code === 48) return { label: 'Neblina', icon: 'fog' };
  if (code >= 51 && code <= 57) return { label: 'Garoa', icon: 'rain' };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return { label: 'Chuva', icon: 'rain' };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { label: 'Neve', icon: 'snow' };
  if (code >= 95) return { label: 'Tempestade', icon: 'storm' };
  return { label: 'Nublado', icon: 'cloud' };
}

interface OpenMeteoResponse {
  current: { temperature_2m: number; weather_code: number; is_day: number };
}

export async function fetchWeather(city: CityConfig, signal?: AbortSignal): Promise<Weather> {
  const url =
    'https://api.open-meteo.com/v1/forecast' +
    `?latitude=${city.latitude}&longitude=${city.longitude}` +
    '&current=temperature_2m,weather_code,is_day&timezone=auto';
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  const data = (await res.json()) as OpenMeteoResponse;
  const { label, icon } = describeWeather(data.current.weather_code, data.current.is_day === 1);
  return { temperature: data.current.temperature_2m, label, icon, fetchedAt: Date.now() };
}

const cacheKey = (city: CityConfig) => `goular:weather:${city.name}`;

function readCache(city: CityConfig): Weather | null {
  try {
    const raw = localStorage.getItem(cacheKey(city));
    return raw ? (JSON.parse(raw) as Weather) : null;
  } catch {
    return null;
  }
}

function writeCache(city: CityConfig, w: Weather) {
  try {
    localStorage.setItem(cacheKey(city), JSON.stringify(w));
  } catch {
    /* sem storage: só não guarda */
  }
}

/** Clima de uma cidade: mostra o cache na hora e atualiza a cada 15 min. */
export function useWeather(city: CityConfig): Weather | null {
  const [weather, setWeather] = useState<Weather | null>(() => readCache(city));

  useEffect(() => {
    let ctrl = new AbortController();
    const load = () => {
      ctrl.abort();
      ctrl = new AbortController();
      fetchWeather(city, ctrl.signal)
        .then((w) => {
          setWeather(w);
          writeCache(city, w);
        })
        .catch((err: unknown) => {
          if ((err as Error).name !== 'AbortError') console.warn('[goular] clima', city.name, err);
        });
    };
    load();
    const timer = window.setInterval(load, config.weatherRefreshMs);
    const off = onNativeEvent('resume', () => {
      const cached = readCache(city);
      if (!cached || Date.now() - cached.fetchedAt > config.weatherRefreshMs) load();
    });
    return () => {
      ctrl.abort();
      window.clearInterval(timer);
      off();
    };
  }, [city]);

  return weather;
}
