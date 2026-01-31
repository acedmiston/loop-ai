'use client';

import { motion } from 'framer-motion';

type PageShellProps = {
  children: React.ReactNode;
  /** Disable the entrance animation. Default: false */
  noAnimation?: boolean;
  /** Extra class names for the container */
  className?: string;
};

export default function PageShell({ children, noAnimation, className = '' }: PageShellProps) {
  const containerClass = `w-full max-w-4xl mx-auto p-0 md:p-6 space-y-6 ${className}`.trim();

  if (noAnimation) {
    return <div className={containerClass}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={containerClass}
    >
      {children}
    </motion.div>
  );
}
