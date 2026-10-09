import { useCallback, useMemo, useState } from 'react';
import { ArrowDownAZ, RotateCcw, FlaskConical, Minus, CircleCheck, Flower2, ChevronDown, BookOpen } from 'lucide-react';
import { Tile } from '../components/Tile';
import { IOSBottomSheet } from '../components/ios/IOSBottomSheet';
import { TileSelector } from '../components/TileSelector';
import { MeldSelector } from '../components/MeldSelector';
import { FanResult } from '../components/FanResult';
import { IOSSwitch } from '../components/ios/IOSSwitch';
import { MahjongGlossary } from '../components/MahjongGlossary';
import { useCalculatorStore } from '../store/useCalculatorStore';
import { getRuleSet, ruleSets } from '../rule';
import { calculateFan } from '../engine/fan-calculator';
import { tileName, honorNames } from '../engine/tiles';
import type { FanResult as Result, WinEvent } from '../types';
import './CalculatorPage.css';
export function CalculatorPage({notify,onRules}:{notify:(s:string)=>void;onRules:()=>void}) {
  const {context:c,ruleId,update,addTile,removeTile,deleteMeld,reset,loadExample,saveResult,setRule}=useCalculatorStore();
  const rule=getRuleSet(ruleId);
  const [target,setTarget]=useState<'hand'|'win'>('hand'),[tilePickerOpen,setTilePickerOpen]=useState(false),[result,setResult]=useState<Result|null>(null),[resultKey,setResultKey]=useState('');
  const [glossaryOpen,setGlossaryOpen]=useState(false);
  const closeGlossary=useCallback(()=>setGlossaryOpen(false),[]);
  const key=JSON.stringify({c,ruleId});
  const displayed=key===resultKey?result:null;
  const slots=13-c.melds.length*3;
  const sorted=useMemo(()=>c.handTiles.map((t,i)=>({t,i})),[c.handTiles]);
  function select(t:number){
    if(t>=34){update({flowers:c.flowers.includes(t)?c.flowers.filter(x=>x!==t):[...c.flowers,t]});return;}
    const error=addTile(t,target);if(error)notify(error);
  }
  const melds=c.melds.filter(m=>m.type!=='concealed_pung');
  const hiddenPungs=c.melds.filter(m=>m.type==='concealed_pung');
  function calculate(){const r=calculateFan(c,rule);setResult(r);setResultKey(key);}
  const events:{id:WinEvent;label:string;description:string;self:boolean}[]=[
    {id:'replacement',label:'杠上开花',description:'杠牌或补花后，摸到补牌自摸胡牌。',self:true},
    {id:'rob_kong',label:'抢杠胡',description:'别人补杠时，胡他用于补杠的那张牌。',self:false},
    {id:'last_discard',label:'海底捞月',description:'胡别人摸完牌墙最后一张后打出的牌。',self:false},
    {id:'last_draw',label:'妙手回春',description:'摸到牌墙的最后一张牌，自摸胡牌。',self:true},
    {id:'kong_discard',label:'杠上炮',description:'胡别人杠牌后打出的那张牌。',self:false},
    {id:'heavenly',label:'天胡',description:'庄家发完起手牌后，直接胡牌。',self:true},
    {id:'earthly',label:'地胡',description:'闲家首次摸牌自摸，此前无人吃、碰、杠。',self:true},
    {id:'human',label:'人胡',description:'闲家首次摸牌前吃胡，此前无人吃、碰、杠。',self:false}
  ];
  return <><div className="page-heading"><div><div className="eyebrow">MAHJONG CALCULATOR</div><h1>麻将算番<span className="heading-dot">.</span></h1></div><div className="calculator-heading-actions"><div className="rule-picker"><select aria-label="选择麻将规则" value={rule.id} onChange={e=>{if(e.target.value!==ruleId){setRule(e.target.value);setTarget('hand');setResult(null);}}}>{ruleSets.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select><ChevronDown size={16}/></div><button type="button" className="icon-button glossary-button" title="麻将术语说明" aria-label="打开麻将术语说明" aria-haspopup="dialog" onClick={()=>setGlossaryOpen(true)}><BookOpen size={21}/></button></div></div><MahjongGlossary open={glossaryOpen} onClose={closeGlossary} seatWind={c.seatWind} roundWind={c.roundWind}/><div className="calculator-layout"><div className="input-column"><section className="hand-section"><div className="section-heading"><h2><span className="step">01</span>我的手牌</h2><div className="hand-actions"><button className="icon-button" title="排序手牌" aria-label="排序手牌" onClick={()=>update({handTiles:[...c.handTiles].sort((a,b)=>a-b)})}><ArrowDownAZ size={19}/></button><button className="icon-button" title="清空本次手牌" aria-label="清空本次手牌" onClick={()=>{reset();setTarget('hand');}}><RotateCcw size={18}/></button></div></div><div className="hand-table"><div className="hand-table-top"><span>手牌<span>{c.handTiles.length} / {slots}</span></span><button className="example-button" onClick={()=>{loadExample();setTarget('win');}}><FlaskConical size={14}/>载入牌例</button></div><div className="hand-rows"><div className="hand-row"><span className="hand-row-label">明牌</span><div className="hand-row-tiles"><MeldSelector rule={rule} notify={notify} compact/></div></div><div className="hand-row hand-row-select" role="button" tabIndex={0} aria-label="选择暗手牌" onClick={()=>{setTarget('hand');setTilePickerOpen(true);}} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){setTarget('hand');setTilePickerOpen(true);}}}><span className="hand-row-label">暗手</span><span className="hand-row-tiles">{sorted.map(({t,i})=><Tile key={i} tile={t} label={`移除第${i+1}张${tileName(t)}`} onClick={()=>removeTile(i)}/>)}{hiddenPungs.flatMap(m=>m.tiles.map((t,i)=><Tile key={`${m.id}-${i}`} tile={t} small label={`暗刻${tileName(t)}`} onClick={()=>deleteMeld(m.id)}/>))}{Array.from({length:Math.max(0,slots-c.handTiles.length-hiddenPungs.length*3)},(_,i)=><span className="tile-placeholder" key={`empty${i}`}><Minus size={14}/></span>)}</span><span className="row-action-label">点此选牌</span></div><div className="hand-row hand-row-select win-hand-row" aria-label="选择胡牌张" onClick={()=>{setTarget('win');setTilePickerOpen(true);}}><span className="hand-row-label">胡牌</span><span className="hand-row-tiles">{c.winTile===null?<span className="tile-placeholder win-placeholder">?</span>:<Tile tile={c.winTile} label={`胡牌张${tileName(c.winTile)}`}/>}</span><span className="row-action-label">{c.winTile===null?'点此选择胡牌张':tileName(c.winTile)}</span></div><div className="hand-extras"><div className="table-summary"><span>{melds.length} 组副露</span><span><Flower2 size={14}/>{c.flowers.length} 张花牌</span></div><button className="example-button" onClick={()=>update({flowers:c.flowers.length?[]:[34,35,36,37]})}>{c.flowers.length?'清除花牌':'选择花牌'}</button></div></div></div></section><IOSBottomSheet open={tilePickerOpen} title={target==='hand'?'选择暗手牌':'选择胡牌张'} onClose={()=>setTilePickerOpen(false)}><TileSelector context={c} rule={rule} target={target} onSelect={select}/></IOSBottomSheet><section className="options-section"><div className="section-heading"><h2><span className="step">02</span>胡牌方式</h2><span className="small-muted">{c.isSelfDraw?'自摸':'点炮'}</span></div><div className="win-mode segmented"><button className={c.isSelfDraw?'active':''} onClick={()=>update({isSelfDraw:true,event:'normal'})}>自摸</button><button className={!c.isSelfDraw?'active':''} onClick={()=>update({isSelfDraw:false,event:'normal'})}>点炮</button></div>{!c.isSelfDraw&&<div className="discarder-option"><div className="option-copy"><span className="option-name">庄家点炮</span><p className="option-description">{c.seatWind===c.roundWind?'赢家是庄家，点炮方为非庄家。':'开启表示点炮方是庄家，单家赔付加倍。'}</p></div><IOSSwitch label="庄家点炮" checked={c.discarderIsDealer} disabled={c.seatWind===c.roundWind} onChange={on=>update({discarderIsDealer:on})}/></div>}<div className="option-rows">{events.map(e=><div className="option-row" key={e.id}><div className="option-copy"><span className="option-name">{e.label}</span><p className="option-description" id={`event-description-${e.id}`}>{e.description}</p></div><IOSSwitch label={e.label} describedBy={`event-description-${e.id}`} checked={c.event===e.id} onChange={on=>update({event:on?e.id:'normal',isSelfDraw:on?e.self:c.isSelfDraw})}/></div>)}</div><div className="wind-options">{(['roundWind','seatWind'] as const).map(k=><label key={k}><span>{k==='roundWind'?'场风':'门风'}</span><select value={c[k]} onChange={e=>update({[k]:Number(e.target.value)})}>{honorNames.slice(0,4).map((w,i)=><option value={i} key={w}>{w}风</option>)}</select></label>)}</div></section><div className="rule-note"><CircleCheck size={16}/><p>{rule.description}</p></div></div><FanResult result={displayed} context={c} rule={rule} onCalculate={calculate} onSave={()=>{if(displayed?.valid){saveResult(displayed);notify('已保存到记录');}}} onRules={onRules}/></div></>;
}
