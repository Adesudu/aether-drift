export const KIND_ASTEROID = 0;
export const KIND_SHARD = 1;
export const KIND_BULLET = 2;

export function createEntitiesPool(size = 128) {
  const items = [];
  for (let i = 0; i < size; i++) {
    items.push({
      active: false,
      kind: KIND_ASTEROID,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: 20,
      health: 1,
      maxHealth: 1,
      rotation: 0,
      rotSpeed: 0,
      seed: 0,
    });
  }

  function spawn(kind, props) {
    for (let i = 0; i < items.length; i++) {
      if (!items[i].active) {
        const item = items[i];
        item.active = true;
        item.kind = kind;
        item.x = props.x ?? 0;
        item.y = props.y ?? 0;
        item.vx = props.vx ?? 0;
        item.vy = props.vy ?? 0;
        item.radius = props.radius ?? 20;
        item.health = props.health ?? 1;
        item.maxHealth = props.maxHealth ?? item.health;
        item.rotation = props.rotation ?? 0;
        item.rotSpeed = props.rotSpeed ?? (Math.random() - 0.5) * 2;
        item.seed = props.seed ?? Math.random();
        return item;
      }
    }
    return null;
  }

  function clear() {
    for (let i = 0; i < items.length; i++) {
      items[i].active = false;
    }
  }

  return { items, spawn, clear };
}

export function createParticlesPool(size = 64) {
  const particles = [];
  for (let i = 0; i < size; i++) {
    particles.push({ active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1, color: '#fff', size: 2 });
  }

  function emit(x, y, color, count = 5, speed = 150) {
    let spawned = 0;
    for (let i = 0; i < particles.length && spawned < count; i++) {
      if (!particles[i].active) {
        const p = particles[i];
        p.active = true;
        p.x = x;
        p.y = y;
        const angle = Math.random() * Math.PI * 2;
        const spd = Math.random() * speed;
        p.vx = Math.cos(angle) * spd;
        p.vy = Math.sin(angle) * spd;
        p.life = 0;
        p.maxLife = 0.3 + Math.random() * 0.3;
        p.color = color;
        p.size = 2 + Math.random() * 3;
        spawned++;
      }
    }
  }

  function update(dt) {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (!p.active) continue;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life += dt;
      if (p.life >= p.maxLife) p.active = false;
    }
  }

  function clear() {
    for (let i = 0; i < particles.length; i++) particles[i].active = false;
  }

  return { particles, emit, update, clear };
}
