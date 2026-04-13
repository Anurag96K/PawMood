import { useState, useRef, useCallback, useMemo, useEffect, PointerEvent as ReactPointerEvent } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { CalendarDayCell } from "./CalendarDayCell";
import { CalendarEntryData } from "./FullScreenMoodViewer";
import { useLanguage } from "@/contexts/LanguageContext";
import { TranslationKey } from "@/lib/translations";
import { MonthYearPicker } from "./MonthYearPicker";
import { useCalendarDecoration, calendarBackgroundConfigs, calendarCardBackgroundConfigs } from "@/contexts/CalendarDecorationContext";
import { StreakBadge } from "./StreakBadge";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface MonthCarouselProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  entries: CalendarEntryData[];
  filteredEntries: CalendarEntryData[];
  searchQuery: string;
  signupDate: Date | null;
  selectedDay: number | null;
  onDayClick: (day: number) => void;
  onDayLongPress: (day: number) => void;
  getUnreadCountForDate: (date: Date) => number;
  showMonthPicker?: boolean;
  onToggleMonthPicker?: () => void;
  onCloseMonthPicker?: () => void;
  signupDateForPicker?: Date;
  onBackgroundPress?: () => void;
  streakCount?: number;
  totalRecords?: number;
  shouldShowStreak?: boolean;
  showHint?: boolean;
  petName?: string;
  // Skip slide animation for instant month change (used during Analysis Card close)
  instantChange?: boolean;
  // Birthday dates to highlight with special styling (month-day pairs like "01-27")
  birthdayDates?: string[];
}
const DAYS: TranslationKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const MONTHS: TranslationKey[] = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

export function MonthCarousel({
  currentDate,
  onDateChange,
  entries,
  filteredEntries,
  searchQuery,
  signupDate,
  selectedDay,
  onDayClick,
  onDayLongPress,
  getUnreadCountForDate,
  showMonthPicker = false,
  onToggleMonthPicker,
  onCloseMonthPicker,
  signupDateForPicker,
  onBackgroundPress,
  streakCount = 0,
  totalRecords = 0,
  shouldShowStreak = false,
  showHint = false,
  petName,
  instantChange = false,
  birthdayDates = [],
}: MonthCarouselProps) {
  const {
    t
  } = useLanguage();
  const {
    settings
  } = useCalendarDecoration();
  const containerRef = useRef<HTMLDivElement>(null);
  const navButtonRef = useRef<HTMLButtonElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState<number>(0);
  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);
  const prefersReducedMotion = useReducedMotion();


  // Callback to get anchor rect synchronously - prevents first-mount position bug
  const getAnchorRect = useCallback((): DOMRect | null => {
    if (navButtonRef.current) {
      return navButtonRef.current.getBoundingClientRect();
    }
    return null;
  }, []);

  // Deselect when tapping empty space inside the calendar (but not on buttons or day-cells)
  const handleBackgroundPointerDownCapture = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("button")) return;
      if (target.closest('[data-calendar-day-button="true"]')) return;
      onBackgroundPress?.();
    },
    [onBackgroundPress]
  );
  const bgStyle = calendarBackgroundConfigs[settings.calendarBackground]?.css || {};

  // Get the calendar card background color (defaults to a warm white if not set)
  const cardBackgroundColor = settings.calendarCardBackground && calendarCardBackgroundConfigs[settings.calendarCardBackground]
    ? `hsl(${calendarCardBackgroundConfigs[settings.calendarCardBackground].hsl})`
    : "hsl(30 30% 99%)"; // Default warm white fallback

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Check if we can navigate to previous month (must be after signup month)
  const canGoPrev = useMemo(() => {
    if (!signupDateForPicker) return true;
    const signupYear = signupDateForPicker.getFullYear();
    const signupMonth = signupDateForPicker.getMonth();
    return year > signupYear || year === signupYear && month > signupMonth;
  }, [year, month, signupDateForPicker]);

  // Check if we can navigate to next month (allow until Dec 2026)
  const canGoNext = useMemo(() => {
    // maxDate is Jan 1, 2027 so that we can reach and STAY on December 2026
    const maxDate = new Date(2027, 0, 1);
    const currentViewDate = new Date(year, month, 1);
    // When on Dec 2026,currentViewDate is Dec 1. Dec 1 < Jan 1 is true.
    // Wait, if I'm on Dec 2026 I should NOT be able to click Next.
    // So if currentViewDate is Nov 2026 (Nov 1), it should be true.
    // If currentViewDate is Dec 2026 (Dec 1), it should be false.
    const limitDate = new Date(2026, 11, 1); // Dec 1, 2026
    return currentViewDate < limitDate;
  }, [year, month]);

  // Generate month data - natural height based on actual days
  const getMonthData = useCallback((yearVal: number, monthVal: number) => {
    const firstDay = new Date(yearVal, monthVal, 1).getDay();
    const daysInMonth = new Date(yearVal, monthVal + 1, 0).getDate();
    const days: (number | null)[] = [];

    // Leading empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) days.push(null);

    // Actual days of the month
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return {
      year: yearVal,
      month: monthVal,
      days
    };
  }, []);
  const currentMonthData = useMemo(() => getMonthData(year, month), [year, month, getMonthData]);

  // Check if a day is before signup date
  const isDayDisabled = (day: number): boolean => {
    if (!signupDate) return false;
    const dayDate = new Date(year, month, day);
    dayDate.setHours(0, 0, 0, 0);
    const signupOnly = new Date(signupDate.getFullYear(), signupDate.getMonth(), signupDate.getDate());
    signupOnly.setHours(0, 0, 0, 0);
    return dayDate < signupOnly;
  };

  // Check if a day is today
  const isToday = (day: number): boolean => {
    const today = new Date();
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
  };

  // Get entries for a specific day
  const getEntriesForDay = (day: number): CalendarEntryData[] => {
    const entriesToSearch = searchQuery.trim() ? filteredEntries : entries;
    return entriesToSearch.filter(entry => entry.date.getFullYear() === year && entry.date.getMonth() === month && entry.date.getDate() === day);
  };

  // Get highlighted days for search
  const highlightedDays = useMemo(() => {
    if (!searchQuery.trim()) return new Set<number>();
    return new Set(filteredEntries.filter(entry => entry.date.getFullYear() === year && entry.date.getMonth() === month).map(entry => entry.date.getDate()));
  }, [filteredEntries, searchQuery, year, month]);

  // Generate date key
  const getDateKey = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  // Check if a day is a birthday date
  const isBirthdayDate = (day: number): boolean => {
    // Check if the current day is explicitly in the birthday list
    // Format: MM-DD (e.g. "01-27")
    const monthDay = `${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (birthdayDates.includes(monthDay)) return true;
    return false;
  };

  // Navigate to adjacent month with animation
  const goToMonth = useCallback((direction: "prev" | "next") => {
    if (isAnimating) return;
    if (direction === "prev" && !canGoPrev) return;
    if (direction === "next" && !canGoNext) return;

    // Set animation direction
    setSlideDirection(direction === "next" ? 1 : -1);
    setIsAnimating(true);

    // Update date (animation handled by AnimatePresence)
    const newDate = new Date(year, month + (direction === "next" ? 1 : -1), 1);
    onDateChange(newDate);

    // Clear animating state after animation completes
    setTimeout(() => setIsAnimating(false), 280);
  }, [isAnimating, canGoPrev, year, month, onDateChange]);

  // Touch handlers for swipe - respects signup restrictions
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isAnimating || showMonthPicker) return;
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
  }, [isAnimating, showMonthPicker]);
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isAnimating || showMonthPicker) return;
    touchCurrentX.current = e.touches[0].clientX;
  }, [isAnimating, showMonthPicker]);
  const handleTouchEnd = useCallback(() => {
    if (isAnimating || showMonthPicker) return;
    const diff = touchStartX.current - touchCurrentX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        // Swipe left = next month
        goToMonth("next");
      } else if (canGoPrev) {
        // Swipe right = previous month (only if allowed)
        goToMonth("prev");
      }
    }
  }, [isAnimating, showMonthPicker, canGoPrev, goToMonth]);

  return <div className="relative">
    {/* Unified Calendar Card - single card surface (shadow is applied on the outer wrapper) */}
    <div className="rounded-[28px] overflow-hidden relative" style={{
      backgroundColor: cardBackgroundColor
    }}>
      {/* Scale/opacity animation is applied ONLY to inner content to avoid shadow edge artifacts */}
      <div
        ref={containerRef}
        onPointerDownCapture={handleBackgroundPointerDownCapture}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={cn(
          "relative overflow-hidden transition-opacity duration-150 transform-gpu will-change-[opacity]",
          isAnimating && "opacity-90"
        )}
        style={{
          backgroundColor: cardBackgroundColor,
        }}
      >
        {/* Background pattern overlay */}
        {settings.calendarBackground !== "none" && <div className="absolute inset-0 pointer-events-none z-0" style={bgStyle} />}

        {/* Calendar Header - Month Navigation */}
        <div className="relative z-10 px-4 pt-4 pb-2 flex justify-center">
          <div
            className="flex items-center justify-between rounded-2xl px-2 py-2.5 bg-secondary"
            style={{
              width: '88%',
              boxShadow: "inset 0 1px 2px hsl(0 0% 100% / 0.5), inset 0 -1px 2px hsl(25 30% 40% / 0.03)"
            }}
          >
            {/* Left arrow - aligned to far left */}
            <button
              onClick={() => canGoPrev && goToMonth("prev")}
              disabled={!canGoPrev}
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                canGoPrev
                  ? "hover:bg-accent/50 active:scale-95 text-muted-foreground"
                  : "opacity-30 cursor-not-allowed text-muted-foreground/50"
              )}
              aria-label="Previous month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Month/Year - centered, clickable for picker */}
            <button
              ref={navButtonRef}
              onClick={onToggleMonthPicker}
              className="flex items-center justify-center gap-1.5 px-4 py-1 hover:bg-accent/20 rounded-xl transition-colors"
              aria-label="Select month and year"
            >
              <span className="text-base font-semibold text-foreground whitespace-nowrap">
                {t(MONTHS[month])} {year}
              </span>
              <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-200", showMonthPicker && "rotate-180")} />
            </button>

            {/* Right arrow - aligned to far right */}
            <button
              onClick={() => canGoNext && goToMonth("next")}
              disabled={!canGoNext}
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                canGoNext
                  ? "hover:bg-accent/50 active:scale-95 text-muted-foreground"
                  : "opacity-30 cursor-not-allowed text-muted-foreground/50"
              )}
              aria-label="Next month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Section - Start or Streak (below month selector) */}
        <StreakBadge count={streakCount} totalRecords={totalRecords} shouldShowStreak={shouldShowStreak} petName={petName} />

        {/* Day headers */}
        <div className="px-4 pt-3 pb-2 relative z-10">
          <div className="grid grid-cols-7">
            {DAYS.map(dayKey => (
              <div
                key={dayKey}
                className="text-center text-[11px] font-semibold text-muted-foreground py-1.5"
              >
                {t(dayKey)}
              </div>
            ))}
          </div>
        </div>

        {/* Calendar grid with unified grid overlay - only on date cells */}
        <div className="px-4 pb-4 relative z-10 overflow-hidden">
          <AnimatePresence mode="wait" initial={false} custom={slideDirection}>
            <motion.div
              key={`${year}-${month}`}
              custom={slideDirection}
              variants={{
                // Skip animation if instantChange is true
                enter: (dir: number) => (instantChange || prefersReducedMotion) ? { opacity: 1, x: 0 } : { opacity: 0, x: dir * 40 },
                center: { opacity: 1, x: 0 },
                exit: (dir: number) => (instantChange || prefersReducedMotion) ? { opacity: 1, x: 0 } : { opacity: 0, x: dir * -40 },
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                duration: instantChange ? 0 : (prefersReducedMotion ? 0.15 : 0.26),
                ease: [0.22, 0.9, 0.36, 1]
              }}
            >
              {(() => {
                // Calculate grid structure
                const firstDayIndex = currentMonthData.days.findIndex(d => d !== null);
                const lastDayIndex = currentMonthData.days.length - 1;
                const totalCells = currentMonthData.days.length;
                const rowCount = Math.ceil(totalCells / 7);
                const cellWidth = 100 / 7; // percentage width per cell
                const cellHeight = 100 / rowCount; // percentage height per row

                // Find first row with dates and last row with dates
                const firstRowWithDate = Math.floor(firstDayIndex / 7);
                const lastRowWithDate = Math.floor(lastDayIndex / 7);

                // For each column, find if it has any date cells
                const getColumnHasDateInRow = (col: number, row: number) => {
                  const index = row * 7 + col;
                  return index < totalCells && currentMonthData.days[index] !== null;
                };

                // First date column (e.g., Thursday = 4 for Jan 2025)
                const firstDateColumn = firstDayIndex % 7;

                // Last date column in the last row
                const lastDateColumn = lastDayIndex % 7;

                return (
                  <div className="relative overflow-hidden">
                    {/* Outer container border with rounded corners - frames only the date area */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{ zIndex: 2 }}
                      aria-hidden="true"
                    >
                      {/* All four corners use identical styling */}

                      {/* Top-left corner arc (at first date column) */}
                      <div
                        className="absolute"
                        style={{
                          top: 0,
                          left: `${firstDateColumn * cellWidth}%`,
                          width: '8px',
                          height: '8px',
                          borderTop: '1px solid rgba(0, 0, 0, 0.07)',
                          borderLeft: '1px solid rgba(0, 0, 0, 0.07)',
                          borderTopLeftRadius: '8px',
                        }}
                      />

                      {/* Top-right corner arc - only if month reaches col 6 in first row */}
                      <div
                        className="absolute"
                        style={{
                          top: 0,
                          right: 0,
                          width: '8px',
                          height: '8px',
                          borderTop: '1px solid rgba(0, 0, 0, 0.07)',
                          borderRight: '1px solid rgba(0, 0, 0, 0.07)',
                          borderTopRightRadius: '8px',
                        }}
                      />

                      {/* Bottom-left corner arc */}
                      <div
                        className="absolute"
                        style={{
                          bottom: 0,
                          left: 0,
                          width: '8px',
                          height: '8px',
                          borderBottom: '1px solid rgba(0, 0, 0, 0.07)',
                          borderLeft: '1px solid rgba(0, 0, 0, 0.07)',
                          borderBottomLeftRadius: '8px',
                        }}
                      />

                      {/* Bottom-right corner arc - only if month reaches col 6 in last row */}
                      {lastDateColumn === 6 && (
                        <div
                          className="absolute"
                          style={{
                            bottom: 0,
                            right: 0,
                            width: '8px',
                            height: '8px',
                            borderBottom: '1px solid rgba(0, 0, 0, 0.07)',
                            borderRight: '1px solid rgba(0, 0, 0, 0.07)',
                            borderBottomRightRadius: '8px',
                          }}
                        />
                      )}

                      {/* Top border - between corners */}
                      <div
                        className="absolute"
                        style={{
                          top: 0,
                          left: `calc(${firstDateColumn * cellWidth}% + 8px)`,
                          right: '8px',
                          height: '1px',
                          background: 'rgba(0, 0, 0, 0.07)',
                        }}
                      />

                      {/* Right border - first part (from top corner to row before last if it steps in) */}
                      <div
                        className="absolute"
                        style={{
                          top: '8px',
                          right: 0,
                          height: lastDateColumn < 6 ? `calc(${(rowCount - 1) * cellHeight}% - 8px)` : `calc(100% - 16px)`,
                          width: '1px',
                          background: 'rgba(0, 0, 0, 0.07)',
                        }}
                      />

                      {/* Bottom border - from left corner to last date column corner */}
                      <div
                        className="absolute"
                        style={{
                          bottom: 0,
                          left: '8px',
                          width: lastDateColumn === 6 ? 'calc(100% - 16px)' : `calc(${(lastDateColumn + 1) * cellWidth}% - 16px)`,
                          height: '1px',
                          background: 'rgba(0, 0, 0, 0.07)',
                        }}
                      />

                      {/* Left border - first row segment (from below top corner to row 1) */}
                      <div
                        className="absolute"
                        style={{
                          top: '8px',
                          left: `${firstDateColumn * cellWidth}%`,
                          height: `calc(${cellHeight}% - 8px)`,
                          width: '1px',
                          background: 'rgba(0, 0, 0, 0.07)',
                        }}
                      />

                      {/* Left border - remaining rows (from row 1 to bottom corner) */}
                      {rowCount > 1 && (
                        <div
                          className="absolute"
                          style={{
                            top: `${cellHeight}%`,
                            left: 0,
                            bottom: '8px',
                            width: '1px',
                            background: 'rgba(0, 0, 0, 0.07)',
                          }}
                        />
                      )}

                      {/* Top-Right Step Connector (only if row 1 doesn't start at col 0) */}
                      {firstDateColumn > 0 && rowCount > 1 && (
                        <>
                          <div
                            className="absolute"
                            style={{
                              top: `${cellHeight}%`,
                              left: 0,
                              width: '8px',
                              height: '8px',
                              borderTop: '1px solid rgba(0, 0, 0, 0.07)',
                              borderLeft: '1px solid rgba(0, 0, 0, 0.07)',
                              borderTopLeftRadius: '8px',
                            }}
                          />
                          <div
                            className="absolute"
                            style={{
                              top: `${cellHeight}%`,
                              left: '8px',
                              width: `calc(${firstDateColumn * cellWidth}% - 8px)`,
                              height: '1px',
                              background: 'rgba(0, 0, 0, 0.07)',
                            }}
                          />
                        </>
                      )}

                      {/* Bottom-Right Step Connector (if last day isn't col 6) */}
                      {lastDateColumn < 6 && rowCount > 1 && (
                        <>
                          {/* Inner corner curve (top-right of the step-in) */}
                          <div
                            className="absolute"
                            style={{
                              top: `calc(${(rowCount - 1) * cellHeight}% - 8px)`,
                              right: 0,
                              width: '8px',
                              height: '8px',
                              borderBottom: '1px solid rgba(0, 0, 0, 0.07)',
                              borderRight: '1px solid rgba(0, 0, 0, 0.07)',
                              borderBottomRightRadius: '8px',
                            }}
                          />
                          {/* Horizontal line for the step-in boundary (from arc to arc) */}
                          <div
                            className="absolute"
                            style={{
                              top: `${(rowCount - 1) * cellHeight}%`,
                              left: `${(lastDateColumn + 1) * cellWidth}%`,
                              right: '8px',
                              height: '1px',
                              background: 'rgba(0, 0, 0, 0.07)',
                            }}
                          />
                          {/* Outer corner curve (bottom-right of the date area) */}
                          <div
                            className="absolute"
                            style={{
                              bottom: 0,
                              left: `calc(${(lastDateColumn + 1) * cellWidth}% - 8px)`,
                              width: '8px',
                              height: '8px',
                              borderBottom: '1px solid rgba(0, 0, 0, 0.07)',
                              borderRight: '1px solid rgba(0, 0, 0, 0.07)',
                              borderBottomRightRadius: '8px',
                            }}
                          />
                          {/* Vertical line for the step-in (attached to arc) */}
                          <div
                            className="absolute"
                            style={{
                              top: `${(rowCount - 1) * cellHeight}%`,
                              left: `${(lastDateColumn + 1) * cellWidth}%`,
                              bottom: '8px',
                              width: '1px',
                              background: 'rgba(0, 0, 0, 0.07)',
                            }}
                          />
                        </>
                      )}
                    </div>

                    {/* Internal grid lines overlay - sits behind content, clipped to bounds */}
                    <div
                      className="absolute inset-0 pointer-events-none overflow-hidden rounded-[8px]"
                      style={{ zIndex: 0 }}
                      aria-hidden="true"
                    >
                      {/* Internal vertical lines - only between adjacent date cells */}
                      {[1, 2, 3, 4, 5, 6].map((colIndex) => {
                        const segments: { top: number; bottom: number }[] = [];
                        let segmentStart: number | null = null;

                        for (let row = 0; row < rowCount; row++) {
                          const leftHasDate = getColumnHasDateInRow(colIndex - 1, row);
                          const rightHasDate = getColumnHasDateInRow(colIndex, row);
                          const isStartStep = row === 0 && colIndex === firstDateColumn;
                          const isEndStep = row === rowCount - 1 && colIndex === (lastDateColumn + 1);

                          // Draw line if either side has a date (to frame entries),
                          // EXCEPT if it's the "Start Step" or "End Step" edge which is handled by the Outer Border.
                          const shouldDrawLine = (leftHasDate || rightHasDate) && !isStartStep && !isEndStep;

                          if (shouldDrawLine && segmentStart === null) {
                            segmentStart = row;
                          } else if (!shouldDrawLine && segmentStart !== null) {
                            segments.push({ top: segmentStart, bottom: row });
                            segmentStart = null;
                          }
                        }
                        if (segmentStart !== null) {
                          segments.push({ top: segmentStart, bottom: rowCount });
                        }

                        return segments.map((seg, segIdx) => {
                          const topPos = `${seg.top * cellHeight}%`;
                          const bottomPos = `${(rowCount - seg.bottom) * cellHeight}%`;

                          return (
                            <div
                              key={`v-${colIndex}-${segIdx}`}
                              className="absolute"
                              style={{
                                left: `${colIndex * cellWidth}%`,
                                top: topPos,
                                bottom: bottomPos,
                                width: '1px',
                                background: 'rgba(0, 0, 0, 0.07)',
                              }}
                            />
                          );
                        });
                      })}

                      {/* Internal horizontal lines - only between rows where BOTH have dates */}
                      {Array.from({ length: rowCount - 1 }, (_, rowIdx) => rowIdx + 1).map((rowIndex) => {
                        let segmentStart: number | null = null;
                        const segments: { left: number; right: number }[] = [];

                        for (let col = 0; col < 7; col++) {
                          const aboveHasDate = getColumnHasDateInRow(col, rowIndex - 1);
                          const belowHasDate = getColumnHasDateInRow(col, rowIndex);
                          const isStartStepConnector = rowIndex === 1 && col < firstDateColumn;
                          const isEndStepConnector = rowIndex === rowCount - 1 && col > lastDateColumn;

                          // Draw line if either side has a date, except for Start/End Step connectors
                          const shouldDrawLine = (aboveHasDate || belowHasDate) && !isStartStepConnector && !isEndStepConnector;

                          if (shouldDrawLine && segmentStart === null) {
                            segmentStart = col;
                          } else if (!shouldDrawLine && segmentStart !== null) {
                            segments.push({ left: segmentStart, right: col });
                            segmentStart = null;
                          }
                        }
                        if (segmentStart !== null) {
                          segments.push({ left: segmentStart, right: 7 });
                        }

                        return segments.map((seg, segIdx) => (
                          <div
                            key={`h-${rowIndex}-${segIdx}`}
                            className="absolute"
                            style={{
                              top: `${rowIndex * cellHeight}%`,
                              left: `${seg.left * cellWidth}%`,
                              right: `${(7 - seg.right) * cellWidth}%`,
                              height: '1px',
                              background: 'rgba(0, 0, 0, 0.07)',
                            }}
                          />
                        ));
                      })}
                    </div>

                    {/* Calendar cells - above grid lines */}
                    <div
                      className="relative grid grid-cols-7"
                      style={{ zIndex: 1 }}
                    >
                      {currentMonthData.days.map((day, index) => {
                        const birthday = day ? isBirthdayDate(day) : false;

                        // Group entries for this day using pre-calced logic if possible
                        // Optimally we'd have a Map<day, entries[]>
                        // But here we filter per cell (acceptable for <31 items)
                        const dayEntries = day ? getEntriesForDay(day) : [];

                        return (
                          <div
                            key={`${year}-${month}-${index}`}
                            data-calendar-day-button={day ? "true" : undefined}
                            className="pt-2 pb-0.5 px-1 flex items-center justify-center border-0"
                            onClick={(e) => {
                              const target = e.target as HTMLElement | null;
                              // If the actual inner day button handled the click, do nothing.
                              if (target?.closest('button[data-calendar-day-button="true"]')) return;
                              if (day && !isDayDisabled(day)) {
                                onDayClick(day);
                              }
                            }}
                          >
                            <CalendarDayCell
                              day={day}
                              entries={dayEntries}
                              isSelected={selectedDay === day}
                              isHighlighted={day ? highlightedDays.has(day) : false}
                              isDisabled={day ? isDayDisabled(day) : false}
                              isToday={day ? isToday(day) : false}
                              isBirthday={birthday}
                              unreadCount={day ? getUnreadCountForDate(new Date(year, month, day)) : 0}
                              onClick={() => {
                                if (day && !isDayDisabled(day)) {
                                  onDayClick(day);
                                }
                              }}
                              onLongPress={() => {
                                if (day && !isDayDisabled(day)) {
                                  onDayLongPress(day);
                                }
                              }}
                              dateKey={day ? getDateKey(day) : undefined}
                              isTransitioning={isAnimating}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Helper hint - conditionally visible */}
        {showHint && (
          <div className="px-4 pb-4 relative z-10">
            <div className="flex items-center justify-center gap-1.5 rounded-full py-2 px-4 bg-muted/40">
              <span className="text-sm">💡</span>
              <span className="text-[11px] text-muted-foreground/80 font-medium">
                Tap a day to view memories
              </span>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Month/Year Picker - renders inline with callback for anchor */}
    {signupDateForPicker && <MonthYearPicker currentDate={currentDate} signupDate={signupDateForPicker} onDateChange={onDateChange} isOpen={showMonthPicker} onClose={onCloseMonthPicker || (() => { })} getAnchorRect={getAnchorRect} />}
  </div>;
}