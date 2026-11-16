import { FIELD, FONT, LIVES, PALETTE } from './config.js';
import { KIND_ASTEROID, KIND_SHARD, KIND_BULLET } from './entities.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_SHOP = 'shop';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  const fonts = new Map();
  function text(value, x, y, size, color, align) {
    if (!fonts.has(size)) fonts.set(size, `${size}px ${FONT}`);
    context.font = fonts.get(size);
    context.fillStyle = color;
    context.textAlign = align;
    context.fillText(value, x, y);
  }

  function drawField(state) {
    // Backdrop & Nebula
    context.fillStyle = PALETTE.backdrop;
    context.fillRect(0, 0, FIELD.width, FIELD.height);

    context.fillStyle = PALETTE.nebula;
    context.beginPath();
    context.arc(300, 200, 250, 0, Math.PI * 2);
    context.arc(900, 500, 300, 0, Math.PI * 2);
    context.fill();

    // Stars background grid
    context.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (let i = 0; i < 60; i++) {
      const sx = (i * 137.5) % FIELD.width;
      const sy = (i * 93.3) % FIELD.height;
      context.fillRect(sx, sy, 2, 2);
    }

    // Entities
    const items = state.entities.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.active) continue;

      if (item.kind === KIND_ASTEROID) {
        context.save();
        context.translate(item.x, item.y);
        context.rotate(item.rotation);
        context.fillStyle = PALETTE.asteroid;
        context.strokeStyle = PALETTE.asteroidCrater;
        context.lineWidth = 3;
        context.beginPath();
        const pts = 6;
        for (let p = 0; p < pts; p++) {
          const angle = (p / pts) * Math.PI * 2;
          const r = item.radius * (0.8 + ((p * 3 + item.seed * 10) % 5) * 0.08);
          const px = Math.cos(angle) * r;
          const py = Math.sin(angle) * r;
          if (p === 0) context.moveTo(px, py);
          else context.lineTo(px, py);
        }
        context.closePath();
        context.fill();
        context.stroke();
        context.restore();
      } else if (item.kind === KIND_SHARD) {
        context.fillStyle = PALETTE.shard;
        context.shadowColor = PALETTE.shard;
        context.shadowBlur = 10;
        context.beginPath();
        context.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
        context.fill();
        context.shadowBlur = 0;
      } else if (item.kind === KIND_BULLET) {
        context.fillStyle = PALETTE.laser;
        context.shadowColor = PALETTE.laser;
        context.shadowBlur = 8;
        context.beginPath();
        context.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
        context.fill();
        context.shadowBlur = 0;
      }
    }

    // Particles
    const particles = state.particles.particles;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (!p.active) continue;
      context.fillStyle = p.color;
      context.beginPath();
      context.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      context.fill();
    }

    // Player Skiff
    const player = state.player;
    if (player.invulnerable === 0 || Math.floor(player.invulnerable * 15) % 2 === 0) {
      context.save();
      context.translate(player.x, player.y);
      context.rotate(player.angle);

      // Engine Flame
      context.fillStyle = PALETTE.playerEngine;
      context.beginPath();
      context.moveTo(-20, -6);
      context.lineTo(-32, 0);
      context.lineTo(-20, 6);
      context.closePath();
      context.fill();

      // Hull
      context.fillStyle = PALETTE.player;
      context.strokeStyle = '#ffffff';
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(22, 0);
      context.lineTo(-16, -16);
      context.lineTo(-10, 0);
      context.lineTo(-16, 16);
      context.closePath();
      context.fill();
      context.stroke();

      // Shield Aura
      if (player.shield > 0) {
        context.strokeStyle = PALETTE.shield;
        context.lineWidth = 2;
        context.beginPath();
        context.arc(0, 0, 30, 0, Math.PI * 2);
        context.stroke();
      }

      context.restore();
    }
  }

  function drawHud(state) {
    context.textBaseline = 'top';
    text(`Score: ${state.score}`, 24, 20, 24, PALETTE.text, 'left');
    text(`Wave: ${state.wave}`, FIELD.width / 2, 20, 24, PALETTE.text, 'center');
    text(`Shards: ${state.shards}`, FIELD.width - 200, 20, 24, PALETTE.shard, 'right');

    // Lives
    for (let i = 0; i < LIVES; i++) {
      context.fillStyle = i < state.lives ? PALETTE.player : PALETTE.panel;
      context.fillRect(24 + i * 28, 60, 20, 12);
    }
  }

  function drawPanel(title, lines, prompt) {
    const width = 640;
    const height = 400;
    const x = (FIELD.width - width) / 2;
    const y = (FIELD.height - height) / 2;

    context.fillStyle = PALETTE.panel;
    context.fillRect(x, y, width, height);
    context.strokeStyle = PALETTE.player;
    context.lineWidth = 2;
    context.strokeRect(x, y, width, height);

    context.textBaseline = 'alphabetic';
    text(title, FIELD.width / 2, y + 70, 42, PALETTE.player, 'center');

    for (let i = 0; i < lines.length; i++) {
      text(lines[i], FIELD.width / 2, y + 140 + i * 40, 22, PALETTE.text, 'center');
    }

    text(prompt, FIELD.width / 2, y + height - 50, 24, PALETTE.shard, 'center');
  }

  function draw(state, screen, best) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.backdrop;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    drawField(state);

    if (screen === SCREEN_TITLE) {
      drawPanel('AETHER DRIFT', [
        'Pilot your skiff through the asteroid belt.',
        'Collect starshards and survive escalating waves.',
        'Move: WASD/Arrows | Aim: Mouse | Shoot: Space/Click',
        `Best Score: ${best}`
      ], 'Press Space or Click to Start');
    } else if (screen === SCREEN_SHOP) {
      drawPanel(`WAVE ${state.wave - 1} CLEARED`, [
        `Starshards Collected: ${state.shards}`,
        'Upgrades available between waves!',
        'Shields, Thrusters, Magnet, Cannon',
      ], 'Press Space to Continue to Next Wave');
    } else if (screen === SCREEN_PLAY) {
      drawHud(state);
    } else if (screen === SCREEN_PAUSED) {
      drawHud(state);
      drawPanel('PAUSED', ['Game is paused.'], 'Press P or Escape to Resume');
    } else if (screen === SCREEN_OVER) {
      drawPanel('GAME OVER', [
        `Final Score: ${state.score}`,
        `Waves Survived: ${state.wave - 1}`,
        `Best Score: ${best}`
      ], 'Press Space or Click to Play Again');
    }
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw };
}
