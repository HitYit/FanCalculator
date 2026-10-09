import { Calculator, BookOpen, History, Settings2 } from 'lucide-react';
export type View = 'calculator' | 'history' | 'rules';
export function IOSNavBar({ view, setView, settings }: { view: View; setView: (v: View)=>void; settings: ()=>void }) {
  const tabs = [{ id: 'calculator' as const, label: '算番', Icon: Calculator }, { id: 'history' as const, label: '记录', Icon: History }, { id: 'rules' as const, label: '番型', Icon: BookOpen }];
  return <header className="nav-bar"><div className="nav-inner"><a className="brand" href="#" onClick={e=>{e.preventDefault();setView('calculator');}}><img src={`${import.meta.env.BASE_URL}icons/icon.svg`} alt=""/><span>牌间<span className="brand-sub">麻将算番</span></span></a><nav aria-label="主导航">{tabs.map(({id,label,Icon})=><button key={id} className={view===id?'active':''} onClick={()=>setView(id)}><Icon size={18}/><span>{label}</span></button>)}</nav><button className="icon-button" title="设置" aria-label="设置" onClick={settings}><Settings2 size={21}/></button></div></header>;
}
