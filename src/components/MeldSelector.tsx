import { useState, useCallback } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { IOSBottomSheet } from './ios/IOSBottomSheet';
import { IOSButton } from './ios/IOSButton';
import { TileSelector } from './TileSelector';
import { Tile } from './Tile';
import { makeMeld, meldLabel } from '../engine/tiles';
import { useCalculatorStore } from '../store/useCalculatorStore';
import type { MeldType, Meld, RuleSet } from '../types';
export function MeldSelector({ rule, notify, compact = false }: {rule:RuleSet;notify:(s:string)=>void;compact?: boolean}) {
  const {context,saveMeld,deleteMeld}=useCalculatorStore();
  const [open,setOpen]=useState(false),[editing,setEditing]=useState<Meld|null>(null),[type,setType]=useState<MeldType>('pung'),[tile,setTile]=useState<number|null>(null);
  const close=useCallback(()=>setOpen(false),[]);
  function edit(m?:Meld){setEditing(m??null);setType(m?.type??'pung');setTile(m?.tiles[0]??null);setOpen(true);}
  function save(){if(tile===null)return;const error=saveMeld(makeMeld(type,tile,editing?.id));if(error){notify(error);return;}close();}
  const allowedTypes: MeldType[] = compact ? ['pung','chow','exposed_kan'] : ['pung','chow','exposed_kan','concealed_kan','concealed_pung'];
  const visibleMelds = compact ? context.melds.filter(m => allowedTypes.includes(m.type)) : context.melds;
  return <><div className={compact ? 'compact-melds' : ''}>{!compact&&<div className="section-heading"><h2>副露与暗刻 <span className="counter">{context.melds.length} / 4 组</span></h2><button className="text-action" disabled={visibleMelds.length>=4} onClick={()=>edit()}><Plus size={16}/>添加面子</button></div>}<div className="melds">{visibleMelds.length===0?<button className={compact?'compact-add-meld':'empty-meld'} onClick={()=>edit()} disabled={context.melds.length>=4}><Plus size={compact?16:20}/><span>{compact?'添加吃、碰或明杠':'添加吃、碰、杠或暗刻'}</span></button>:visibleMelds.map(m=><div className="meld-item" key={m.id}><div className="meld-top"><span>{meldLabel[m.type]}</span><div><button className="icon-button tiny" aria-label={`编辑${meldLabel[m.type]}`} title="编辑" onClick={()=>edit(m)}><Pencil size={14}/></button><button className="icon-button tiny" aria-label={`删除${meldLabel[m.type]}`} title="删除" onClick={()=>deleteMeld(m.id)}><Trash2 size={14}/></button></div></div><div className="meld-tiles">{m.tiles.map((t,i)=><Tile key={i} tile={t} small/>)}</div></div>)}{visibleMelds.length>0&&compact&&visibleMelds.length<4&&<button className="compact-add-meld" onClick={()=>edit()}><Plus size={16}/>添加</button>}</div></div><IOSBottomSheet open={open} title={editing?'编辑面子':'添加面子'} onClose={close}><div className="meld-type-picker">{allowedTypes.map(t=><button key={t} className={type===t?'active':''} onClick={()=>{setType(t);setTile(null);}}>{meldLabel[t]}</button>)}</div><TileSelector rule={rule} context={{...context,melds:context.melds.filter(m=>m.id!==editing?.id)}} onSelect={setTile} flowers={false} chowOnly={type==='chow'}/><div className="meld-preview">{tile!==null&&makeMeld(type,tile,'preview').tiles.map((t,i)=><Tile key={i} tile={t}/>)}</div><IOSButton disabled={tile===null} onClick={save}><Plus size={18}/>{editing?'保存面子':'添加面子'}</IOSButton></IOSBottomSheet></>;
}
