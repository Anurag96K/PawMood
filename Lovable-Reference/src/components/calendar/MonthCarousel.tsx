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
    const monthDay = `${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return birthdayDates.includes(monthDay);
  };

  // Navigate to adjacent month with animation
  const goToMonth = useCallback((direction: "prev" | "next") => {
    if (isAnimating) return;
    if (direction === "prev" && !canGoPrev) return;

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
              onClick={() => goToMonth("next")} 
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-accent/50 active:scale-95 transition-all text-muted-foreground" 
              aria-label="Next month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Section - Start or Streak (below month selector) */}
        <StreakBadge count={streakCount} totalRecords={totalRecords} shouldShowStreak={shouldShowStreak} petName={petName} />

        {/* Divider between header/status and calendar grid */}
        <div className="mx-4 h-px bg-border/40" />
        
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
              <div className="relative overflow-visible">
                {/* Outer container border with rounded corners - frames only the date area */}
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{ zIndex: 2 }}
                  aria-hidden="true"
                >
                  {/* All four corners use identical styling */}
                  
                  {/* Top-right corner arc */}
                  <div
                    className="absolute"
                    style={{
                      top: 0,
                      right: 0,
                      width: '8px',
                      height: '8px',
                      borderTop: '1px solid rgba(0, 0, 0, 0.06)',
                      borderRight: '1px solid rgba(0, 0, 0, 0.06)',
                      borderTopRightRadius: '8px',
                    }}
                  />
                  
                  {/* Top-left corner arc (at first date column) - identical to other corners */}
                  <div
                    className="absolute"
                    style={{
                      top: 0,
                      left: `${firstDateColumn * cellWidth}%`,
                      width: '8px',
                      height: '8px',
                      borderTop: '1px solid rgba(0, 0, 0, 0.06)',
                      borderLeft: '1px solid rgba(0, 0, 0, 0.06)',
                      borderTopLeftRadius: '8px',
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
                      borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                      borderLeft: '1px solid rgba(0, 0, 0, 0.06)',
                      borderBottomLeftRadius: '8px',
                    }}
                  />
                  
                  {/* Bottom-right corner arc */}
                  <div
                    className="absolute"
                    style={{
                      bottom: 0,
                      right: 0,
                      width: '8px',
                      height: '8px',
                      borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                      borderRight: '1px solid rgba(0, 0, 0, 0.06)',
                      borderBottomRightRadius: '8px',
                    }}
                  />
                  
                  {/* Top border - between corners */}
                  <div
                    className="absolute"
                    style={{
                      top: 0,
                      left: `calc(${firstDateColumn * cellWidth}% + 8px)`,
                      right: '8px',
                      height: '1px',
                      background: 'rgba(0, 0, 0, 0.06)',
                    }}
                  />
                  
                  {/* Right border - between corners */}
                  <div
                    className="absolute"
                    style={{
                      top: '8px',
                      right: 0,
                      bottom: '8px',
                      width: '1px',
                      background: 'rgba(0, 0, 0, 0.06)',
                    }}
                  />
                  
                  {/* Bottom border - between corners */}
                  <div
                    className="absolute"
                    style={{
                      bottom: 0,
                      left: '8px',
                      right: '8px',
                      height: '1px',
                      background: 'rgba(0, 0, 0, 0.06)',
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
                      background: 'rgba(0, 0, 0, 0.06)',
                    }}
                  />
                  
                  {/* Left border - remaining rows (from below step corner arc to above bottom corner) */}
                  {rowCount > 1 && (
                    <div
                      className="absolute"
                      style={{
                        // Start 8px below row 1 boundary when there's a step corner arc
                        top: firstDateColumn > 0 ? `calc(${cellHeight}% + 8px)` : `${cellHeight}%`,
                        left: 0,
                        bottom: '8px',
                        width: '1px',
                        background: 'rgba(0, 0, 0, 0.06)',
                      }}
                    />
                  )}
                  
                  {/* Step connector - horizontal line at row 1 boundary with corner arc at left edge */}
                  {firstDateColumn > 0 && rowCount > 1 && (
                    <>
                      {/* Corner arc at row 2 start (same style as day 1 corner) */}
                      <div
                        className="absolute"
                        style={{
                          top: `${cellHeight}%`,
                          left: 0,
                          width: '8px',
                          height: '8px',
                          borderTop: '1px solid rgba(0, 0, 0, 0.06)',
                          borderLeft: '1px solid rgba(0, 0, 0, 0.06)',
                          borderTopLeftRadius: '8px',
                        }}
                      />
                      {/* Horizontal connector line - starts after corner arc */}
                      <div
                        className="absolute"
                        style={{
                          top: `${cellHeight}%`,
                          left: '8px',
                          width: `calc(${firstDateColumn * cellWidth}% - 7px)`,
                          height: '1px',
                          background: 'rgba(0, 0, 0, 0.06)',
                        }}
                      />
                    </>
                  )}
                </div>
                
                {/* Internal grid lines overlay - sits behind content, clipped to bounds */}
                <div 
                  className="absolute inset-0 pointer-events-none overflow-hidden"
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
                      const shouldDrawLine = leftHasDate && rightHasDate;
                      
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
                      // Calculate top position - internal lines should start from horizontal grid lines
                      // For row 0, start from 0 (top border), for other rows start from the horizontal line position
                      const topPos = `${seg.top * cellHeight}%`;
                      // For bottom, end at the horizontal line position or bottom border
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
                            background: 'rgba(0, 0, 0, 0.04)',
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
                      const shouldDrawLine = aboveHasDate && belowHasDate;
                      
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
                          background: 'rgba(0, 0, 0, 0.04)',
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
                          entries={day ? getEntriesForDay(day) : []} 
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
            <div style={{
              backgroundColor: "#FFF3E8"
            }} className="flex items-center justify-center gap-1.5 rounded-full py-2 px-4 bg-secondary">
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
      {signupDateForPicker && <MonthYearPicker currentDate={currentDate} signupDate={signupDateForPicker} onDateChange={onDateChange} isOpen={showMonthPicker} onClose={onCloseMonthPicker || (() => {})} getAnchorRect={getAnchorRect} />}
    </div>;
}