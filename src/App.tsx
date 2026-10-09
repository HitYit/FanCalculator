import { useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Download, RefreshCw, WifiOff } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { IOSNavBar, type View } from './components/ios/IOSNavBar';
import { IOSBottomSheet } from './components/ios/IOSBottomSheet';
import { IOSButton } from './components/ios/IOSButton';
import { CalculatorPage } from './pages/CalculatorPage';
import { HistoryPage } from './pages/HistoryPage';
import { RulesPage } from './pages/RulesPage';
import { useCalculatorStore } from './store/useCalculatorStore';
interface InstallPrompt extends Event { prompt:()=>Promise<void>; userChoice:Promise<{outcome:string}> }
export default function App(){
  const [view,setView]=useState<View>('calculator'),[settings,setSettings]=useState(false),[toast,setToast]=useState(''),[online,setOnline]=useState(navigator.onLine),[install,setInstall]=useState<InstallPrompt|null>(null);
  const theme=useCalculatorStore(s=>s.theme),setTheme=useCalculatorStore(s=>s.setTheme);
  const {needRefresh:[needRefresh],offlineReady:[offlineReady],updateServiceWorker}=useRegisterSW();
  const closeSettings=useCallback(()=>setSettings(false),[]);
  const notify=useCallback((s:string)=>setToast(s),[]);
  useEffect(()=>{if(!toast)return;const id=setTimeout(()=>setToast(''),3000);return()=>clearTimeout(id);},[toast]);
  useEffect(()=>{
    const media=matchMedia('(prefers-color-scheme: dark)');
    const apply=()=>document.documentElement.dataset.theme=theme==='system'?(media.matches?'dark':'light'):theme;
    apply();media.addEventListener('change',apply);return()=>media.removeEventListener('change',apply);
  },[theme]);
  useEffect(()=>{
    const network=()=>setOnline(navigator.onLine),prompt=(e:Event)=>{e.preventDefault();setInstall(e as InstallPrompt);};
    window.addEventListener('online',network);window.addEventListener('offline',network);window.addEventListener('beforeinstallprompt',prompt);
    return()=>{window.removeEventListener('online',network);window.removeEventListener('offline',network);window.removeEventListener('beforeinstallprompt',prompt);};
  },[]);
 return <><IOSNavBar view={view} setView={setView} settings={()=>setSettings(true)}/><main className="page-shell">{!online&&<div className="network-banner"><WifiOff size={16}/>离线模式</div>}{needRefresh&&<div className="network-banner">新版本已就绪<button className="text-action" onClick={()=>updateServiceWorker(true)}><RefreshCw size={15}/>更新</button></div>}<AnimatePresence mode="wait"><motion.div key={view} initial={{opacity:0,y:5}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:.18}}>{view==='calculator'?<CalculatorPage notify={notify} onRules={()=>setView('rules')}/>:view==='history'?<HistoryPage onRestore={()=>setView('calculator')}/>:<RulesPage/>}</motion.div></AnimatePresence><footer className="page-footer"><span>牌间 · 每一手，都算数</span><span>{offlineReady?'离线可用':'PWA'}<span className="footer-dot"/>本地存储</span></footer></main><IOSBottomSheet open={settings} title="设置" onClose={closeSettings}><div className="settings-row"><span>外观</span><div className="segmented">{([{id:'system',label:'自动'},{id:'light',label:'浅色'},{id:'dark',label:'深色'}] as const).map(t=><button key={t.id} className={theme===t.id?'active':''} onClick={()=>setTheme(t.id)}>{t.label}</button>)}</div></div><div className="settings-row"><span>规则版本</span><span className="muted">大众麻将 · 81 种番型</span></div><div className="settings-row"><span>离线缓存</span><span className="muted">{offlineReady?'已就绪':'首次联网加载后可用'}</span></div>{install?<IOSButton onClick={async()=>{await install.prompt();await install.userChoice;setInstall(null);}}><Download size={18}/>添加到主屏幕</IOSButton>:<p className="install-note">iPhone：Safari 分享菜单 → 添加到主屏幕。<br/>Windows / Android：浏览器菜单 → 安装应用。</p>}</IOSBottomSheet><AnimatePresence>{toast&&<motion.div className="toast" role="status" initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} exit={{opacity:0,y:15}}><Check size={17}/>{toast}</motion.div>}</AnimatePresence></>;
}
