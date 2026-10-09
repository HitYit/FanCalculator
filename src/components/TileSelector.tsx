import type { HandContext, RuleSet, Tile as TileType } from '../types';
import { Tile } from './Tile';
import { tileCounts, tileName } from '../engine/tiles';
export function TileSelector({ context, rule, onSelect, target, flowers = true, chowOnly = false }: { context: HandContext; rule: RuleSet; onSelect: (t:TileType)=>void; target?: 'hand'|'win'; flowers?: boolean; chowOnly?: boolean }) {
  const counts=tileCounts([...context.handTiles,...context.melds.flatMap(m=>m.tiles),...(context.winTile===null||target==='win'?[]:[context.winTile])]);
  const rows=[{label:'万',start:0,count:9},{label:'条',start:9,count:9},{label:'筒',start:18,count:9},...(rule.tileSet.honors.length?[{label:'字',start:27,count:7}]:[]),...(flowers&&rule.tileSet.flowers.length?[{label:'花',start:34,count:8}]:[])];
  return <div className="tile-wall">{rows.map(row=><div className="tile-row" key={row.label}><span className={`suit-label suit-${row.start}`}>{row.label}</span><div className="tile-row-inner">{Array.from({length:row.count},(_,i)=>row.start+i).map(t=><Tile key={t} tile={t} badge={t<34?counts[t]:undefined} selected={t>=34&&context.flowers.includes(t)} disabled={t<34&&(counts[t]>=4||(chowOnly&&(t>=27||t%9>6)))} label={`选择${tileName(t)}`} onClick={()=>onSelect(t)}/>)}</div></div>)}</div>;
}
