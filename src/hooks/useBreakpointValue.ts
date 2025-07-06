import { useBreakpoint as useRawBreakpoint } from 'use-breakpoint';
import { BREAKPOINTS } from '@/config/breakpoints';

export function useBreakpoint(query: string, defaultValue: boolean = false): boolean {
  const { breakpoint } = useRawBreakpoint(BREAKPOINTS);
  if (query === '>=desktop') return breakpoint === 'desktop';
  if (query === '<tablet') return breakpoint === 'mobile';
  // Ajoute d'autres cas si besoin
  return defaultValue;
} 