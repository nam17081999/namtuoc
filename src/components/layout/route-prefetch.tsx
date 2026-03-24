"use client";

import { useEffect } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";

const ROUTES_TO_PREFETCH: Route[] = [
  "/dashboard",
  "/apps/notes",
  "/apps/notes/folder/all" as Route,
  "/apps/money-counter",
  "/apps/finance",
  "/apps/finance/thu",
  "/apps/finance/chi",
  "/apps/finance/chuyen-doi",
  "/apps/finance/thong-ke"
];

export function RoutePrefetch() {
  const router = useRouter();

  useEffect(() => {
    let timeoutId: number | undefined;
    const idleApi = window as Window & {
      requestIdleCallback?: (callback: IdleRequestCallback) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    const prefetch = () => {
      ROUTES_TO_PREFETCH.forEach((route) => {
        router.prefetch(route);
      });
    };

    if (idleApi.requestIdleCallback && idleApi.cancelIdleCallback) {
      const idleId = idleApi.requestIdleCallback(prefetch);
      return () => {
        idleApi.cancelIdleCallback?.(idleId);
      };
    }

    timeoutId = window.setTimeout(prefetch, 300);
    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [router]);

  return null;
}
