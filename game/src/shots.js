import { FIELD, STEP } from './config.js';
import { EVENT_OVER } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const START_SECONDS = 3;
const PLAY_SECONDS = 12;
const END_LIMIT_SECONDS = 400;

export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'end') {
    for (let i = 0; i < START_SECONDS / STEP; i++) {
      world.step(STEP, { x: 0, y: 0 }, false, false, true);
    }
    return { screen: SCREEN_TITLE, best: 0 };
  }

  const limit = name === 'end' ? END_LIMIT_SECONDS : PLAY_SECONDS;
  for (let i = 0; i < limit / STEP; i++) {
    // Autopilot moves slightly towards center or avoids closest asteroid
    const p = world.state.player;
    const dx = FIELD.width / 2 - p.x;
    const dy = FIELD.height / 2 - p.y;
    const len = Math.hypot(dx, dy);
    const vec = len > 10 ? { x: dx / len, y: dy / len } : { x: 0, y: 0 };
    const shooting = i % 20 === 0;
    const events = world.step(STEP, vec, shooting, false, name === 'end' && i > 150);
    if ((events & EVENT_OVER) && name === 'end') break;
  }

  const over = world.state.lives <= 0;
  return { screen: over ? SCREEN_OVER : SCREEN_PLAY, best: world.state.score };
}
