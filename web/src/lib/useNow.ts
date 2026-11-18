import { useEffect, useState } from 'react';

/**
 * Data atual, atualizada no início de cada minuto (não a cada segundo:
 * o relógio só mostra HH:MM e cada re-render custa no Fire Stick).
 */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timer: number;
    const schedule = () => {
      const msToNextMinute = 60_000 - (Date.now() % 60_000) + 50;
      timer = window.setTimeout(() => {
        setNow(new Date());
        schedule();
      }, msToNextMinute);
    };
    schedule();
    // Ao voltar de outro app o timer pode ter atrasado: sincroniza na hora.
    const onResume = () => setNow(new Date());
    window.addEventListener('goular:resume', onResume);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('goular:resume', onResume);
    };
  }, []);

  return now;
}
