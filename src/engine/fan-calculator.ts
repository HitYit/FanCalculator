import type { HandContext, FanResult, RuleSet } from '../types';
import { validateHand, detectHu } from './hu-detector';
import { calculateDazhong } from './mcr-adapter';

export function calculateFan(ctx: HandContext, rule: RuleSet): FanResult {
  const empty = { valid: false, items: [], additiveFan: 0, multiplier: 1, totalFan: 0 };
  const errors = validateHand(ctx, rule);
  if (errors.length) return { ...empty, errors };
  const shape = detectHu(ctx);
  if (!shape) return { ...empty, errors: ['当前牌型无法组成胡牌，请检查手牌与胡牌张'] };
  try {
    const items = calculateDazhong(ctx, rule);
    const additiveFan = Math.max(rule.scoring.minimumAdditiveFan, rule.scoring.baseFan + items.reduce((sum, item) => sum + item.fan * item.count, 0));
    const multiplier = items.reduce((value, item) => value * (item.multiplier ?? 1) ** item.count, 1);
    const totalFan = additiveFan * multiplier;
    if (totalFan < rule.scoring.minFanToWin) errors.push(`未达到 ${rule.scoring.minFanToWin} 番起胡门槛`);
    if (rule.scoring.chickenSelfDrawOnly && !ctx.isSelfDraw && !items.some(item => item.id !== 'FLOWER_TILES')) errors.push('鸡胡只能自摸');
    return { valid: !errors.length, errors, items, additiveFan, multiplier, totalFan, shape };
  } catch {
    return { ...empty, errors: ['计番引擎无法解析此牌型，请检查副露设置'] };
  }
}
