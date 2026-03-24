import type { ReactNode } from "react";
import type { Route } from "next";
import Link from "next/link";
import { cn } from "@/core/utils/cn";

interface AppTileProps {
  name: string;
  href: Route;
  imgSrc?: string;
  icon?: ReactNode; // Khuyến khích dùng imgSrc, giữ lại tạm thời nếu người dùng chưa có ảnh
  className?: string;
}

export function AppTile({ name, href, imgSrc, icon, className }: AppTileProps) {
  return (
    <Link href={href} className={cn("flex flex-col items-center gap-1.5 active:scale-95 transition-transform duration-200", className)}>
      <div className="flex h-16 w-16 items-center justify-center rounded-squircle relative overflow-hidden">
        <img src={imgSrc} alt={name} className="h-full w-full object-cover" />
      </div>
      <span className="text-xs font-medium text-white tracking-wide">{name}</span>
    </Link>
  );
}
