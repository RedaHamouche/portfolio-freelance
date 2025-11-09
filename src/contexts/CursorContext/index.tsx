"use client";
import { useClickableElements } from '@/hooks/useClickableElements';

interface CursorProviderProps {
  children: React.ReactNode;
}

const CursorProvider = ({ children }: CursorProviderProps) => {
  // Initialiser la détection des éléments clickables
  useClickableElements();

  return <>{children}</>;
};

export default CursorProvider;

