import type { HandContext, FanResult, RuleSet } from '../types';
export interface ScoreResult {
  total: number;
  payments: number[];
  playerIsDealer: boolean[];
  paymentMultipliers: number[];
  winnerMultiplier: number;
  singlePayment: number;
}
export function calculateScore(result: FanResult, ctx: HandContext, rule: RuleSet): ScoreResult | null {
  if (!result.valid) return null;
  const winnerIsDealer = ctx.seatWind === ctx.roundWind;
  // Players 1–3 are the other seats in order after the winner.
  const playerIsDealer = [1, 2, 3].map(offset => (ctx.seatWind + offset) % 4 === ctx.roundWind);
  const winnerMultiplier = winnerIsDealer ? rule.scoring.dealerMultiplier : 1;
  const base = result.totalFan * (ctx.isSelfDraw ? rule.scoring.selfDrawMultiplier / 3 : rule.scoring.discardMultiplier);
  const singlePayment = base * winnerMultiplier;
  let paymentMultipliers: number[];
  if (ctx.isSelfDraw) {
    paymentMultipliers = playerIsDealer.map(dealer => winnerMultiplier * (dealer ? rule.scoring.dealerMultiplier : 1));
  } else {
    const dealerDiscard = !winnerIsDealer && Boolean(ctx.discarderIsDealer);
    const payerIndex = playerIsDealer.findIndex(dealer => dealer === dealerDiscard);
    paymentMultipliers = playerIsDealer.map((dealer, index) => index === payerIndex
      ? winnerMultiplier * (dealer ? rule.scoring.dealerMultiplier : 1) : 0);
  }
  const payments = paymentMultipliers.map(multiplier => base * multiplier);
  return {
    total: payments.reduce((sum, payment) => sum + payment, 0),
    payments, playerIsDealer, paymentMultipliers, winnerMultiplier, singlePayment
  };
}
