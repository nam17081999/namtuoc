import type { Route } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/core/utils/cn";

interface AppCardProps {
  name: string;
  href: Route;
  icon: React.ReactNode;
  className?: string;
}

export function AppCard({ name, href, icon, className }: AppCardProps) {
  return (
    <Link href={href} className={cn("group active:scale-[0.98] transition-all duration-200 block", className)}>
      <Card className="flex h-full flex-col items-center justify-center gap-3 px-4 py-6 text-center transition-colors bg-[#1c1c1e] border-white/5 hover:bg-[#2c2c2e] rounded-squircle shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-b from-accent to-accentSoft text-white shadow-ios-icon border border-white/10 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent mix-blend-overlay pointer-events-none"></div>
          <div className="z-10 text-white drop-shadow-sm">
            {icon}
          </div>
        </div>
        <span className="text-sm font-medium text-text">{name}</span>
      </Card>
    </Link>
  );
}
