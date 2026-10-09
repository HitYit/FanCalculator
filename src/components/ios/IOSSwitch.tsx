import { motion } from 'framer-motion';
export function IOSSwitch({ checked, onChange, label, describedBy, disabled = false }: { checked: boolean; onChange: (v: boolean) => void; label: string; describedBy?: string; disabled?: boolean }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} aria-describedby={describedBy} disabled={disabled} className={`ios-switch ${checked ? 'on' : ''}`} onClick={()=>onChange(!checked)}><motion.span animate={{ x: checked ? 20 : 0 }} transition={{ type: 'spring', stiffness: 180, damping: 20 }}/></button>;
}
