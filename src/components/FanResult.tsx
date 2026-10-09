import { Check, BookmarkPlus, ArrowUpRight, CircleAlert, Layers3 } from 'lucide-react';
import { IOSButton } from './ios/IOSButton';
import { calculateScore } from '../engine/score-calculator';
import type { FanResult as Result, HandContext, RuleSet } from '../types';
import './FanResult.css';

export function FanResult({ result, context, rule, onCalculate, onSave, onRules }: {
  result: Result | null; context: HandContext; rule: RuleSet;
  onCalculate: () => void; onSave: () => void; onRules: () => void;
}) {
  const score = result ? calculateScore(result, context, rule) : null;
  const count = context.handTiles.length + (context.winTile === null ? 0 : 1) + context.melds.length * 3;
  const dealer = context.seatWind === context.roundWind;
  const dealerDiscard = !context.isSelfDraw && !dealer && context.discarderIsDealer;
  const settlementItems = Number(dealer) + Number(dealerDiscard);
  const additiveTerms = result ? [rule.scoring.baseFan, ...result.items.map(item => item.fan * item.count)].filter(value => value > 0) : [];
  const sum = additiveTerms.reduce((value, term) => value + term, 0);
  const addition = sum >= rule.scoring.minimumAdditiveFan ? additiveTerms.join(' + ') : String(rule.scoring.minimumAdditiveFan);
  const paymentFactor = context.isSelfDraw ? rule.scoring.selfDrawMultiplier / 3 : rule.scoring.discardMultiplier;
  const paymentValues = score ? [...new Set(score.payments.filter(payment => payment > 0))] : [];

  return <aside className="result-column">
    <div className="result-panel">
      <div className="result-title"><span>本次算番</span><span className="live-dot">{score ? '已完成' : '待计算'}</span></div>
      <div className="fan-number"><strong>{score?.total ?? '—'}</strong><span>倍</span></div>
      <div className="result-subtitle">三家赔付合计</div>
      {score && <div className="player-payments" aria-label="三家赔付明细">{score.payments.map((payment, index) =>
        <div className={score.playerIsDealer[index] ? 'dealer-payment' : ''} key={index}>
          <strong>玩家{index + 1}{score.playerIsDealer[index] && '（庄）'}</strong>
          <b>{payment} 倍</b>
          {!context.isSelfDraw && score.paymentMultipliers[index] > 0 && <small>点炮方</small>}
        </div>
      )}</div>}
      <div className="result-rule"><Layers3 size={15}/>{rule.name}</div>
      <div className="result-separator"/>
      <div className="hand-status"><span>有效牌数</span><span className={count === 14 ? 'complete' : ''}>{count} / 14 张 {count === 14 && <Check size={14}/>}</span></div>
      <div className="hand-status"><span>胡牌方式</span><span>{context.isSelfDraw ? '自摸' : `点炮 · 点炮方（${dealerDiscard ? '庄' : '非庄'}）`}</span></div>
      <div className="hand-status"><span>赢家</span><strong>{dealer ? '庄' : '非庄'}</strong></div>
      <IOSButton className="calculate-button" onClick={onCalculate}>计算番数<ArrowUpRight size={20}/></IOSButton>
    </div>
    {result && <div className="result-details" aria-live="polite">
      {result.errors.length > 0 && <div className="result-errors">{result.errors.map(error => <p key={error}><CircleAlert size={16}/>{error}</p>)}</div>}
      <div className="section-heading"><h2>番型明细</h2><span className="muted">{result.items.length + (score ? settlementItems : 0)} 项</span></div>
      <div className="fan-list">
        {result.items.map(item => <div className="fan-item" key={item.id} title={item.description}>
          <span>{item.name}{item.count > 1 && <small> ×{item.count}</small>}</span>
          <strong>{item.multiplier ? `×${item.multiplier}` : `+${item.fan * item.count}`}<small>{item.multiplier ? '倍' : '番'}</small></strong>
        </div>)}
        {score && dealer && <div className="fan-item dealer-fan-item"><strong>庄家胡</strong><strong>×{rule.scoring.dealerMultiplier}<small>倍</small></strong></div>}
        {score && dealerDiscard && <div className="fan-item dealer-fan-item"><strong>庄家点炮</strong><strong>×{rule.scoring.dealerMultiplier}<small>倍</small></strong></div>}
        {sum < rule.scoring.minimumAdditiveFan && <div className="fan-item"><span>基础番数保底</span><strong>{rule.scoring.minimumAdditiveFan}<small>番</small></strong></div>}
      </div>
      {score && <>
        {paymentValues.map(payment => {
          const index = score.payments.indexOf(payment);
          const factor = result.multiplier * paymentFactor * score.paymentMultipliers[index];
          const label = paymentValues.length === 1 ? '单家赔付' : score.playerIsDealer[index] ? '庄家单家赔付' : '非庄家单家赔付';
          return <div className="single-payment" key={payment}>
            <div className="score-total"><span>{label}</span><strong>{payment} 倍</strong></div>
            <div className="formula">=（{addition}）× {factor} = {payment} 倍</div>
          </div>;
        })}
        <button className="save-result" onClick={onSave}><BookmarkPlus size={17}/>保存到记录</button>
      </>}
    </div>}
    <button className="rule-link" onClick={onRules}>查阅 {rule.fanItems.length} 种番型<ArrowUpRight size={15}/></button>
  </aside>;
}
