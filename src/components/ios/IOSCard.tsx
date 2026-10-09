import type { ReactNode } from 'react';
export function IOSCard({ children, className = '' }: { children: ReactNode; className?: string }) { return <div className={`ios-card ${className}`}>{children}</div>; }
