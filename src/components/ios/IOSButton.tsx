import { motion } from 'framer-motion';
import type { ComponentProps } from 'react';
export function IOSButton({ children, className = '', ...props }: ComponentProps<typeof motion.button>) {
  return <motion.button whileTap={{ scale: .97 }} transition={{ type: 'spring', stiffness: 180, damping: 20 }} className={`ios-button ${className}`} {...props}>{children}</motion.button>;
}
