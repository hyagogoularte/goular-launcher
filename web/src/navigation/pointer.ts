/**
 * Modo ponteiro: o Fire TV também aceita mouse (USB/Bluetooth, ou apps como
 * o Mouse Toggle) e no navegador do Mac o mouse é o normal. O foco continua
 * sendo um só (o do D-pad): passar o mouse sobre um item move o foco para ele,
 * clicar equivale ao OK.
 *
 * O modo liga num movimento real do mouse e desliga na primeira tecla. Assim,
 * quando o D-pad rola a grade e um item novo passa por baixo do cursor parado,
 * o foco não é "roubado" pelo mouse.
 */

let active = false;
let lastX = -1;
let lastY = -1;

export function isPointerActive() {
  return active;
}

function setActive(next: boolean) {
  if (active === next) return;
  active = next;
  document.documentElement.classList.toggle('pointer', next);
}

export function initPointerMode() {
  window.addEventListener(
    'mousemove',
    (e) => {
      // o Chromium dispara mousemove sintético após rolagem; só conta movimento de verdade
      if (e.screenX === lastX && e.screenY === lastY) return;
      lastX = e.screenX;
      lastY = e.screenY;
      setActive(true);
    },
    { passive: true },
  );
  // captura: roda antes do listener da navegação espacial
  window.addEventListener('keydown', () => setActive(false), true);
}
