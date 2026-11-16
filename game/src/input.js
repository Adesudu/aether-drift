export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_SHOOT = 4;
export const ACTION_DASH = 8;
export const ACTION_MUTE = 16;

const UP = new Set(['ArrowUp', 'KeyW']);
const DOWN = new Set(['ArrowDown', 'KeyS']);
const LEFT = new Set(['ArrowLeft', 'KeyA']);
const RIGHT = new Set(['ArrowRight', 'KeyD']);
const CONFIRM = new Set(['Space', 'Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);
const DASH = new Set(['ShiftLeft', 'ShiftRight']);
const MUTE = new Set(['KeyM']);

export function createInput(target) {
  let up = false;
  let down = false;
  let left = false;
  let right = false;
  let shooting = false;
  let actions = 0;
  const mouse = { x: 640, y: 360, down: false };

  window.addEventListener('keydown', (event) => {
    if (UP.has(event.code)) up = true;
    else if (DOWN.has(event.code)) down = true;
    else if (LEFT.has(event.code)) left = true;
    else if (RIGHT.has(event.code)) right = true;
    else if (CONFIRM.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else if (DASH.has(event.code)) {
      if (!event.repeat) actions |= ACTION_DASH;
    } else if (MUTE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_MUTE;
    } else if (event.code === 'Space') {
      shooting = true;
      if (!event.repeat) actions |= ACTION_SHOOT;
    } else return;
    event.preventDefault();
  });

  window.addEventListener('keyup', (event) => {
    if (UP.has(event.code)) up = false;
    else if (DOWN.has(event.code)) down = false;
    else if (LEFT.has(event.code)) left = false;
    else if (RIGHT.has(event.code)) right = false;
    else if (event.code === 'Space') shooting = false;
  });

  window.addEventListener('blur', () => {
    up = false;
    down = false;
    left = false;
    right = false;
    shooting = false;
    mouse.down = false;
  });

  target.addEventListener('pointermove', (event) => {
    const rect = target.getBoundingClientRect();
    const scaleX = target.width / rect.width;
    const scaleY = target.height / rect.height;
    mouse.x = (event.clientX - rect.left) * scaleX;
    mouse.y = (event.clientY - rect.top) * scaleY;
  });

  target.addEventListener('pointerdown', (event) => {
    mouse.down = true;
    actions |= ACTION_CONFIRM | ACTION_SHOOT;
  });

  target.addEventListener('pointerup', () => {
    mouse.down = false;
  });

  return {
    vector() {
      const vx = (right ? 1 : 0) - (left ? 1 : 0);
      const vy = (down ? 1 : 0) - (up ? 1 : 0);
      const len = Math.hypot(vx, vy);
      if (len > 0) return { x: vx / len, y: vy / len };
      return { x: 0, y: 0 };
    },
    mouse,
    isShooting() {
      return shooting || mouse.down;
    },
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}
