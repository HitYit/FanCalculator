import type { Tile, Meld } from '../types';
export const suitNames = ['万', '条', '筒'];
export const honorNames = ['东', '南', '西', '北', '中', '发', '白'];
export const flowerNames = ['春', '夏', '秋', '冬', '梅', '兰', '竹', '菊'];
export const isHonor = (t: Tile) => t >= 27 && t < 34;
export const isTerminal = (t: Tile) => t < 27 && (t % 9 === 0 || t % 9 === 8);
export const tileName = (t: Tile) => t < 27 ? `${t % 9 + 1}${suitNames[Math.floor(t / 9)]}` : t < 31 ? `${honorNames[t - 27]}风` : t === 31 ? '红中' : t === 32 ? '发财' : t === 33 ? '白板' : flowerNames[t - 34];
export function tileCounts(tiles: Tile[]) {
  const counts = Array<number>(34).fill(0);
  for (const t of tiles) if (Number.isInteger(t) && t >= 0 && t < 34) counts[t]++;
  return counts;
}
export const meldLabel: Record<Meld['type'], string> = { chow: '吃', pung: '碰', concealed_pung: '暗刻', exposed_kan: '明杠', concealed_kan: '暗杠' };
export function makeMeld(type: Meld['type'], tile: Tile, id: string = crypto.randomUUID()): Meld {
  return { id, type, tiles: type === 'chow' ? [tile, tile + 1, tile + 2] : Array(type.includes('kan') ? 4 : 3).fill(tile) };
}
