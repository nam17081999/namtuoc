import * as React from "react";
import { cn } from "@/core/utils/cn";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[96px] w-full rounded-xl border border-border/70 bg-surface/80 px-3 py-2 text-sm text-text shadow-inset placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
