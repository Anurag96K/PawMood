import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface BirthdayPickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 5;

export function BirthdayPicker({ value, onChange }: BirthdayPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const monthRef = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLDivElement>(null);
  const dayRef = useRef<HTMLDivElement>(null);
  
  const today = new Date();
  const currentYear = today.getFullYear();
  
  // Generate years from 1900 to current year
  const years = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => currentYear - i);
  
  const [selectedMonth, setSelectedMonth] = useState(value?.getMonth() ?? today.getMonth());
  const [selectedYear, setSelectedYear] = useState(value?.getFullYear() ?? currentYear);
  const [selectedDay, setSelectedDay] = useState(value?.getDate() ?? today.getDate());
  
  // Get days in selected month
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  
  // Clamp selected day if month changes
  useEffect(() => {
    if (selectedDay > daysInMonth) {
      setSelectedDay(daysInMonth);
    }
  }, [daysInMonth, selectedDay]);

  // Scroll to selected values when opening
  useEffect(() => {
    if (isOpen) {
      if (monthRef.current) {
        monthRef.current.scrollTop = selectedMonth * ITEM_HEIGHT;
      }
      if (dayRef.current) {
        dayRef.current.scrollTop = (selectedDay - 1) * ITEM_HEIGHT;
      }
      if (yearRef.current) {
        const yearIndex = years.indexOf(selectedYear);
        if (yearIndex >= 0) {
          yearRef.current.scrollTop = yearIndex * ITEM_HEIGHT;
        }
      }
    }
  }, [isOpen, selectedMonth, selectedDay, selectedYear, years]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleMonthScroll = () => {
    if (!monthRef.current) return;
    const scrollTop = monthRef.current.scrollTop;
    const index = Math.round(scrollTop / ITEM_HEIGHT);
    setSelectedMonth(Math.max(0, Math.min(index, 11)));
  };

  const handleDayScroll = () => {
    if (!dayRef.current) return;
    const scrollTop = dayRef.current.scrollTop;
    const index = Math.round(scrollTop / ITEM_HEIGHT);
    setSelectedDay(Math.max(1, Math.min(index + 1, daysInMonth)));
  };

  const handleYearScroll = () => {
    if (!yearRef.current) return;
    const scrollTop = yearRef.current.scrollTop;
    const index = Math.round(scrollTop / ITEM_HEIGHT);
    setSelectedYear(years[Math.max(0, Math.min(index, years.length - 1))]);
  };

  const handleConfirm = () => {
    const newDate = new Date(selectedYear, selectedMonth, selectedDay);
    // Don't allow future dates
    if (newDate > today) {
      onChange(today);
    } else {
      onChange(newDate);
    }
    setIsOpen(false);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Pick a date";
    return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  return (
    <div className="relative" ref={pickerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-14 px-4 text-base flex items-center justify-between rounded-xl border border-input bg-background hover:bg-accent/50 transition-colors"
      >
        <span className={value ? "text-foreground" : "text-muted-foreground"}>
          {formatDate(value)}
        </span>
        <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
      </button>

      {/* Picker Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          
          <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-card rounded-2xl shadow-plush-hover border border-border animate-scale-in origin-top">
            {/* Picker wheels */}
            <div className="relative flex h-[200px] overflow-hidden rounded-t-2xl">
              {/* Selection indicator */}
              <div className="absolute left-3 right-3 top-1/2 -translate-y-1/2 h-10 bg-accent/60 rounded-xl pointer-events-none z-10" />
              
              {/* Gradient overlays for iOS effect */}
              <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-card to-transparent pointer-events-none z-20" />
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-card to-transparent pointer-events-none z-20" />
              
              {/* Month picker */}
              <div 
                ref={monthRef}
                onScroll={handleMonthScroll}
                className="flex-[1.2] overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
                style={{ 
                  paddingTop: `${(VISIBLE_ITEMS - 1) / 2 * ITEM_HEIGHT}px`,
                  paddingBottom: `${(VISIBLE_ITEMS - 1) / 2 * ITEM_HEIGHT}px`
                }}
              >
                {MONTHS.map((month, index) => (
                  <div
                    key={month}
                    className={cn(
                      "h-10 flex items-center justify-center snap-center transition-all duration-150",
                      selectedMonth === index
                        ? "text-foreground font-bold text-base"
                        : "text-muted-foreground text-sm"
                    )}
                  >
                    {month}
                  </div>
                ))}
              </div>
              
              {/* Day picker */}
              <div 
                ref={dayRef}
                onScroll={handleDayScroll}
                className="flex-[0.6] overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
                style={{ 
                  paddingTop: `${(VISIBLE_ITEMS - 1) / 2 * ITEM_HEIGHT}px`,
                  paddingBottom: `${(VISIBLE_ITEMS - 1) / 2 * ITEM_HEIGHT}px`
                }}
              >
                {days.map((day) => (
                  <div
                    key={day}
                    className={cn(
                      "h-10 flex items-center justify-center snap-center transition-all duration-150",
                      selectedDay === day
                        ? "text-foreground font-bold text-base"
                        : "text-muted-foreground text-sm"
                    )}
                  >
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Year picker */}
              <div 
                ref={yearRef}
                onScroll={handleYearScroll}
                className="flex-1 overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
                style={{ 
                  paddingTop: `${(VISIBLE_ITEMS - 1) / 2 * ITEM_HEIGHT}px`,
                  paddingBottom: `${(VISIBLE_ITEMS - 1) / 2 * ITEM_HEIGHT}px`
                }}
              >
                {years.map((year) => (
                  <div
                    key={year}
                    className={cn(
                      "h-10 flex items-center justify-center snap-center transition-all duration-150",
                      selectedYear === year
                        ? "text-foreground font-bold text-base"
                        : "text-muted-foreground text-sm"
                    )}
                  >
                    {year}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <button 
                onClick={() => setIsOpen(false)}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirm}
                className="text-sm font-bold text-primary hover:text-primary/80 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
