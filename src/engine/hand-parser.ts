import type { Tile } from '../types';
import { tileCounts } from './tiles';
export interface Decomposition { pair: Tile; groups: { type: 'chow' | 'pung'; tiles: Tile[] }[] }

export function parseHand(tiles: Tile[]): Decomposition[] {
  if (tiles.length % 3 !== 2) return [];
  const counts = tileCounts(tiles), results: Decomposition[] = [];
  const groups: Decomposition['groups'] = [];
  function visit(pair: Tile) {
    const first = counts.findIndex(c => c > 0);
    if (first === -1) { results.push({ pair, groups: groups.map(g => ({ ...g, tiles: [...g.tiles] })) }); return; }
    if (counts[first] >= 3) {
      counts[first] -= 3; groups.push({ type: 'pung', tiles: [first, first, first] });
      visit(pair); groups.pop(); counts[first] += 3;
    }
    if (first < 27 && first % 9 <= 6 && counts[first + 1] && counts[first + 2]) {
      counts[first]--; counts[first + 1]--; counts[first + 2]--;
      groups.push({ type: 'chow', tiles: [first, first + 1, first + 2] });
      visit(pair); groups.pop(); counts[first]++; counts[first + 1]++; counts[first + 2]++;
    }
  }
  for (let pair = 0; pair < 34; pair++) if (counts[pair] >= 2) {
    counts[pair] -= 2; visit(pair); counts[pair] += 2;
  }
  return results;
}
