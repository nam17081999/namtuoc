"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { IcloudTopbar } from "./icloud-topbar";

const APP_LABELS: Record<string, string> = {
  "/dashboard": "",
  "/apps/notes": "Ghi chú",
  "/apps/money-counter": "Đếm tiền",
  "/apps/finance": "Tài chính",
  "/apps/photos": "Ảnh"
};

const DARK_PATHS = ["/apps/notes", "/apps/money-counter", "/apps/finance"];

export function GlobalNavbar() {
  const pathname = usePathname() ?? "/";
  const activePath = Object.keys(APP_LABELS).find((path) => pathname.startsWith(path)) ?? "/dashboard";
  const appName = APP_LABELS[activePath];
  const variant = DARK_PATHS.includes(activePath) ? "dark" : "blue";

  return <IcloudTopbar appName={appName || undefined} variant={variant} />;
}
