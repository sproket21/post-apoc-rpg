import { LOCATIONS, PASSABLE_TILES } from '../data/locations';

export function tileAt(locationId: string, x: number, y: number): string {
  const loc = LOCATIONS[locationId];
  if (!loc) return '#';
  if (y < 0 || y >= loc.tiles.length) return '#';
  const row = loc.tiles[y];
  if (x < 0 || x >= row.length) return '#';
  return row[x] ?? '#';
}

export function isPassable(locationId: string, x: number, y: number): boolean {
  return PASSABLE_TILES.has(tileAt(locationId, x, y));
}
