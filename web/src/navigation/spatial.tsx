import { useRef, type MouseEvent, type ReactNode } from 'react';
import {
  FocusContext,
  init,
  useFocusable,
  type Direction,
} from '@noriginmedia/norigin-spatial-navigation';
import { isPointerActive } from './pointer';

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

interface TvFocusableOptions {
  focusKey: string;
  /** Ação do item: OK no controle ou clique do mouse. */
  onSelect?: () => void;
  /** Rola o item para a vista quando o foco chega pelo D-pad. */
  scrollOnFocus?: boolean;
  /** false: só visualização — o D-pad e o mouse passam direto pelo item. */
  focusable?: boolean;
}

/**
 * Item focável de TV: D-pad (setas + OK) e mouse (passar por cima foca,
 * clicar seleciona) controlam o mesmo foco. Espalhe `pointerProps` no elemento.
 */
export function useTvFocusable<E extends HTMLElement = HTMLDivElement>({
  focusKey,
  onSelect,
  scrollOnFocus = false,
  focusable = true,
}: TvFocusableOptions) {
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;

  const { ref, focused, focusSelf } = useFocusable<object, E>({
    focusKey,
    focusable,
    onEnterPress: () => selectRef.current?.(),
    // com o mouse o item já está à vista; rolar mexeria a grade sob o cursor
    onFocus: scrollOnFocus ? () => !isPointerActive() && scrollIntoViewIfNeeded(ref.current) : undefined,
  });

  const pointerProps = !focusable ? {} : {
    'data-pointer-target': '',
    onMouseMove: () => {
      if (isPointerActive() && !focused) focusSelf();
    },
    onClick: (e: MouseEvent) => {
      e.preventDefault();
      if (!focused) focusSelf();
      selectRef.current?.();
    },
  };

  return { ref, focused, pointerProps };
}

/**
 * Rola o item focado para a área visível sem animação (barato no Fire Stick).
 * Se o item estiver dentro de um bloco marcado com data-scroll-anchor (ex.: uma
 * seção com título), traz o bloco inteiro, para o título não ficar escondido.
 */
export function scrollIntoViewIfNeeded(el: HTMLElement | null) {
  if (!el) return;
  const anchor = el.closest<HTMLElement>('[data-scroll-anchor]');
  const scroller = anchor?.closest<HTMLElement>('[data-scroller]');
  const fits = anchor && scroller && anchor.offsetHeight <= scroller.clientHeight;
  (fits ? anchor : el).scrollIntoView({ block: 'nearest', inline: 'nearest' });
}
