import { useEffect, useState } from 'react';
import styles from './Toast.module.css';

/** Exibe mensagens enviadas por notify() (services/native.ts) por 2,5 s. */
export function Toast() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let timer: number;
    const onToast = (e: Event) => {
      setMessage((e as CustomEvent<string>).detail);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setMessage(null), 2500);
    };
    window.addEventListener('goular:toast', onToast);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('goular:toast', onToast);
    };
  }, []);

  return (
    <div className={`${styles.toast} ${message ? styles.visible : ''}`} role="status">
      {message}
    </div>
  );
}
