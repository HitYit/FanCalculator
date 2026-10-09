import { ArrowUpRight, History, Trash2 } from 'lucide-react';
import { useCalculatorStore } from '../store/useCalculatorStore';
import { getRuleSet } from '../rule';
import { Tile } from '../components/Tile';
export function HistoryPage({onRestore}:{onRestore:()=>void}) {
  const {history,restore,clearHistory}=useCalculatorStore();
  return <><div className="page-heading"><div className="eyebrow">RECENT HANDS<h1>算番记录<span className="heading-dot">.</span></h1></div>{history.length>0&&<button className="text-action danger" onClick={clearHistory}><Trash2 size={16}/>清空记录</button>}</div>{!history.length?<div className="empty-page"><History size={38} strokeWidth={1.4}/><h2>暂无算番记录</h2><p>0 条记录</p></div>:<div className="history-list">{history.map(e=><button className="history-entry" key={e.id} onClick={()=>{restore(e);onRestore();}}><div className="history-main"><span className="history-time">{new Date(e.at).toLocaleString('zh-CN',{month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'})} · {e.context.isSelfDraw?'自摸':'点炮'}</span><h2>{e.names.slice(0,3).join(' · ')}</h2><div className="history-tiles">{[...e.context.handTiles,...(e.context.winTile===null?[]:[e.context.winTile])].sort((a,b)=>a-b).map((t,i)=><Tile key={i} tile={t} small/>)}</div><span className="small-muted">{getRuleSet(e.ruleId).name}</span></div><div className="history-fan"><strong>{e.fan}<small>倍</small></strong><ArrowUpRight size={20}/></div></button>)}</div>}</>;
}
