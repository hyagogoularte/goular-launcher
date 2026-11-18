import { getCurrentFocusKey, setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { useCallback, useEffect, useState } from 'react';
import { Background } from './components/Background';
import { Header } from './components/Header';
import { NavTabs, type TabId } from './components/NavTabs';
import { Toast } from './components/Toast';
import { onNativeEvent } from './services/native';
import { AllAppsScreen, FIRST_APP_KEY } from './screens/AllAppsScreen';
import { FIRST_FAVORITE_KEY, HomeScreen } from './screens/HomeScreen';
import styles from './App.module.css';

export function App() {
  const [tab, setTab] = useState<TabId>('home');

  const goHome = useCallback(() => {
    setTab('home');
    // espera o React montar a tela antes de focar
    requestAnimationFrame(() => setFocus(FIRST_FAVORITE_KEY));
  }, []);

  const selectTab = useCallback((next: TabId) => {
    setTab(next);
    requestAnimationFrame(() => setFocus(next === 'home' ? FIRST_FAVORITE_KEY : FIRST_APP_KEY));
  }, []);

  useEffect(() => {
    setFocus(FIRST_FAVORITE_KEY);

    // Voltar: na grade de apps volta para Início; no Início leva o foco aos favoritos.
    // Um launcher nunca "fecha" com o botão voltar.
    const offBack = onNativeEvent('back', () => {
      if (tab !== 'home') goHome();
      else if (!getCurrentFocusKey().startsWith('fav-')) setFocus(FIRST_FAVORITE_KEY);
    });
    // Home pressionado com o launcher já aberto.
    const offHome = onNativeEvent('home', goHome);

    // No navegador, Escape/Backspace simulam o botão voltar do controle.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Backspace') window.dispatchEvent(new Event('goular:back'));
    };
    window.addEventListener('keydown', onKey);

    return () => {
      offBack();
      offHome();
      window.removeEventListener('keydown', onKey);
    };
  }, [tab, goHome]);

  return (
    <div className={styles.app}>
      <Background />
      <main className={styles.content}>
        <Header />
        <div className={styles.tabs}>
          <NavTabs active={tab} onSelect={selectTab} />
        </div>
        {tab === 'home' ? <HomeScreen /> : <AllAppsScreen />}
      </main>
      <Toast />
    </div>
  );
}
