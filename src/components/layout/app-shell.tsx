import { ReactNode } from "react";
import { cn } from "@/core/utils/cn";

interface AppShellProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function AppShell({ title, subtitle, actions, children, className }: AppShellProps) {
  return (
    <div className={cn("min-h-screen px-4 py-6 sm:px-6 lg:px-10", className)}>
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {title && <div>
          <h1 className="font-display text-3xl font-semibold text-text">{title}</h1>
        </div>}
      </header>
      {children}
    </div>
  );
}
