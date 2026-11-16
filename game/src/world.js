import { FIELD, LIVES, PLAYER } from './config.js';
import { KIND_ASTEROID, KIND_SHARD, KIND_BULLET, createEntitiesPool, createParticlesPool } from './entities.js';
import { startWave, isWaveCleared } from './waves.js';
import { createShopState } from './upgrades.js';

export const EVENT_HIT = 1;
export const EVENT_COIN = 2;
export const EVENT_WAVE_CLEAR = 4;
export const EVENT_OVER = 8;

export function createWorld(random) {
  const player = {
    x: FIELD.width / 2,
    y: FIELD.height / 2,
    vx: 0,
    vy: 0,
    angle: 0,
    dashTimer: 0,
    dashCd: 0,
    invulnerable: 0,
    shield: 0,
  };

  const entities = createEntitiesPool(128);
  const particles = createParticlesPool(80);
  const shop = createShopState();

  const state = {
    player,
    entities,
    particles,
    shop,
    score: 0,
    lives: LIVES,
    wave: 1,
    shards: 0,
    elapsed: 0,
    shootCooldown: 0,
  };

  function reset() {
    player.x = FIELD.width / 2;
    player.y = FIELD.height / 2;
    player.vx = 0;
    player.vy = 0;
    player.angle = 0;
    player.dashTimer = 0;
    player.dashCd = 0;
    player.invulnerable = 0;
    player.shield = 0;
    entities.clear();
    particles.clear();
    shop.reset();
    state.score = 0;
    state.lives = LIVES;
    state.wave = 1;
    state.shards = 0;
    state.elapsed = 0;
    state.shootCooldown = 0;
    startWave(state.wave, entities, random);
  }

  function step(dt, inputVector, isShooting, isDashing, harmless) {
    let events = 0;
    state.elapsed += dt;

    if (player.invulnerable > 0) player.invulnerable = Math.max(0, player.invulnerable - dt);
    if (player.dashCd > 0) player.dashCd = Math.max(0, player.dashCd - dt);
    if (player.dashTimer > 0) {
      player.dashTimer -= dt;
    }

    // Shield bonus from shop
    const maxShield = shop.levels.shield;
    if (player.shield < maxShield) player.shield = maxShield;

    // Movement
    const speedMult = 1 + shop.levels.thrusters * 0.15;
    if (isDashing && player.dashCd === 0 && (inputVector.x !== 0 || inputVector.y !== 0)) {
      player.dashTimer = PLAYER.dashDuration;
      player.dashCd = Math.max(0.4, PLAYER.dashCooldown - shop.levels.thrusters * 0.25);
      particles.emit(player.x, player.y, '#00f0ff', 10, 200);
    }

    let curSpeed = PLAYER.speed * speedMult;
    if (player.dashTimer > 0) curSpeed = PLAYER.dashSpeed;

    if (!harmless) {
      player.x += inputVector.x * curSpeed * dt;
      player.y += inputVector.y * curSpeed * dt;
      // Clamp to field
      player.x = Math.max(PLAYER.width / 2, Math.min(FIELD.width - PLAYER.width / 2, player.x));
      player.y = Math.max(PLAYER.height / 2, Math.min(FIELD.height - PLAYER.height / 2, player.y));
    }

    // Shooting
    if (state.shootCooldown > 0) state.shootCooldown -= dt;
    const shootRate = Math.max(0.06, 0.15 - shop.levels.cannon * 0.03);
    if (isShooting && state.shootCooldown <= 0 && !harmless) {
      state.shootCooldown = shootRate;
      const spread = shop.levels.cannon > 0 ? 0.15 : 0;
      const angles = [player.angle];
      if (spread > 0) {
        angles.push(player.angle - spread, player.angle + spread);
      }
      for (const ang of angles) {
        entities.spawn(KIND_BULLET, {
          x: player.x + Math.cos(ang) * 20,
          y: player.y + Math.sin(ang) * 20,
          vx: Math.cos(ang) * 850 + player.vx * 0.2,
          vy: Math.sin(ang) * 850 + player.vy * 0.2,
          radius: 4,
        });
      }
      events |= EVENT_COIN; // marker for shoot event / sound if needed
    }

    // Update entities
    const items = entities.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.active) continue;

      item.x += item.vx * dt;
      item.y += item.vy * dt;
      if (item.kind === KIND_ASTEROID) {
        item.rotation += item.rotSpeed * dt;
        // Wrap around screen
        if (item.x < -100) item.x = FIELD.width + 100;
        if (item.x > FIELD.width + 100) item.x = -100;
        if (item.y < -100) item.y = FIELD.height + 100;
        if (item.y > FIELD.height + 100) item.y = -100;
      } else if (item.kind === KIND_SHARD) {
        // Magnet effect
        const magnetDist = 120 + shop.levels.magnet * 100;
        const dist = Math.hypot(player.x - item.x, player.y - item.y);
        if (dist < magnetDist && !harmless) {
          const pullAngle = Math.atan2(player.y - item.y, player.x - item.x);
          item.vx = Math.cos(pullAngle) * 400;
          item.vy = Math.sin(pullAngle) * 400;
        }
        if (dist < 24 && !harmless) {
          item.active = false;
          state.shards += 1;
          state.score += 25;
          events |= EVENT_COIN;
        }
      } else if (item.kind === KIND_BULLET) {
        if (item.x < 0 || item.x > FIELD.width || item.y < 0 || item.y > FIELD.height) {
          item.active = false;
        }
      }

      // Bullet-Asteroid collisions
      if (item.active && item.kind === KIND_BULLET) {
        for (let j = 0; j < items.length; j++) {
          const ast = items[j];
          if (!ast.active || ast.kind !== KIND_ASTEROID) continue;
          const dist = Math.hypot(item.x - ast.x, item.y - ast.y);
          if (dist < ast.radius + item.radius) {
            item.active = false;
            ast.health -= 1;
            particles.emit(item.x, item.y, '#ff3366', 4, 100);
            if (ast.health <= 0) {
              ast.active = false;
              particles.emit(ast.x, ast.y, '#708090', 12, 180);
              state.score += Math.round(ast.radius * 2);
              // Spawn starshards
              const shardCount = ast.radius > 40 ? 3 : ast.radius > 28 ? 2 : 1;
              for (let s = 0; s < shardCount; s++) {
                const ang = Math.random() * Math.PI * 2;
                entities.spawn(KIND_SHARD, {
                  x: ast.x + (Math.random() - 0.5) * 20,
                  y: ast.y + (Math.random() - 0.5) * 20,
                  vx: Math.cos(ang) * 120,
                  vy: Math.sin(ang) * 120,
                  radius: 8,
                });
              }
            }
            break;
          }
        }
      }

      // Player-Asteroid collisions
      if (item.active && item.kind === KIND_ASTEROID && !harmless) {
        const dist = Math.hypot(player.x - item.x, player.y - item.y);
        if (dist < item.radius + PLAYER.width * 0.35 && player.invulnerable === 0) {
          if (player.shield > 0) {
            player.shield -= 1;
            player.invulnerable = PLAYER.invulnerableTime;
            item.active = false;
            particles.emit(player.x, player.y, '#33ffff', 15, 200);
            events |= EVENT_HIT;
          } else {
            state.lives -= 1;
            player.invulnerable = PLAYER.invulnerableTime;
            particles.emit(player.x, player.y, '#ff3366', 20, 250);
            events |= EVENT_HIT;
            if (state.lives <= 0) {
              events |= EVENT_OVER;
            }
          }
        }
      }
    }

    particles.update(dt);

    // Wave check
    if (!harmless && isWaveCleared(entities)) {
      state.wave += 1;
      events |= EVENT_WAVE_CLEAR;
      startWave(state.wave, entities, random);
    }

    return events;
  }

  reset();
  return { state, reset, step };
}
