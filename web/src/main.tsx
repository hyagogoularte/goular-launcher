import '@fontsource-variable/inter';
import './styles/global.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { initPointerMode } from './navigation/pointer';
import { initSpatialNavigation } from './navigation/spatial';

initSpatialNavigation();
initPointerMode();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
