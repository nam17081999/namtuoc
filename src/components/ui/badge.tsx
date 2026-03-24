import * as React from "react";
import { cn } from "@/core/utils/cn";

const Badge = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full border border-border/70 bg-surface/70 px-2.5 py-1 text-xs font-medium text-text",
        className
      )}
      {...props}
    />
  )
);
Badge.displayName = "Badge";

export { Badge };
