export const UPGRADES = [
  { id: 'shield', name: 'Energy Shield', cost: 30, costScale: 1.5, maxLevel: 3, desc: 'Absorbs 1 hit per level' },
  { id: 'thrusters', name: 'Ion Thrusters', cost: 25, costScale: 1.4, maxLevel: 3, desc: 'Faster movement & shorter dash CD' },
  { id: 'magnet', name: 'Shard Magnet', cost: 20, costScale: 1.3, maxLevel: 3, desc: 'Pulls starshards from farther away' },
  { id: 'cannon', name: 'Plasma Cannon', cost: 35, costScale: 1.6, maxLevel: 3, desc: 'Faster fire rate & dual shots' },
];

export function createShopState() {
  const levels = {
    shield: 0,
    thrusters: 0,
    magnet: 0,
    cannon: 0,
  };

  function getCost(id) {
    const up = UPGRADES.find(u => u.id === id);
    const lvl = levels[id];
    return Math.round(up.cost * (up.costScale ** lvl));
  }

  function buy(id, shardsRef) {
    const up = UPGRADES.find(u => u.id === id);
    if (levels[id] >= up.maxLevel) return false;
    const cost = getCost(id);
    if (shardsRef.count >= cost) {
      shardsRef.count -= cost;
      levels[id]++;
      return true;
    }
    return false;
  }

  function reset() {
    levels.shield = 0;
    levels.thrusters = 0;
    levels.magnet = 0;
    levels.cannon = 0;
  }

  return { levels, getCost, buy, reset };
}
