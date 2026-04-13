import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";

interface ExtraCreditsContextType {
  extraCredits: number;
  addExtraCredits: (amount: number) => void;
  setExtraCredits: (amount: number) => void;
  isLoading: boolean;
}

const ExtraCreditsContext = createContext<ExtraCreditsContextType | undefined>(undefined);

const EXTRA_CREDITS_KEY = "petmood_extra_credits";

function getStorageKey(userId: string) {
  return `${EXTRA_CREDITS_KEY}_${userId}`;
}

export function ExtraCreditsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [extraCredits, setExtraCreditsState] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Load extra credits from localStorage on mount and user change
  useEffect(() => {
    if (!user) {
      setExtraCreditsState(0);
      setIsLoading(false);
      return;
    }

    const stored = localStorage.getItem(getStorageKey(user.id));
    if (stored) {
      const parsed = parseInt(stored, 10);
      setExtraCreditsState(isNaN(parsed) ? 0 : parsed);
    } else {
      setExtraCreditsState(0);
    }
    setIsLoading(false);
  }, [user]);

  // Add extra credits and persist
  const addExtraCredits = useCallback((amount: number) => {
    if (!user) return;
    
    setExtraCreditsState(prev => {
      const newTotal = prev + amount;
      localStorage.setItem(getStorageKey(user.id), newTotal.toString());
      return newTotal;
    });
  }, [user]);

  // Set extra credits to a specific amount
  const setExtraCredits = useCallback((amount: number) => {
    if (!user) return;
    
    const newAmount = Math.max(0, amount);
    localStorage.setItem(getStorageKey(user.id), newAmount.toString());
    setExtraCreditsState(newAmount);
  }, [user]);

  return (
    <ExtraCreditsContext.Provider value={{ extraCredits, addExtraCredits, setExtraCredits, isLoading }}>
      {children}
    </ExtraCreditsContext.Provider>
  );
}

export function useExtraCredits() {
  const context = useContext(ExtraCreditsContext);
  if (!context) {
    throw new Error("useExtraCredits must be used within ExtraCreditsProvider");
  }
  return context;
}
