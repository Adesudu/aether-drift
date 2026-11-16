import { FIELD } from './config.js';
import { KIND_ASTEROID } from './entities.js';

export function startWave(waveNumber, pool, random) {
  pool.clear();
  const count = 3 + waveNumber * 2;
  for (let i = 0; i < count; i++) {
    const sizeType = random();
    let radius = 24;
    let health = 1;
    if (sizeType > 0.7) {
      radius = 48;
      health = 3;
    } else if (sizeType > 0.4) {
      radius = 32;
      health = 2;
    }

    // Spawn around edges
    let x, y;
    if (random() > 0.5) {
      x = random() > 0.5 ? -50 : FIELD.width + 50;
      y = random() * FIELD.height;
    } else {
      x = random() * FIELD.width;
      y = random() > 0.5 ? -50 : FIELD.height + 50;
    }

    const angle = Math.atan2(FIELD.height / 2 - y, FIELD.width / 2 - x) + (random() - 0.5) * 1.0;
    const speed = (60 + waveNumber * 15) * (1 + (random() - 0.5) * 0.4);

    pool.spawn(KIND_ASTEROID, {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius,
      health,
      maxHealth: health,
      rotation: random() * Math.PI * 2,
      rotSpeed: (random() - 0.5) * 2,
      seed: random(),
    });
  }
}

export function isWaveCleared(pool) {
  for (let i = 0; i < pool.items.length; i++) {
    if (pool.items[i].active && pool.items[i].kind === KIND_ASTEROID) {
      return false;
    }
  }
  return true;
}
