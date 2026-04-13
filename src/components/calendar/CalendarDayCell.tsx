
import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { CalendarEntryData } from "./FullScreenMoodViewer"; // Adjusted import path if needed
import {
  useCalendarDecoration,
  accentColorConfigs,
  DayStyle,
} from "@/contexts/CalendarDecorationContext";
import { useBadge } from "@/contexts/BadgeContext";
import { getMoodTheme } from "@/lib/moodTheme";
import { StickerFrame } from "./StickerFrame";
import { useSharedElement } from "@/contexts/SharedElementContext";
interface CalendarDayCellProps {
  day: number | null;
  entries: CalendarEntryData[];
  isSelected: boolean;
  isHighlighted?: boolean;
  isDisabled?: boolean;
  isToday?: boolean;
  isBirthday?: boolean;
  unreadCount?: number;
  onClick: () => void;
  onLongPress?: () => void;
  dateKey?: string;
  isTransitioning?: boolean;
}

export function CalendarDayCell({
  day,
  entries,
  isSelected,
  isHighlighted = false,
  isDisabled = false,
  isToday = false,
  isBirthday = false,
  unreadCount = 0,
  onClick,
  onLongPress,
  dateKey,
  isTransitioning = false,
}: CalendarDayCellProps) {
  const { settings, getDayDecoration } = useCalendarDecoration();
  const { getUnreadCountForDate } = useBadge();
  const { capturePhotoFrame, exitTargetRef } = useSharedElement();
  const [isPressed, setIsPressed] = useState(false);
  const photoContainerRef = useRef<HTMLDivElement>(null);

  // Use refs for long press timer to prevent stale closure issues
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTriggeredRef = useRef(false);

  // Clear any pending long press timer - defined before any early returns
  const clearLongPressTimer = useCallback(() => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  }, []);

  // Handle long press for decoration - uses refs to prevent stale closures
  const startLongPressTimer = useCallback(() => {
    if (!onLongPress || isDisabled) return;

    // Clear any existing timer first
    clearLongPressTimer();
    longPressTriggeredRef.current = false;

    pressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      onLongPress();
    }, 500);
  }, [onLongPress, isDisabled, clearLongPressTimer]);

  const handleMouseDown = useCallback(() => {
    startLongPressTimer();
  }, [startLongPressTimer]);

  const handleMouseUp = useCallback(() => {
    clearLongPressTimer();
  }, [clearLongPressTimer]);

  const handleTouchStart = useCallback(() => {
    startLongPressTimer();
  }, [startLongPressTimer]);

  const handleTouchEnd = useCallback(() => {
    clearLongPressTimer();
  }, [clearLongPressTimer]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
      }
    };
  }, []);

  const hasEntries = entries.length > 0;
  const firstEntry = entries[0];
  const additionalCount = entries.length - 1;
  const hasUnread = unreadCount > 0;

  // Sync exit target coordinates proactively when selected (for zoom-out after viewer navigation)
  useEffect(() => {
    if (isSelected && hasEntries && firstEntry && photoContainerRef.current) {
      const rect = photoContainerRef.current.getBoundingClientRect();
      exitTargetRef.current = {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
        imageUrl: firstEntry.photo,
      };
    }
  }, [isSelected, hasEntries, firstEntry, exitTargetRef]);



  // Early return for empty day cells - AFTER all hooks
  if (day === null) {
    return <div className="w-full aspect-square" />;
  }

  const decoration = dateKey ? getDayDecoration(dateKey) : undefined;
  const accentHsl =
    accentColorConfigs[settings.accentColor]?.hsl ?? accentColorConfigs.coral.hsl;

  const effectiveDayStyle: DayStyle = "none";

  // For photo-days, the border must match the AnalysisCard mood theme EXACTLY.
  const moodBorderClass = (() => {
    if (!hasEntries || !firstEntry) return "";
    if (decoration?.borderColorOverride) return "";
    if (!settings.borderColorMode || settings.borderColorMode === "auto") {
      const moodName =
        firstEntry.moodText ||
        (firstEntry.moodKey
          ? String(firstEntry.moodKey).replace(/^mood_?/i, "")
          : "");
      return getMoodTheme(moodName).border;
    }
    return "";
  })();

  // For manual modes (accent color) or explicit overrides, we still use inline border color.
  const photoBorderStyle: React.CSSProperties = (() => {
    if (!hasEntries) return {};

    if (decoration?.borderColorOverride) {
      return { borderColor: `hsl(${decoration.borderColorOverride})` };
    }

    if (settings.borderColorMode && settings.borderColorMode !== "auto") {
      const hsl =
        accentColorConfigs[settings.borderColorMode]?.hsl ?? "0 0% 70%";
      return { borderColor: `hsl(${hsl})` };
    }

    // auto mode uses class-based border (moodBorderClass)
    return {};
  })();

  if (isDisabled) {
    return (
      <div className="w-full aspect-square rounded-xl flex flex-col items-center justify-center relative">
        <div className="w-8 h-8 rounded-full border border-muted/15 flex-shrink-0 bg-muted/10" />
        <span className="text-[10px] text-muted-foreground/30 font-medium mt-0.5">
          {day}
        </span>
      </div>
    );
  }

  const handleClick = () => {
    // If long press already triggered, don't also trigger click
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }
    // Clear any pending long press timer on click
    clearLongPressTimer();

    // Capture photo frame for shared element animation if there are entries
    if (hasEntries && firstEntry && photoContainerRef.current) {
      capturePhotoFrame(photoContainerRef.current, firstEntry.photo);
    }

    onClick();
    // Keep the scale stable through selection update; clear "pressed" after transition.
    window.setTimeout(() => setIsPressed(false), 220);
  };

  // Calculate cell styles - simplified, no blur/glow
  const getCellStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {};


    // Highlighted state (search results)
    if (isHighlighted && !isSelected) {
      return {
        ...baseStyle,
        backgroundColor: `hsl(${accentHsl} / 0.2)`,
      };
    }

    return baseStyle;
  };

  // Determine the single visual state to apply (mutually exclusive)
  const getVisualState = () => {
    if (isSelected) return "selected";
    if (hasEntries) return "hasData";
    if (isToday) return "today";
    return "default";
  };

  const visualState = getVisualState();

  return (
    <button
      data-calendar-day-button="true"
      data-calendar-date-key={dateKey}
      onClick={handleClick}
      onPointerDown={() => !isDisabled && setIsPressed(true)}
      onPointerUp={() => window.setTimeout(() => setIsPressed(false), 220)}
      onPointerCancel={() => setIsPressed(false)}
      onPointerLeave={() => setIsPressed(false)}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={cn(
        "w-full aspect-square rounded-xl flex flex-col items-center justify-center relative",
        // Disable transitions during month slide for unified movement
        !isTransitioning && "transition-transform duration-200 ease-in-out",
        (isSelected || isPressed) && !isTransitioning && "scale-110",
        // Birthday: soft pink background with purple border
        isBirthday && "border-[1.5px]"
      )}
      style={{
        ...getCellStyle(),
        ...(isBirthday ? {
          backgroundColor: 'hsl(350 70% 92%)', // Slightly more vibrant
          borderColor: 'hsl(350 65% 78%)',
        } : {})
      }}
    >
      {/* Circular photo/slot container */}
      <div
        ref={photoContainerRef}
        className={cn(
          "relative w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-300",
          // Empty day: pure white fill with soft gray border
          !hasEntries && !isToday && !isSelected && !isBirthday &&
          "border border-muted-foreground/20 bg-[#FFFFFF]",
          // Birthday empty day: pure white fill with birthday-themed ring
          !hasEntries && isBirthday &&
          "border-[2px] shadow-[0_0_8px_rgba(255,105,180,0.2)]", // Added glow
          // Today (with or without entries, not birthday): keep today styling
          isToday && !hasEntries && !isBirthday && "bg-primary/15 border border-primary/20",
          // Selected empty day (not today, not birthday): White fill with stronger border
          !hasEntries && !isToday && isSelected && !isBirthday &&
          "border border-muted-foreground/40 bg-[#FFFFFF]",
          // Day with memory (not birthday): mood-themed border
          hasEntries && !isBirthday && "border-[2.5px]",
          hasEntries && !isBirthday && moodBorderClass,
          // Day with memory + birthday: override mood ring with birthday theme
          hasEntries && isBirthday && "border-[2.5px] shadow-[0_0_10px_rgba(255,105,180,0.3)]" // More glow when has data
        )}
        style={{
          // Use mood border for entries (but NOT on birthday - override below)
          ...(hasEntries && !isBirthday ? photoBorderStyle : {}),
          // Birthday: override ring color to match birthday pink border
          ...(isBirthday ? { borderColor: 'hsl(350 65% 78%)' } : {}),
          // Birthday empty circle: pure white fill
          ...(!hasEntries && isBirthday ? { backgroundColor: '#FFFFFF' } : {}),
          // Force GPU layer for stable rendering
          transform: "translateZ(0)",
          isolation: "isolate",
        }}
      >
        {/* Image wrapper - show photo on all days including birthdays */}
        {hasEntries && settings.iconStyle === "pawprint" && (
          <div
            className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
            style={{
              clipPath: 'circle(50% at 50% 50%)',
              WebkitClipPath: 'circle(50% at 50% 50%)',
            }}
          >
            <img
              src={firstEntry.photo}
              alt="Pet"
              loading="eager"
              decoding="sync"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              style={{
                transform: 'translateZ(0)',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
              }}
            />
          </div>
        )}
        {hasEntries && settings.iconStyle === "emoji" && (
          <div className="absolute inset-0 rounded-full overflow-hidden flex items-center justify-center bg-accent/30 pointer-events-none">
            <span className="text-lg">{firstEntry.emoji}</span>
          </div>
        )}
      </div>

      {hasEntries && settings.iconStyle === "dots" && (
        <div className="absolute inset-0 rounded-full overflow-hidden flex items-center justify-center bg-accent/30 pointer-events-none">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: `hsl(${accentHsl})` }}
          />
        </div>
      )}

      {/* Today indicator - small dot below date, pink on birthday */}
      {isToday && (
        <div
          className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
          style={{ backgroundColor: isBirthday ? 'hsl(350 65% 78%)' : 'hsl(var(--primary) / 0.6)' }}
        />
      )}

      {/* Date number with cake emojis on both sides for birthday */}
      <div className="flex items-center justify-center gap-0.5 mt-0.5 flex-shrink-0">
        {isBirthday && (
          <span className="text-[11px] leading-none animate-bounce" style={{ animationDuration: '2s' }}>🎂</span>
        )}
        <span className={cn(
          "text-[9.5px] font-semibold", // Slightly larger
          hasEntries ? "text-black" : "text-muted-foreground",
          // Today stays highlighted even when selected
          isToday && !isBirthday && "text-primary font-bold",
          // Birthday: use matching pink text
          isBirthday && "font-black" // Thicker for birthday
        )}
          style={isBirthday ? { color: 'hsl(350 60% 65%)' } : undefined} // Darker pink for legibility
        >
          {day}
        </span>
        {isBirthday && (
          <span className="text-[11px] leading-none animate-bounce" style={{ animationDuration: '2s', animationDelay: '0.5s' }}>🎂</span>
        )}
      </div>

      {/* Sticker overlay - absolute positioned, does NOT affect layout */}
      {decoration?.sticker && (
        <StickerFrame sticker={decoration.sticker} dateKey={dateKey || String(day)} />
      )}

      {/* Notification Badge - Vibrant Orange Alert Style */}
      {(() => {
        if (!dateKey) return null;
        // Parse dateKey (YYYY-MM-DD) to Date object
        const [y, m, d] = dateKey.split('-').map(Number);
        const cellDate = new Date(y, m - 1, d);

        const unreadCount = getUnreadCountForDate(cellDate);
        if (unreadCount > 0) {
          const isTwoDigit = unreadCount >= 10;
          const displayCount = unreadCount > 99 ? "+99" : unreadCount;
          return (
            <div
              className={cn(
                "absolute -top-1 -right-1 h-[18px] bg-[#FF6A00] rounded-full flex items-center justify-center animate-scale-in pointer-events-none",
                isTwoDigit ? "px-1.5 min-w-[22px]" : "w-[18px]"
              )}
              style={{
                boxShadow: "0 2px 6px rgba(255, 106, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.45)",
                zIndex: 20,
                border: '1px solid #FF8533'
              }}
            >
              <span className="text-[9px] font-black text-white leading-none">
                {displayCount}
              </span>
            </div>
          );
        }
        return null;
      })()}

      {/* Multiple entries badge (+N) - Unified vibrant orange alert style */}
      {additionalCount > 0 && !(dateKey && getUnreadCountForDate(new Date(dateKey.split('-').map(Number)[0], dateKey.split('-').map(Number)[1] - 1, dateKey.split('-').map(Number)[2])) > 0) && (() => {
        const isTwoDigit = additionalCount >= 10;
        const displayCount = additionalCount > 99 ? "+99" : `+${additionalCount}`;
        return (
          <div
            className={cn(
              "absolute -top-1 -right-1 h-[16px] bg-[#FF6A00] rounded-full flex items-center justify-center animate-scale-in pointer-events-none",
              isTwoDigit ? "px-1.5 min-w-[20px]" : "w-[16px]"
            )}
            style={{
              boxShadow: "0 1.5px 5px rgba(255, 106, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.45)",
              zIndex: 20,
              border: '0.8px solid #FF8533'
            }}
          >
            <span className="text-[8px] font-black text-white leading-none">
              {displayCount}
            </span>
          </div>
        );
      })()}

      {/* Note decoration (bottom) */}
      {decoration?.note && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 max-w-full px-0.5 truncate">
          <span className="text-[7px] text-muted-foreground whitespace-nowrap">
            {decoration.note.length > 8 ? decoration.note.slice(0, 8) + "…" : decoration.note}
          </span>
        </div>
      )}
    </button>
  );
}