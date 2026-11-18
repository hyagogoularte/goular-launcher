import type { ReactNode } from 'react';
import {
  FocusContext,
  init,
  useFocusable,
  type Direction,
} from '@noriginmedia/norigin-spatial-navigation';

/**
 * Navegação por D-pad (controle do Fire TV). O WebView entrega as setas como
 * ArrowUp/Down/Left/Right e o botão central como Enter; a lib decide qual
 * elemento recebe foco pela posição na tela.
 */
export function initSpatialNavigation() {
  init({
    debug: false,
    visualDebug: false,
    throttle: 90, // segurar a seta repete, mas sem atropelar o render
    throttleKeypresses: true,
  });
}

interface FocusGroupProps {
  focusKey: string;
  className?: string;
  children: ReactNode;
  /** Volta para o último item focado ao reentrar na linha (padrão de TV). */
  saveLastFocusedChild?: boolean;
  isFocusBoundary?: boolean;
  focusBoundaryDirections?: Direction[];
  preferredChildFocusKey?: string;
}

/** Agrupa focáveis (uma linha de cards, a grade de apps...). */
export function FocusGroup({
  focusKey,
  className,
  children,
  saveLastFocusedChild = true,
  isFocusBoundary,
  focusBoundaryDirections,
  preferredChildFocusKey,
}: FocusGroupProps) {
  const { ref, focusKey: key } = useFocusable({
    focusKey,
    saveLastFocusedChild,
    trackChildren: false,
    isFocusBoundary,
    focusBoundaryDirections,
    preferredChildFocusKey,
  });
  return (
    <FocusContext.Provider value={key}>
      <div ref={ref} className={className}>
        {children}
      </div>
    </FocusContext.Provider>
  );
}

/** Rola o item focado para a área visível sem animação (barato no Fire Stick). */
export function scrollIntoViewIfNeeded(el: HTMLElement | null) {
  el?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}
