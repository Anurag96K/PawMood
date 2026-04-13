import { createContext, useContext, useMemo, useState } from "react";

type SelectedDateContextValue = {
  selectedDate: Date | null;
  setSelectedDate: (date: Date | null) => void;
};

const SelectedDateContext = createContext<SelectedDateContextValue | null>(null);

export function SelectedDateProvider({ children }: { children: React.ReactNode }) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const value = useMemo(
    () => ({ selectedDate, setSelectedDate }),
    [selectedDate]
  );

  return (
    <SelectedDateContext.Provider value={value}>
      {children}
    </SelectedDateContext.Provider>
  );
}

export function useSelectedDate() {
  const ctx = useContext(SelectedDateContext);
  if (!ctx) {
    throw new Error("useSelectedDate must be used within SelectedDateProvider");
  }
  return ctx;
}
