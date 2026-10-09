import { CompleteInfo, COMPLETE_TYPE, Hand, Janpai, JANPAI_ID, McrUtil, Mentsu, WIND, MCR_YAKU } from '@masaue/jan-js-lib';
import type { Tile, HandContext, FanMatch, RuleSet } from '../types';
import { tileCounts } from './tiles';

const winds = [WIND.TON, WIND.NAN, WIND.SHA, WIND.PEI];
const honors = [JANPAI_ID.TON, JANPAI_ID.NAN, JANPAI_ID.SHA, JANPAI_ID.PEI, JANPAI_ID.CHUN, JANPAI_ID.FA, JANPAI_ID.BAI];
const yakuIds = new Map(Object.entries(MCR_YAKU).map(([id, value]) => [value.englishName, id]));

function toJanpai(tile: Tile): Janpai {
  const id = tile < 27 ? `${tile % 9 + 1}${['m', 's', 'p'][Math.floor(tile / 9)]}` : honors[tile - 27];
  return new Janpai(id as typeof JANPAI_ID[keyof typeof JANPAI_ID]);
}

export function calculateDazhong(ctx: HandContext, rule: RuleSet): FanMatch[] {
  const catalog = new Map(rule.fanItems.map(item => [item.id, item]));
  const tiles = [...ctx.handTiles, ctx.winTile!, ...ctx.melds.flatMap(m => m.tiles)];
  const counts = tileCounts(tiles);
  const closed = ctx.melds.every(m => m.type === 'concealed_kan' || m.type === 'concealed_pung');
  const extras = new Map<string, number>();
  let commonIds: string[] = [];
  if (closed) extras.set('CONCEALED_HAND', 1);
  if (ctx.isSelfDraw) extras.set('SELF_DRAWN', 1);
  if (ctx.flowers.length >= 4) extras.set('FLOWER_TILES', 1);
  const events: Record<string, string> = { replacement: 'OUT_WITH_REPLACEMENT_TILE', last_draw: 'LAST_TILE_DRAW', last_discard: 'LAST_TILE_CLAIM', rob_kong: 'ROBBING_THE_KONG', kong_discard: 'KONG_DISCARD', heavenly: 'HEAVENLY_HAND', earthly: 'EARTHLY_HAND', human: 'HUMAN_HAND' };
  if (events[ctx.event]) extras.set(events[ctx.event], 1);
  if (tiles.every(t => t < 27 && (t % 9 + 1) % 2 === 1)) extras.set('ALL_ODD', 1);
  if (tiles.every(t => t < 27 && (t % 9 + 1) % 2 === 0)) extras.set('ALL_EVEN_PUNGS', 1);
  if (!ctx.melds.length && counts.slice(27).every(n => n === 2)) extras.set('BIG_SEVEN_STARS', 1);
  if (ctx.handTiles.length === 1 && ctx.handTiles[0] === ctx.winTile && ctx.melds.length === 4 && ctx.melds.every(m => ['chow', 'pung', 'exposed_kan'].includes(m.type))) extras.set('MELDED_HAND', 1);
  for (const [type, id] of [['exposed_kan', 'MELDED_KONG'], ['concealed_kan', 'CONCEALED_KONG']]) {
    const count = ctx.melds.filter(m => m.type === type).length;
    if (count) extras.set(id, count);
  }

  function matches(ids: string[]): FanMatch[] {
    const frequencies = new Map(extras);
    for (const id of ids) {
      if (catalog.has(id) && !extras.has(id)) frequencies.set(id, (frequencies.get(id) ?? 0) + 1);
    }
    if (frequencies.has('OUTSIDE_HAND') && tiles.every(t => t < 27)) frequencies.set('PURE_OUTSIDE_HAND', 1);
    // Resolve mutual exclusions in score order, keeping the higher pattern.
    const blocked = new Set<string>();
    const selected: FanMatch[] = [];
    const priority = (id: string) => catalog.get(id)?.multiplier ? Number.MAX_SAFE_INTEGER : catalog.get(id)?.fan ?? 0;
    const candidates = [...frequencies].sort(([a], [b]) => priority(b) - priority(a));
    for (const [id, count] of candidates) {
      const entry = catalog.get(id);
      if (!entry || blocked.has(id)) continue;
      selected.push({ id, count, name: entry.name, fan: entry.fan, multiplier: entry.multiplier, description: entry.description });
      const block = (excluded: string) => {
        if (blocked.has(excluded)) return;
        blocked.add(excluded);
        catalog.get(excluded)?.excludes?.forEach(block);
      };
      entry.excludes?.forEach(block);
    }
    return selected;
  }
  function score(ids: string[]) {
    const items = matches(ids);
    return Math.max(rule.scoring.minimumAdditiveFan, rule.scoring.baseFan + items.reduce((sum, item) => sum + item.fan * item.count, 0)) * items.reduce((value, item) => value * (item.multiplier ?? 1) ** item.count, 1);
  }

  // Use the library's decomposition and pattern recognition with this rule's scoring.
  class DazhongUtil extends McrUtil {
    static override _removeExcludeYaku(...[list]: Parameters<typeof McrUtil._removeExcludeYaku>) { return list; }
    static override _higherYakuList(...[a, b]: Parameters<typeof McrUtil._higherYakuList>) {
      return score([...commonIds, ...a.map(y => yakuIds.get(y.englishName)!)]) >= score([...commonIds, ...b.map(y => yakuIds.get(y.englishName)!)]) ? a : b;
    }
    static override _kongsYakuList(...[pattern]: Parameters<typeof McrUtil._kongsYakuList>): ReturnType<typeof McrUtil._kongsYakuList> {
      if (pattern.kongCount === 4) return [MCR_YAKU.FOUR_KONGS];
      if (pattern.kongCount === 3) return [MCR_YAKU.THREE_KONGS];
      return [];
    }
    static override _waitYaku(...[pattern, win, waits]: Parameters<typeof McrUtil._waitYaku>): ReturnType<typeof McrUtil._waitYaku> {
      if (waits.length !== 1) return undefined;
      if (pattern.chowList.some(c => c.concealedChow && ((c.head.number === 1 && c.head.next.next.equals(win)) || (c.head.number === 7 && c.head.equals(win))))) return MCR_YAKU.EDGE_WAIT;
      if (pattern.chowList.some(c => c.concealedChow && c.middle.equals(win))) return MCR_YAKU.CLOSED_WAIT;
      return pattern.head.equals(win) ? MCR_YAKU.SINGLE_WAIT : undefined;
    }
  }
  const hand = new Hand([...ctx.handTiles, ...ctx.melds.filter(m => m.type === 'concealed_pung').flatMap(m => m.tiles)].map(toJanpai));
  for (const meld of ctx.melds.filter(m => m.type !== 'concealed_pung')) {
    const head = toJanpai(meld.tiles[0]);
    hand.fix(meld.type === 'chow' ? Mentsu.createChowMentsu(head) : meld.type === 'pung' ? Mentsu.createPungMentsu(head) : Mentsu.createKongMentsu(head, meld.type === 'concealed_kan'));
  }
  const info = new CompleteInfo(toJanpai(ctx.winTile!), false, winds[ctx.roundWind], winds[ctx.seatWind], ctx.isSelfDraw ? COMPLETE_TYPE.DRAW : COMPLETE_TYPE.DISCARD);
  // Include whole-hand patterns when comparing alternative decompositions.
  const whole: typeof MCR_YAKU[keyof typeof MCR_YAKU][] = [...DazhongUtil._fullChowsYakuList(hand, info.janpai), ...DazhongUtil._limitedNumberYakuList(tiles.map(toJanpai))];
  const terminals = DazhongUtil._terminalsOrHonorsYaku(tiles.map(toJanpai));
  if (terminals) whole.push(terminals);
  if (tiles.every(t => t >= 27)) whole.push(MCR_YAKU.ALL_HONORS);
  DazhongUtil._specialYakuList(whole, hand, info.janpai);
  commonIds = whole.map(y => yakuIds.get(y.englishName)!);
  const complete = DazhongUtil.complete(hand, info);
  return matches(complete.yakuList.map(y => yakuIds.get(y.englishName)!));
}
