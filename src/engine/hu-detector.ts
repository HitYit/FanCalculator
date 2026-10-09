import type { HandContext, RuleSet } from '../types';
import { parseHand } from './hand-parser';
import { tileCounts } from './tiles';

const knittedSets = [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]].map(starts =>
  starts.flatMap((s, i) => [s * 9 + i, s * 9 + i + 3, s * 9 + i + 6]));

export function validateHand(ctx: HandContext, rule: RuleSet): string[] {
  const errors: string[] = [];
  const all = [...ctx.handTiles, ...(ctx.winTile === null ? [] : [ctx.winTile]), ...ctx.melds.flatMap(m => m.tiles)];
  if (ctx.winTile === null) errors.push('请选择胡牌张');
  if (ctx.melds.length > 4) errors.push('最多设置 4 组面子');
  if (ctx.handTiles.length + (ctx.winTile === null ? 0 : 1) + ctx.melds.length * 3 !== 14) errors.push('手牌与副露的有效张数应为 14 张（每杠按 3 张计）');
  if (all.some(t => !Number.isInteger(t) || t < 0 || t >= 34)) errors.push('手牌含有无效牌张');
  if (tileCounts(all).some(c => c > 4)) errors.push('同一种牌不能超过 4 张');
  for (const m of ctx.melds) {
    const [t] = m.tiles;
    const valid = m.type === 'chow' ? m.tiles.length === 3 && t < 27 && t % 9 <= 6 && m.tiles[1] === t + 1 && m.tiles[2] === t + 2 : m.tiles.length === (m.type.includes('kan') ? 4 : 3) && m.tiles.every(x => x === t);
    if (!valid) errors.push('副露牌型不合法');
  }
  if (ctx.flowers.some(t => t < 34 || t > 41 || !Number.isInteger(t)) || new Set(ctx.flowers).size !== ctx.flowers.length) errors.push('花牌不能重复或包含无效牌');
  if (!rule.tileSet.honors.length && all.some(t => t >= 27)) errors.push('当前规则不使用字牌');
  if (!rule.tileSet.flowers.length && ctx.flowers.length) errors.push('当前规则不使用花牌');
  if (['replacement', 'last_draw', 'heavenly', 'earthly'].includes(ctx.event) && !ctx.isSelfDraw) errors.push('所选胡牌事件只能自摸');
  if (['rob_kong', 'last_discard', 'kong_discard', 'human'].includes(ctx.event) && ctx.isSelfDraw) errors.push('所选胡牌事件只能点炮');
  if (ctx.event === 'heavenly' && ctx.seatWind !== 0) errors.push('天胡只能由庄家（东家）胡牌');
  if (['earthly', 'human'].includes(ctx.event) && ctx.seatWind === 0) errors.push('地胡、人胡只能由非庄家胡牌');
  if (['heavenly', 'earthly', 'human'].includes(ctx.event) && ctx.melds.length) errors.push('天胡、地胡、人胡不能有已设置的面子');
  if (![ctx.roundWind, ctx.seatWind].every(w => Number.isInteger(w) && w >= 0 && w < 4)) errors.push('场风或门风无效');
  return [...new Set(errors)];
}
export function detectHu(ctx: HandContext): string | null {
  if (ctx.winTile === null) return null;
  const tiles = [...ctx.handTiles, ctx.winTile], counts = tileCounts(tiles);
  if (!ctx.melds.length && tiles.length === 14) {
    if (counts.every(c => c % 2 === 0)) return '七对子';
    const terminals = [0,8,9,17,18,26,27,28,29,30,31,32,33];
    if (terminals.every(t => counts[t] > 0) && tiles.every(t => terminals.includes(t))) return '十三幺';
    for (const knitted of knittedSets) {
      if (tiles.every(t => t >= 27 || knitted.includes(t)) && counts.every(c => c <= 1)) return '全不靠';
      if (knitted.every(t => counts[t])) {
        const rest = [...tiles]; for (const t of knitted) rest.splice(rest.indexOf(t), 1);
        if (parseHand(rest).length) return '组合龙';
      }
    }
  }
  if (ctx.melds.length === 1 && tiles.length === 11) {
    for (const knitted of knittedSets) {
      if (!knitted.every(t => counts[t])) continue;
      const rest = [...tiles];
      for (const t of knitted) rest.splice(rest.indexOf(t), 1);
      if (rest.length === 2 && rest[0] === rest[1]) return '组合龙';
    }
  }
  return parseHand(tiles).some(d => d.groups.length + ctx.melds.length === 4) ? '四面子一将' : null;
}
