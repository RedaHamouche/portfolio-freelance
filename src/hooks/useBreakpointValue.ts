import { useBreakpoint as useRawBreakpoint } from 'use-breakpoint';
import { BREAKPOINTS } from '@/config';

export function useBreakpoint(query: string, defaultValue: boolean = false): boolean {
  const { breakpoint } = useRawBreakpoint(BREAKPOINTS);
  
  switch (query) {
    case '>=desktop':
      return breakpoint === 'desktop';
    case '>=tablet':
      return breakpoint === 'tablet' || breakpoint === 'desktop';
    case '<desktop':
      return breakpoint === 'mobile' || breakpoint === 'tablet';
    case '<tablet':
      return breakpoint === 'mobile';
    case 'mobile':
      return breakpoint === 'mobile';
    case 'tablet':
      return breakpoint === 'tablet';
    case 'desktop':
      return breakpoint === 'desktop';
    default:
      return defaultValue;
  }
} 