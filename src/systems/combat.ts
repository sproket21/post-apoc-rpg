import type { PlayerState, EnemyInstance, EnemyDef } from '../types';
import { ENEMIES } from '../data/enemies';
import { ITEMS } from '../data/items';
import { weaponOf, armorValue } from './player';

export function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function chance(p: number): boolean {
  return Math.random() < p;
}

export function hitChance(
  attackerSkill: number,
  distance: number,
  maxRange: number,
  targetArmor: number,
): number {
  // base from skill, falloff by distance beyond half of range, armor reduces
  let base = attackerSkill;
  if (distance > maxRange) return 0;
  if (distance > 1 && maxRange > 1) {
    const half = maxRange / 2;
    if (distance > half) {
      const excess = distance - half;
      base -= (excess / (maxRange - half)) * 40;
    }
  }
  base -= targetArmor * 3;
  if (base < 5) base = 5;
  if (base > 95) base = 95;
  return base / 100;
}

export interface AttackResult {
  hit: boolean;
  damage: number;
  crit: boolean;
  targetDead: boolean;
}

export function playerAttack(
  player: PlayerState,
  enemy: EnemyInstance,
  distance: number,
): AttackResult {
  const weapon = weaponOf(player);
  const def = ENEMIES[enemy.defId];
  const skill = weapon.skill ? player.skills[weapon.skill] : 30;
  const ch = hitChance(skill, distance, weapon.range ?? 1, def.armor);
  if (!chance(ch)) return { hit: false, damage: 0, crit: false, targetDead: false };

  let dmg = rand(weapon.damage?.[0] ?? 1, weapon.damage?.[1] ?? 2);
  // strength bonus for melee
  if (weapon.range === 1) dmg += Math.max(0, player.stats.S - 5);
  const isCrit = chance(0.05 + player.stats.L * 0.01);
  if (isCrit) dmg = Math.floor(dmg * 2);
  dmg = Math.max(1, dmg - def.armor);
  enemy.hp -= dmg;
  return { hit: true, damage: dmg, crit: isCrit, targetDead: enemy.hp <= 0 };
}

export function enemyAttack(
  player: PlayerState,
  enemy: EnemyInstance,
  distance: number,
): AttackResult {
  const def = ENEMIES[enemy.defId];
  // enemy skill approximation
  const skill = 30 + def.stats.P * 5 + def.stats.A * 2;
  const ch = hitChance(skill, distance, def.range, armorValue(player));
  if (!chance(ch)) return { hit: false, damage: 0, crit: false, targetDead: false };
  let dmg = rand(def.damage[0], def.damage[1]);
  const isCrit = chance(0.03 + def.stats.L * 0.01);
  if (isCrit) dmg = Math.floor(dmg * 2);
  dmg = Math.max(1, dmg - armorValue(player));
  player.hp -= dmg;
  return { hit: true, damage: dmg, crit: isCrit, targetDead: player.hp <= 0 };
}

export function chebyshev(ax: number, ay: number, bx: number, by: number): number {
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by));
}

export function weaponApCost(player: PlayerState): number {
  const w = weaponOf(player);
  return w.apCost ?? 4;
}

export function hasAmmo(player: PlayerState): boolean {
  const w = weaponOf(player);
  if (!w.ammoType) return true;
  return (player.inventory.find((s) => s.itemId === w.ammoType)?.count ?? 0) > 0;
}

export function consumeAmmo(player: PlayerState): boolean {
  const w = weaponOf(player);
  if (!w.ammoType) return true;
  const stack = player.inventory.find((s) => s.itemId === w.ammoType);
  if (!stack || stack.count <= 0) return false;
  stack.count -= 1;
  if (stack.count <= 0) {
    const idx = player.inventory.indexOf(stack);
    player.inventory.splice(idx, 1);
  }
  return true;
}

export function lootFromEnemy(def: EnemyDef): { itemId: string; count: number }[] {
  const out: { itemId: string; count: number }[] = [];
  for (const entry of def.loot ?? []) {
    if (!chance(entry.chance)) continue;
    const count = entry.count ? rand(entry.count[0], entry.count[1]) : 1;
    if (ITEMS[entry.itemId]) out.push({ itemId: entry.itemId, count });
  }
  return out;
}
