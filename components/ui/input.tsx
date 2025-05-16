import * as React from 'react';

import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'flex h-9 w-full min-w-0 rounded-md border px-3 py-1  md:text-sm',
        'focus-visible:border-ring! focus-visible:ring-ring/50! focus-visible:ring-[3px]!',
        'aria-invalid:ring-destructive/20! dark:aria-invalid:ring-destructive/40! aria-invalid:border-destructive!',
        className
      )}
      {...props}
    />
  );
}

export { Input };
