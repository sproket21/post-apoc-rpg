import type { PlayerState } from '../types';
import { LOCATIONS } from '../data/locations';

export class GameState {
  player!: PlayerState;
  killedEnemies = new Set<string>();
  lootedPiles = new Set<string>();
  log: string[] = [];

  addLog(msg: string) {
    this.log.push(msg);
    if (this.log.length > 200) this.log.shift();
    // eslint-disable-next-line no-console
    console.log('[ЛОГ]', msg);
  }

  liveEnemiesInLocation(locationId: string) {
    const loc = LOCATIONS[locationId];
    if (!loc) return [];
    return loc.enemies.filter((e) => !this.killedEnemies.has(e.id));
  }
}

export const gameState = new GameState();
