import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { HandContext, Meld, Tile, FanResult } from '../types';
import { getRuleSet } from '../rule';
import { tileCounts } from '../engine/tiles';
import { calculateFan } from '../engine/fan-calculator';
import { calculateScore } from '../engine/score-calculator';
export const emptyContext = (): HandContext => ({ handTiles: [], melds: [], winTile: null, isSelfDraw: true, discarderIsDealer: false, flowers: [], roundWind: 0, seatWind: 0, event: 'normal', isLastCopy: false });
export function normalizeContext(context: HandContext): HandContext {
  return { ...context, discarderIsDealer: !context.isSelfDraw && context.seatWind !== context.roundWind && Boolean(context.discarderIsDealer) };
}
export const exampleContext = (): HandContext => ({ ...emptyContext(), handTiles: [0,1,2,3,4,5,6,7,8,10,11,12,22], winTile: 22 });
export interface HistoryEntry { id: string; at: string; context: HandContext; ruleId: string; fan: number; names: string[] }
interface CalculatorStore {
  context: HandContext; ruleId: string; history: HistoryEntry[]; theme: 'system' | 'light' | 'dark';
  update: (value: Partial<HandContext>) => void;
  addTile: (tile: Tile, target: 'hand' | 'win') => string | null;
  removeTile: (index: number) => void;
  saveMeld: (meld: Meld) => string | null;
  deleteMeld: (id: string) => void;
  reset: () => void; loadExample: () => void; setRule: (id: string) => void;
  saveResult: (result: FanResult) => void; restore: (entry: HistoryEntry) => void;
  setTheme: (theme: CalculatorStore['theme']) => void; clearHistory: () => void;
}
export const useCalculatorStore = create<CalculatorStore>()(persist((set, get) => ({
  context: emptyContext(), ruleId: 'dazhong-mahjong', history: [], theme: 'system',
  update: value => set(s => ({ context: normalizeContext({ ...s.context, ...value }) })),
  addTile: (tile, target) => {
    const c = get().context;
    const all = [...c.handTiles,...c.melds.flatMap(m=>m.tiles),...(target==='win'||c.winTile===null?[]:[c.winTile])];
    if (tileCounts(all)[tile] >= 4) return '同一种牌最多 4 张';
    if (target === 'hand' && c.handTiles.length >= 13 - c.melds.length*3) return '手牌已满';
    set({ context: { ...c, ...(target === 'win' ? { winTile: tile } : { handTiles: [...c.handTiles,tile] }) } }); return null;
  },
  removeTile: index => set(s => ({ context: { ...s.context, handTiles: s.context.handTiles.filter((_, i)=>i!==index) } })),
  saveMeld: meld => {
    const c=get().context, other=c.melds.filter(m=>m.id!==meld.id);
    if(other.length>=4) return '最多 4 组面子';
    if(c.handTiles.length > 13-(other.length+1)*3) return '请先移除对应的手牌，再添加面子';
    const counts=tileCounts([...c.handTiles,...(c.winTile===null?[]:[c.winTile]),...other.flatMap(m=>m.tiles),...meld.tiles]);
    if(counts.some(n=>n>4)) return '该面子会使同一种牌超过 4 张';
    set({context:{...c,melds:[...other,meld]}}); return null;
  },
  deleteMeld: id => set(s=>({context:{...s.context,melds:s.context.melds.filter(m=>m.id!==id)}})),
  reset: ()=>set({context:emptyContext()}), loadExample: ()=>set({context:exampleContext(),ruleId:'dazhong-mahjong'}),
  setRule: id => { if(getRuleSet(id).id!==id) return; set({ruleId:id,context:emptyContext()}); },
  saveResult: result => {
    if(!result.valid) return; const s=get();
    const entry:HistoryEntry={id:crypto.randomUUID(),at:new Date().toISOString(),context:structuredClone(s.context),ruleId:s.ruleId,fan:calculateScore(result,s.context,getRuleSet(s.ruleId))!.total,names:result.items.map(i=>i.name)};
    set({history:[entry,...s.history].slice(0,30)});
  },
  restore: entry=>set({context:normalizeContext(structuredClone(entry.context)),ruleId:'dazhong-mahjong'}),
  setTheme: theme=>set({theme}),clearHistory:()=>set({history:[]})
}),{name:'paijian-calculator-v1',version:4, migrate: saved => {
  const state = saved as CalculatorStore;
  return { ...state, context: normalizeContext(state.context ?? emptyContext()), ruleId: 'dazhong-mahjong', history: (state.history ?? []).map(entry => {
    const context = normalizeContext(entry.context);
    const rule = getRuleSet('dazhong-mahjong');
    const result = calculateFan(context, rule);
    return { ...entry, context, ruleId: 'dazhong-mahjong', fan: calculateScore(result, context, rule)?.total ?? 0, names: result.items.map(item => item.name) };
  }) };
}}));
