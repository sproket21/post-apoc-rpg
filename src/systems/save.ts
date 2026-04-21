import type { PlayerState } from '../types';

const KEY = 'post-apoc-rpg:save:v1';
const ENEMY_KEY = 'post-apoc-rpg:enemies:v1';

export interface SaveData {
  player: PlayerState;
  killedEnemies: string[]; // instance ids
  lootedPiles: string[]; // onceFlags used
  savedAt: number;
}

export function saveGame(player: PlayerState, killed: Set<string>, looted: Set<string>) {
  const data: SaveData = {
    player,
    killedEnemies: Array.from(killed),
    lootedPiles: Array.from(looted),
    savedAt: Date.now(),
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function loadGame(): SaveData | null {
  try {
    const s = localStorage.getItem(KEY);
    if (!s) return null;
    return JSON.parse(s) as SaveData;
  } catch {
    return null;
  }
}

export function hasSave(): boolean {
  return localStorage.getItem(KEY) !== null;
}

export function clearSave() {
  localStorage.removeItem(KEY);
  localStorage.removeItem(ENEMY_KEY);
}
