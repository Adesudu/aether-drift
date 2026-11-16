import { BEST_KEY, LIVES, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_HIT, EVENT_OVER, EVENT_WAVE_CLEAR } from './world.js';
import { ACTION_CONFIRM, ACTION_PAUSE, ACTION_SHOOT, ACTION_DASH, ACTION_MUTE, createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_SHOP } from './render.js';
import { stageShot } from './shots.js';
import { initAudio, toggleMute, playShoot, playExplosion, playPickup, playWaveStart } from './audio.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {}
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  function announce(msg) {
    status.textContent = msg;
  }

  function startGame() {
    initAudio();
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    playWaveStart();
    announce(`Playing. ${LIVES} lives.`);
  }

  function endGame() {
    screen = SCREEN_OVER;
    playExplosion();
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
    announce(`Game over. Score ${world.state.score}. Best ${best}.`);
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) {
      toggleMute();
    }
    if (actions & ACTION_CONFIRM) {
      initAudio();
      if (screen === SCREEN_TITLE || screen === SCREEN_OVER) {
        startGame();
      } else if (screen === SCREEN_SHOP) {
        screen = SCREEN_PLAY;
        playWaveStart();
        announce(`Playing wave ${world.state.wave}.`);
      }
    }
    if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    } else if (actions & ACTION_PAUSE && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
    }
  }

  function step() {
    if (screen === SCREEN_TITLE) {
      world.step(STEP, { x: 0, y: 0 }, false, false, true);
      return;
    }
    if (screen === SCREEN_SHOP || screen === SCREEN_PAUSED) return;

    // Aim angle towards mouse
    const p = world.state.player;
    const dx = input.mouse.x - p.x;
    const dy = input.mouse.y - p.y;
    p.angle = Math.atan2(dy, dx);

    const vec = input.vector();
    const isShooting = input.isShooting();
    const actions = input.takeActions();
    const isDashing = (actions & ACTION_DASH) !== 0;

    const events = world.step(STEP, vec, isShooting, isDashing, false);
    if (events & EVENT_OVER) endGame();
    else if (events & EVENT_HIT) {
      playExplosion();
      announce(world.state.lives === 1 ? 'Hit. 1 life left.' : `Hit. ${world.state.lives} lives left.`);
    } else if (events & EVENT_COIN) {
      playPickup();
    } else if (events & EVENT_WAVE_CLEAR) {
      screen = SCREEN_SHOP;
      playWaveStart();
      announce(`Wave cleared. Shop open.`);
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Aether Drift. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
