
import { useRef, useEffect, useState, useCallback, useLayoutEffect } from "react";
import { useScrollLock } from "@/hooks/useScrollLock";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { TranslationKey } from "@/lib/translations";

interface MonthYearPickerProps {
  currentDate: Date;
  signupDate: Date;
  onDateChange: (date: Date) => void;
  isOpen: boolean;
  onClose: () => void;
  getAnchorRect: () => DOMRect | null;
}

const MONTHS: TranslationKey[] = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december"
];

const ITEM_HEIGHT = 36;
const VISIBLE_ITEMS = 5;
const PICKER_WIDTH = 240;

export function MonthYearPicker({
  currentDate,
  signupDate,
  onDateChange,
  isOpen,
  onClose,
  getAnchorRect
}: MonthYearPickerProps) {
  const { t } = useLanguage();
  const monthRef = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [position, setPosition] = useState({
    top: 100,
    left: (typeof window !== 'undefined' ? window.innerWidth / 2 : 200) - PICKER_WIDTH / 2
  });
  const [isPositioned, setIsPositioned] = useState(false);

  const signupYear = signupDate.getFullYear();
  const signupMonth = signupDate.getMonth();
  const currentYear = new Date().getFullYear();

  const years = Array.from(
    { length: Math.max(1, 2026 - signupYear + 1) },
    (_, i) => signupYear + i
  );

  const getAvailableMonths = useCallback((year: number) => {
    if (year < signupYear) return [];
    if (year === signupYear) {
      return Array.from({ length: 12 - signupMonth }, (_, i) => signupMonth + i);
    }
    return Array.from({ length: 12 }, (_, i) => i);
  }, [signupYear, signupMonth]);

  const availableMonths = getAvailableMonths(selectedYear);

  useLayoutEffect(() => {
    if (isOpen) {
      const anchorRect = getAnchorRect();
      if (anchorRect) {
        const left = anchorRect.left + (anchorRect.width / 2) - (PICKER_WIDTH / 2);
        const top = anchorRect.bottom + 8;

        // Ensure it stays within viewport height
        const viewportHeight = window.innerHeight;
        const pickerHeight = 240; // Approx height
        const safeTop = Math.min(top, viewportHeight - pickerHeight - 20);

        // Ensure it stays within viewport width
        const viewportWidth = window.innerWidth;
        const safeLeft = Math.max(16, Math.min(left, viewportWidth - PICKER_WIDTH - 16));

        setPosition({ top: safeTop, left: safeLeft });
      }
      setIsPositioned(true);
    } else {
      setIsPositioned(false);
    }
  }, [isOpen, getAnchorRect]);

  useEffect(() => {
    if (isOpen) {
      setSelectedMonth(currentDate.getMonth());
      setSelectedYear(currentDate.getFullYear());
    }
  }, [currentDate, isOpen]);

  useEffect(() => {
    if (isOpen && monthRef.current) {
      const monthIndex = availableMonths.indexOf(selectedMonth);
      if (monthIndex >= 0) {
        setTimeout(() => {
          monthRef.current?.scrollTo({
            top: monthIndex * ITEM_HEIGHT,
            behavior: "instant"
          });
        }, 50);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, availableMonths]);

  useEffect(() => {
    if (isOpen && yearRef.current) {
      const yearIndex = years.indexOf(selectedYear);
      if (yearIndex >= 0) {
        setTimeout(() => {
          yearRef.current?.scrollTo({
            top: yearIndex * ITEM_HEIGHT,
            behavior: "instant"
          });
        }, 50);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, years]);

  // Lock body scroll when picker is open
  useScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      // Start closing if click is outside picker element
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Slight delay to avoid immediate trigger if the opening click bubbles up
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", (e) => handleClickOutside(e as unknown as MouseEvent));
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", (e) => handleClickOutside(e as unknown as MouseEvent));
    };
  }, [isOpen, onClose]);

  const monthScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const yearScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(0);

  const THROTTLE_MS = 80;

  const handleMonthScroll = () => {
    if (!monthRef.current) return;

    const now = Date.now();
    if (now - lastUpdateRef.current < THROTTLE_MS) return;

    const scrollTop = monthRef.current.scrollTop;
    const index = Math.round(scrollTop / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, availableMonths.length - 1));
    const newMonth = availableMonths[clampedIndex];

    if (newMonth !== undefined && newMonth !== selectedMonth) {
      lastUpdateRef.current = now;
      setSelectedMonth(newMonth);
      // Haptic feedback on change
      if ('vibrate' in navigator) navigator.vibrate(10);
    }
  };

  const handleYearScroll = () => {
    if (!yearRef.current) return;

    const now = Date.now();
    if (now - lastUpdateRef.current < THROTTLE_MS) return;

    const scrollTop = yearRef.current.scrollTop;
    const index = Math.round(scrollTop / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, years.length - 1));
    const newYear = years[clampedIndex];

    if (newYear !== undefined && newYear !== selectedYear) {
      lastUpdateRef.current = now;
      setSelectedYear(newYear);
      if ('vibrate' in navigator) navigator.vibrate(10);

      const newAvailableMonths = getAvailableMonths(newYear);
      if (!newAvailableMonths.includes(selectedMonth)) {
        setSelectedMonth(newAvailableMonths[0] ?? 0);
      }
    }
  };

  const handleConfirm = () => {
    onDateChange(new Date(selectedYear, selectedMonth, 1));
    onClose();
  };

  const handleMonthClick = (monthIndex: number) => {
    setSelectedMonth(monthIndex);
    if (monthRef.current) {
      const targetIndex = availableMonths.indexOf(monthIndex);
      monthRef.current.scrollTo({
        top: targetIndex * ITEM_HEIGHT,
        behavior: "smooth"
      });
    }
  };

  const handleYearClick = (year: number) => {
    setSelectedYear(year);
    if (yearRef.current) {
      const targetIndex = years.indexOf(year);
      yearRef.current.scrollTo({
        top: targetIndex * ITEM_HEIGHT,
        behavior: "smooth"
      });
    }
    const newAvailableMonths = getAvailableMonths(year);
    if (!newAvailableMonths.includes(selectedMonth)) {
      setSelectedMonth(newAvailableMonths[0] ?? 0);
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with fade */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[1px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          />

          {/* Picker with bounce animation */}
          <motion.div
            ref={pickerRef}
            className="fixed z-50 rounded-2xl border border-border/60 overflow-hidden"
            style={{
              backgroundColor: "#FBF6F1",
              top: position.top,
              left: position.left,
              width: "240px",
              boxShadow: "0 8px 32px -8px hsl(25 30% 20% / 0.25), 0 4px 16px -4px hsl(25 30% 30% / 0.15)",
              // Force visibility only after position is calculated to prevent jump
              visibility: isPositioned ? 'visible' : 'hidden',
            }}
            initial={{ scale: 0.86, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: 1,
            }}
            exit={{
              scale: 0.92,
              opacity: 0,
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
              mass: 0.8,
            }}
          >
            {/* iOS-style wheel picker */}
            <div className="relative flex h-[180px] overflow-hidden">
              {/* Selection indicator */}
              <div className="absolute left-3 right-3 top-1/2 -translate-y-1/2 h-9 bg-accent/50 rounded-xl pointer-events-none z-10" />

              {/* Gradient overlays */}
              <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-[#FBF6F1] to-transparent pointer-events-none z-20" />
              <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#FBF6F1] to-transparent pointer-events-none z-20" />

              {/* Month wheel */}
              <div
                ref={monthRef}
                onScroll={handleMonthScroll}
                className="flex-1 overflow-y-scroll snap-y snap-mandatory scrollbar-hide will-change-transform"
                style={{
                  paddingTop: `${(VISIBLE_ITEMS - 1) / 2 * ITEM_HEIGHT}px`,
                  paddingBottom: `${(VISIBLE_ITEMS - 1) / 2 * ITEM_HEIGHT}px`,
                  overscrollBehavior: "contain"
                }}
              >
                {availableMonths.map((monthIndex) => (
                  <button
                    key={monthIndex}
                    onClick={(e) => {
                      e.preventDefault();
                      handleMonthClick(monthIndex);
                    }}
                    className={cn(
                      "w-full h-9 flex items-center justify-center snap-center snap-stop-always transition-opacity duration-150",
                      selectedMonth === monthIndex
                        ? "text-foreground font-bold text-sm"
                        : "text-muted-foreground text-sm opacity-40"
                    )}
                  >
                    {t(MONTHS[monthIndex])}
                  </button>
                ))}
              </div>

              {/* Year wheel */}
              <div
                ref={yearRef}
                onScroll={handleYearScroll}
                className="flex-1 overflow-y-scroll snap-y snap-mandatory scrollbar-hide will-change-transform"
                style={{
                  paddingTop: `${(VISIBLE_ITEMS - 1) / 2 * ITEM_HEIGHT}px`,
                  paddingBottom: `${(VISIBLE_ITEMS - 1) / 2 * ITEM_HEIGHT}px`,
                  overscrollBehavior: "contain"
                }}
              >
                {years.map((year) => (
                  <button
                    key={year}
                    onClick={(e) => {
                      e.preventDefault();
                      handleYearClick(year);
                    }}
                    className={cn(
                      "w-full h-9 flex items-center justify-center snap-center snap-always transition-opacity duration-150",
                      selectedYear === year
                        ? "text-foreground font-bold text-sm"
                        : "text-muted-foreground text-sm opacity-40"
                    )}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex border-t border-border/40">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 text-sm text-muted-foreground hover:bg-accent/30 active:scale-[0.98] transition-transform"
              >
                Cancel
              </button>
              <div className="w-px bg-border/40" />
              <button
                onClick={handleConfirm}
                className="flex-1 py-2.5 text-sm font-medium text-primary hover:bg-accent/30 active:scale-[0.98] transition-transform"
              >
                Done
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
