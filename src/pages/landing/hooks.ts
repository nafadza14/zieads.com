import { useEffect, useState } from 'react';

export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  return prefersReducedMotion;
}

export function useRotatingIndex(length: number, intervalMs: number): number {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [length, intervalMs]);

  return index;
}

export function useRotatingPhrase(
  count: number,
  cycleMs: number,
  exitMs: number,
  enabled: boolean,
): { index: number; phase: 'enter' | 'exit' } {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'enter' | 'exit'>('enter');

  useEffect(() => {
    if (!enabled || count <= 1) return;

    const interval = setInterval(() => {
      setPhase('exit');
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % count);
        setPhase('enter');
      }, exitMs);
    }, cycleMs);

    return () => clearInterval(interval);
  }, [enabled, count, cycleMs, exitMs]);

  return { index, phase };
}
