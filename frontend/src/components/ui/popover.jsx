import React from 'react';
import { cn } from '../../lib/utils';

const Popover = ({ children, ...props }) => {
  return <div {...props}>{children}</div>;
};

const PopoverTrigger = React.forwardRef(({ className, children, onClick, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn("outline-none", className)}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
});
PopoverTrigger.displayName = "PopoverTrigger";

const PopoverContent = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "z-50 w-72 rounded-md border bg-white p-4 shadow-md outline-none animate-in fade-in-0 zoom-in-95",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
PopoverContent.displayName = "PopoverContent";

export { Popover, PopoverContent, PopoverTrigger };

