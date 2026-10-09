import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
export function IOSBottomSheet({ open, title, onClose, children, className = '' }: { open: boolean; title: string; onClose: ()=>void; children: ReactNode; className?: string }) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if(!open) return;
    const before = document.activeElement as HTMLElement;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow='hidden';
    const frame = requestAnimationFrame(()=>panel.current?.focus());
    function key(e:KeyboardEvent) {
      if(e.key==='Escape') onClose();
      if(e.key==='Tab') {
        const nodes=panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input, select, a[href], [tabindex="0"]');
        if(!nodes?.length) return;
        const first=nodes[0],last=nodes[nodes.length-1];
        if(e.shiftKey&&(document.activeElement===first||document.activeElement===panel.current)){e.preventDefault();last.focus();}
        if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
      }
    }
    document.addEventListener('keydown',key);
    return ()=>{cancelAnimationFrame(frame);document.body.style.overflow=oldOverflow;document.removeEventListener('keydown',key);before?.focus();};
  },[open,onClose]);
  return createPortal(<AnimatePresence>{open&&<motion.div className="sheet-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}><motion.div ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className={`bottom-sheet ${className}`} initial={{y:100,opacity:0}} animate={{y:0,opacity:1}} exit={{y:100,opacity:0}} transition={{type:'spring',stiffness:180,damping:20}} onClick={e=>e.stopPropagation()}><motion.div className="sheet-drag" drag="y" dragConstraints={{top:0,bottom:0}} onDragEnd={(_,info)=>{if(info.offset.y>60)onClose();}}><span/></motion.div><div className="sheet-heading"><h2>{title}</h2><button className="icon-button" aria-label="关闭" title="关闭" onClick={onClose}><X size={20}/></button></div>{children}</motion.div></motion.div>}</AnimatePresence>,document.body);
}
