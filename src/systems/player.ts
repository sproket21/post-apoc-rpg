import type { PlayerState, Stats, StatKey, Skills, InventoryStack, ItemDef } from '../types';
import { ITEMS } from '../data/items';

export function defaultStats(): Stats {
  return { S: 5, P: 5, E: 5, C: 5, I: 5, A: 5, L: 5 };
}

export function baseSkills(stats: Stats): Skills {
  return {
    smallGuns: 5 + 4 * stats.A,
    melee: 20 + 2 * (stats.S + stats.A),
    medicine: 5 + 2 * (stats.I + stats.P),
    lockpick: 10 + stats.P + stats.A,
    speech: 5 * stats.C,
    sneak: 5 + 3 * stats.A,
  };
}

export function maxHpFor(stats: Stats, level: number): number {
  return 15 + stats.E * 2 + stats.S + (level - 1) * (2 + Math.floor(stats.E / 2));
}

export function maxApFor(stats: Stats): number {
  return 5 + Math.floor(stats.A / 2);
}

export function xpToNextLevel(level: number): number {
  return level * 1000;
}

export function makePlayer(name: string, stats: Stats): PlayerState {
  const skills = baseSkills(stats);
  const maxHp = maxHpFor(stats, 1);
  const maxAp = maxApFor(stats);
  return {
    name: name.trim() || 'Странник',
    level: 1,
    xp: 0,
    hp: maxHp,
    maxHp,
    ap: maxAp,
    maxAp,
    stats,
    skills,
    skillPoints: 0,
    inventory: [
      { itemId: 'knife', count: 1 },
      { itemId: 'bandage', count: 3 },
      { itemId: 'stimpack', count: 1 },
    ],
    equip: { weapon: 'knife' },
    caps: 50,
    locationId: 'village',
    tileX: 13,
    tileY: 10,
    quests: {},
    flags: {},
  };
}

export function addItem(player: PlayerState, itemId: string, count = 1) {
  const def = ITEMS[itemId];
  if (!def) return;
  if (def.stackable) {
    const existing = player.inventory.find((s) => s.itemId === itemId);
    if (existing) {
      existing.count += count;
      return;
    }
  }
  for (let i = 0; i < count; i++) {
    if (def.stackable && i === 0) {
      player.inventory.push({ itemId, count });
      break;
    }
    if (!def.stackable) {
      player.inventory.push({ itemId, count: 1 });
    }
  }
}

export function removeItem(player: PlayerState, itemId: string, count = 1): boolean {
  let remaining = count;
  for (let i = player.inventory.length - 1; i >= 0 && remaining > 0; i--) {
    const stack = player.inventory[i];
    if (stack.itemId === itemId) {
      const take = Math.min(stack.count, remaining);
      stack.count -= take;
      remaining -= take;
      if (stack.count <= 0) player.inventory.splice(i, 1);
    }
  }
  return remaining === 0;
}

export function countItem(player: PlayerState, itemId: string): number {
  return player.inventory.filter((s) => s.itemId === itemId).reduce((a, s) => a + s.count, 0);
}

export function equipWeapon(player: PlayerState, itemId: string | undefined) {
  player.equip.weapon = itemId;
}

export function equipArmor(player: PlayerState, itemId: string | undefined) {
  player.equip.armor = itemId;
}

export function weaponOf(player: PlayerState): ItemDef {
  const id = player.equip.weapon;
  if (id && ITEMS[id]) return ITEMS[id];
  return ITEMS.fist;
}

export function armorValue(player: PlayerState): number {
  const id = player.equip.armor;
  if (id && ITEMS[id] && ITEMS[id].armor != null) return ITEMS[id].armor!;
  return 0;
}

export function grantXp(player: PlayerState, amount: number): boolean {
  player.xp += amount;
  let leveled = false;
  while (player.xp >= xpToNextLevel(player.level)) {
    player.xp -= xpToNextLevel(player.level);
    player.level += 1;
    player.skillPoints += 10;
    const newMaxHp = maxHpFor(player.stats, player.level);
    const diff = newMaxHp - player.maxHp;
    player.maxHp = newMaxHp;
    player.hp = Math.min(player.maxHp, player.hp + diff);
    leveled = true;
  }
  return leveled;
}

export const STAT_NAMES: Record<StatKey, string> = {
  S: 'Сила',
  P: 'Восприятие',
  E: 'Выносливость',
  C: 'Харизма',
  I: 'Интеллект',
  A: 'Ловкость',
  L: 'Удача',
};

export const STAT_DESC: Record<StatKey, string> = {
  S: 'Физическая мощь. Влияет на урон в ближнем бою и переносимый вес.',
  P: 'Острота чувств. Влияет на меткость и дальность обзора.',
  E: 'Стойкость. Влияет на максимальное здоровье.',
  C: 'Обаяние и умение говорить. Влияет на торговлю и диалоги.',
  I: 'Сообразительность. Влияет на медицину и получение очков навыков.',
  A: 'Ловкость. Влияет на очки действия и скорость.',
  L: 'Удача. Влияет на шанс критических ударов.',
};

export function totalInventoryWeight(inv: InventoryStack[]): number {
  let w = 0;
  for (const stack of inv) {
    const def = ITEMS[stack.itemId];
    if (def) w += def.weight * stack.count;
  }
  return w;
}

export function maxCarryWeight(player: PlayerState): number {
  return 25 + player.stats.S * 10;
}
