import { useEffect, useRef } from "react";

export function useAutosave(effect: () => void | Promise<void>, delay: number, deps: unknown[]) {
  const firstRun = useRef(true);
  const effectRef = useRef(effect);

  useEffect(() => {
    effectRef.current = effect;
  }, [effect]);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }

    const handle = setTimeout(() => {
      void effectRef.current();
    }, delay);

    return () => clearTimeout(handle);
  }, [delay, ...deps]);
}
