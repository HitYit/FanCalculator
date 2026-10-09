import { describe, expect, it } from 'vitest';
import { parseHand } from './hand-parser';
import { detectHu, validateHand } from './hu-detector';
import { calculateFan } from './fan-calculator';
import { emptyContext, exampleContext } from '../store/useCalculatorStore';
import { getRuleSet, ruleSets } from '../rule';
import { makeMeld } from './tiles';
import { calculateScore } from './score-calculator';

const rule = getRuleSet('dazhong-mahjong');

describe('hand-parser', () => {
  it('finds decompositions without mutating the input', () => {
    const tiles = [0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4];
    const before = [...tiles];
    expect(parseHand(tiles).length).toBeGreaterThan(1);
    expect(tiles).toEqual(before);
  });
  it('does not form sequences across suits or honors', () => {
    expect(parseHand([7, 8, 9, 10, 10])).toEqual([]);
    expect(parseHand([27, 28, 29, 31, 31])).toEqual([]);
  });
});

describe('hu-detector', () => {
  it('detects standard, seven pairs and thirteen orphans', () => {
    expect(detectHu(exampleContext())).toBe('四面子一将');
    expect(detectHu({ ...emptyContext(), handTiles: [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6], winTile: 6 })).toBe('七对子');
    expect(detectHu({ ...emptyContext(), handTiles: [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33], winTile: 0 })).toBe('十三幺');
  });
  it('validates physical counts and effective kong count', () => {
    const c = { ...emptyContext(), handTiles: [1, 2, 3, 9, 10, 11, 18, 19, 20, 27], winTile: 27, melds: [makeMeld('concealed_kan', 0, 'k')] };
    expect(validateHand(c, rule)).toEqual([]);
    expect(validateHand({ ...c, winTile: 0, handTiles: [0, ...c.handTiles.slice(1)] }, rule).join()).toContain('超过 4');
  });
});

describe('dazhong rule', () => {
  it('registers only one complete 81-pattern rule', () => {
    expect(ruleSets).toHaveLength(1);
    expect(rule.fanItems).toHaveLength(81);
    expect(new Set(rule.fanItems.map(item => item.id)).size).toBe(81);
    expect(rule.name).toBe('大众麻将');
  });
  it('uses the pictured basic fan values and multiplier events', () => {
    expect(rule.fanItems.find(item => item.id === 'SELF_DRAWN')?.fan).toBe(1);
    expect(rule.fanItems.find(item => item.id === 'MELDED_KONG')?.fan).toBe(2);
    expect(rule.fanItems.find(item => item.id === 'CONCEALED_KONG')?.fan).toBe(4);
    expect(rule.fanItems.find(item => item.id === 'ALL_SIMPLES')?.fan).toBe(4);
    expect(rule.fanItems.find(item => item.id === 'CONCEALED_HAND')?.fan).toBe(4);
    expect(rule.fanItems.find(item => item.id === 'OUT_WITH_REPLACEMENT_TILE')?.multiplier).toBe(2);
  });
  it('counts a four-flower bonus and stacks it with self draw', () => {
    const result = calculateFan({ ...exampleContext(), flowers: [34, 35, 36, 37] }, rule);
    expect(result.valid).toBe(true);
    expect(result.items.find(item => item.id === 'FLOWER_TILES')?.fan).toBe(2);
    expect(result.items.find(item => item.id === 'SELF_DRAWN')?.fan).toBe(1);
  });
  it('rejects an invalid hand before scoring', () => {
    expect(calculateFan(emptyContext(), rule).valid).toBe(false);
  });
  it('adds independent self draw and closed-hand bonuses', () => {
    const result = calculateFan(exampleContext(), rule);
    expect(result.items.find(i => i.id === 'PURE_STRAIGHT')?.fan).toBe(24);
    expect(result.items.find(i => i.id === 'CONCEALED_HAND')?.fan).toBe(4);
    expect(result.items.find(i => i.id === 'SELF_DRAWN')?.fan).toBe(1);
    expect(result.items.some(i => i.id === 'CLOSED_WAIT')).toBe(false);
  });
  it('applies all five event multipliers after adding, omitting self draw on last draw', () => {
    for (const event of ['replacement', 'last_draw', 'last_discard', 'rob_kong', 'kong_discard'] as const) {
      const result = calculateFan({...exampleContext(), event, isSelfDraw: ['replacement', 'last_draw'].includes(event)}, rule);
      expect(result.valid).toBe(true);
      expect(result.multiplier).toBe(2);
      expect(result.totalFan).toBe(result.additiveFan * 2);
      if (event === 'last_draw') expect(result.items.some(i => i.id === 'SELF_DRAWN')).toBe(false);
    }
  });
  it('excludes lower special patterns for big seven stars', () => {
    const result = calculateFan({...emptyContext(), handTiles: [27,27,28,28,29,29,30,30,31,31,32,32,33], winTile: 33}, rule);
    expect(result.items.some(i => i.id === 'BIG_SEVEN_STARS')).toBe(true);
    expect(result.items.some(i => ['ALL_HONORS', 'SEVEN_PAIRS', 'ALL_TERMINALS_AND_HONORS', 'CONCEALED_HAND'].includes(i.id))).toBe(false);
  });
  it('recognizes a knitted straight with a fixed exposed meld', () => {
    const context = {...emptyContext(), handTiles: [0,3,6,10,13,16,20,23,26,27], winTile: 27, melds: [makeMeld('chow', 1, 'knit')]};
    expect(detectHu(context)).toBe('组合龙');
    expect(calculateFan(context, rule).items.find(i => i.id === 'KNITTED_STRAIGHT')?.fan).toBe(12);
  });
  it('settles dealer wins and dealer discards separately and totals the three payments', () => {
    const result = {valid:true, errors:[], items:[], additiveFan:8, multiplier:1, totalFan:8};
    const dealer = {...exampleContext(), isSelfDraw:false, seatWind:0, roundWind:0};
    const nonDealer = {...dealer, seatWind:1};
    expect(calculateScore(result, dealer, rule)?.total).toBe(16);
    expect(calculateScore(result, nonDealer, rule)?.total).toBe(8);
    expect(calculateScore(result, {...nonDealer, discarderIsDealer:true}, rule)?.total).toBe(16);
    const self = calculateScore(result, {...nonDealer, isSelfDraw:true}, rule)!;
    expect(self.payments).toEqual([8,8,16]);
    expect(self.playerIsDealer).toEqual([false,false,true]);
    expect(self.total).toBe(32);
    const dealerSelf = calculateScore(result, {...dealer, isSelfDraw:true}, rule)!;
    expect(dealerSelf.payments).toEqual([16,16,16]);
    expect(dealerSelf.total).toBe(48);
    expect(calculateScore(calculateFan(emptyContext(), rule), emptyContext(), rule)).toBeNull();
  });
  it('uses a minimum additive value of one before event multipliers', () => {
    const zeroRule = {...rule, fanItems:rule.fanItems.map(item => ({...item, fan:0}))};
    const result = calculateFan({...exampleContext(), event:'last_draw'}, zeroRule);
    expect(result.valid).toBe(true);
    expect(result.additiveFan).toBe(1);
    expect(result.totalFan).toBe(2);
  });
});
