import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Camera, Loader2, BarChart3, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBadge } from "@/contexts/BadgeContext";
import { useSelectedDate } from "@/contexts/SelectedDateContext";
import { useOptimisticImage } from "@/contexts/OptimisticImageContext";
import { TranslationKey } from "@/lib/translations";
import { FullScreenMoodViewer, CalendarEntryData } from "@/components/calendar/FullScreenMoodViewer";
import { useMoodEntries, MoodEntry } from "@/hooks/useMoodEntries";
import { useProfile } from "@/hooks/useProfile";
import { MonthCarousel } from "@/components/calendar/MonthCarousel";
import { CalendarCustomizeModal } from "@/components/calendar/CalendarCustomizeModal";
import { DayDecorationModal } from "@/components/calendar/DayDecorationModal";
import { BirthdayModal } from "@/components/calendar/BirthdayModal";

import { useCalendarDecoration, themeConfigs } from "@/contexts/CalendarDecorationContext";
import { UnifiedLockOverlay } from "@/components/UnifiedLockScreen";
import { usePrimaryPhoto } from "@/hooks/usePrimaryPhoto";
import { useStreak } from "@/hooks/useStreak";
import { useCalendarHint } from "@/hooks/useCalendarHint";
import { usePet } from "@/hooks/usePet";

interface CalendarScreenProps {
  isPremium: boolean;
  isBasic?: boolean;
  onUpgrade: () => void;
  onNavigateToCamera?: () => void;
  onNavigateToProfile?: (openPlanSection?: boolean) => void;
  analysisCount?: number;
  onOpenReport?: () => void;
  /** Whether user has an active monthly/yearly subscription */
  hasActiveSubscription?: boolean;
  /** Whether user has ever subscribed (for lock screen copy differentiation) */
  isReturningUser?: boolean;
}

// NOTE: For birthday visuals we use MM-DD strings (local time).
const formatMonthDay = (date: Date): string => {
  return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

// Test birthday dates (month-day) used for day-cell styling previews.
// IMPORTANT: Outer birthday background should ONLY depend on *today* matching one of these.
// NOTE: Only Jan 2 is used as a test date. Jan 28/29 removed to avoid triggering during current time.
const TEST_BIRTHDAY_DATES: readonly string[] = ["01-02"];

// Birthday Theme Background - premium 2.5D style with soft shadows, gradients, size variation
// NOTE: Use a viewport-anchored layer so decorations don't move out of view
// when the scroll container height increases after loading.
const BirthdayThemeBackground = () => {
  return (
    <div className="fixed inset-y-0 left-1/2 w-full max-w-[375px] -translate-x-1/2 overflow-hidden pointer-events-none z-0">
      {/* Soft pastel gradient background */}
      <div 
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, hsl(340 50% 97%) 0%, hsl(30 45% 98%) 50%, hsl(270 40% 98%) 100%)",
        }}
      />
      
      {/* Subtle confetti dots with soft shadows and size variation */}
      <div className="absolute inset-0">
        {/* Pink dots - varied sizes */}
        <div className="absolute top-[12%] left-[6%] w-[7px] h-[7px] rounded-full" style={{ backgroundColor: 'hsl(340 55% 80% / 0.5)', boxShadow: '0 1px 2px hsl(340 40% 60% / 0.1)' }} />
        <div className="absolute top-[28%] right-[10%] w-1 h-1 rounded-full" style={{ backgroundColor: 'hsl(340 50% 82% / 0.4)', boxShadow: '0 1px 1px hsl(340 40% 60% / 0.08)' }} />
        <div className="absolute top-[48%] left-[4%] w-[5px] h-[5px] rounded-full" style={{ backgroundColor: 'hsl(340 45% 78% / 0.38)', boxShadow: '0 1px 2px hsl(340 40% 60% / 0.1)' }} />
        <div className="absolute top-[62%] right-[7%] w-[6px] h-[6px] rounded-full" style={{ backgroundColor: 'hsl(340 50% 80% / 0.45)', boxShadow: '0 1px 2px hsl(340 40% 60% / 0.1)' }} />
        <div className="absolute bottom-[38%] left-[8%] w-1 h-1 rounded-full" style={{ backgroundColor: 'hsl(340 55% 82% / 0.4)', boxShadow: '0 1px 1px hsl(340 40% 60% / 0.08)' }} />
        
        {/* Peach dots - varied sizes */}
        <div className="absolute top-[18%] left-[12%] w-[5px] h-[5px] rounded-full" style={{ backgroundColor: 'hsl(25 55% 82% / 0.48)', boxShadow: '0 1px 2px hsl(25 40% 55% / 0.1)' }} />
        <div className="absolute top-[38%] right-[5%] w-1 h-1 rounded-full" style={{ backgroundColor: 'hsl(25 50% 80% / 0.4)', boxShadow: '0 1px 1px hsl(25 40% 55% / 0.08)' }} />
        <div className="absolute top-[55%] left-[10%] w-[7px] h-[7px] rounded-full" style={{ backgroundColor: 'hsl(25 45% 78% / 0.38)', boxShadow: '0 1px 2px hsl(25 40% 55% / 0.1)' }} />
        <div className="absolute bottom-[42%] right-[12%] w-[5px] h-[5px] rounded-full" style={{ backgroundColor: 'hsl(25 55% 82% / 0.45)', boxShadow: '0 1px 2px hsl(25 40% 55% / 0.1)' }} />
        
        {/* Lavender dots - varied sizes */}
        <div className="absolute top-[22%] right-[18%] w-1 h-1 rounded-full" style={{ backgroundColor: 'hsl(270 45% 82% / 0.42)', boxShadow: '0 1px 1px hsl(270 35% 55% / 0.08)' }} />
        <div className="absolute top-[42%] left-[3%] w-[5px] h-[5px] rounded-full" style={{ backgroundColor: 'hsl(270 40% 80% / 0.38)', boxShadow: '0 1px 2px hsl(270 35% 55% / 0.1)' }} />
        <div className="absolute top-[68%] right-[4%] w-[6px] h-[6px] rounded-full" style={{ backgroundColor: 'hsl(270 50% 82% / 0.45)', boxShadow: '0 1px 2px hsl(270 35% 55% / 0.1)' }} />
        <div className="absolute bottom-[35%] right-[9%] w-1 h-1 rounded-full" style={{ backgroundColor: 'hsl(270 45% 80% / 0.4)', boxShadow: '0 1px 1px hsl(270 35% 55% / 0.08)' }} />
      </div>
      
      {/* Party bunting / pennant flags - with soft shadows and gradients, size variation */}
      <div className="absolute top-0 left-0 right-0 h-14 flex items-start justify-center">
        <svg 
          viewBox="0 0 400 48" 
          className="w-full max-w-md h-12"
          preserveAspectRatio="xMidYMin slice"
        >
          {/* Define gradients for flags */}
          <defs>
            <linearGradient id="flagPink" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(340 50% 92%)" stopOpacity="0.75" />
              <stop offset="100%" stopColor="hsl(340 50% 85%)" stopOpacity="0.7" />
            </linearGradient>
            <linearGradient id="flagPeach" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(25 50% 92%)" stopOpacity="0.7" />
              <stop offset="100%" stopColor="hsl(25 50% 85%)" stopOpacity="0.65" />
            </linearGradient>
            <linearGradient id="flagLavender" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(270 45% 93%)" stopOpacity="0.68" />
              <stop offset="100%" stopColor="hsl(270 45% 86%)" stopOpacity="0.62" />
            </linearGradient>
            {/* Soft shadow filter */}
            <filter id="flagShadow" x="-20%" y="-20%" width="140%" height="150%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="1.2" floodColor="hsl(30 30% 40%)" floodOpacity="0.1" />
            </filter>
          </defs>
          
          {/* Thin string with subtle shadow */}
          <path 
            d="M-10,6 Q50,14 100,8 Q150,2 200,10 Q250,18 300,8 Q350,0 410,8" 
            fill="none" 
            stroke="hsl(30 25% 72% / 0.6)" 
            strokeWidth="1.2"
            style={{ filter: 'drop-shadow(0 0.5px 1px hsl(30 20% 50% / 0.12))' }}
          />
          
          {/* Triangular flags with gradients, shadows, and size variation */}
          <polygon points="25,8 40,32 10,32" fill="url(#flagPink)" filter="url(#flagShadow)" transform="scale(0.95)" style={{ transformOrigin: '25px 20px' }} />
          <polygon points="65,6 79,29 51,29" fill="url(#flagPeach)" filter="url(#flagShadow)" />
          <polygon points="105,10 120,34 90,34" fill="url(#flagLavender)" filter="url(#flagShadow)" transform="scale(1.02)" style={{ transformOrigin: '105px 22px' }} />
          <polygon points="145,4 159,27 131,27" fill="url(#flagPink)" filter="url(#flagShadow)" transform="scale(0.92)" style={{ transformOrigin: '145px 16px' }} />
          <polygon points="185,12 200,36 170,36" fill="url(#flagPeach)" filter="url(#flagShadow)" transform="scale(1.05)" style={{ transformOrigin: '185px 24px' }} />
          <polygon points="225,8 240,32 210,32" fill="url(#flagLavender)" filter="url(#flagShadow)" />
          <polygon points="265,4 279,27 251,27" fill="url(#flagPink)" filter="url(#flagShadow)" transform="scale(0.98)" style={{ transformOrigin: '265px 16px' }} />
          <polygon points="305,10 320,34 290,34" fill="url(#flagPeach)" filter="url(#flagShadow)" transform="scale(1.03)" style={{ transformOrigin: '305px 22px' }} />
          <polygon points="345,6 359,29 331,29" fill="url(#flagLavender)" filter="url(#flagShadow)" transform="scale(0.94)" style={{ transformOrigin: '345px 18px' }} />
          <polygon points="380,8 394,31 366,31" fill="url(#flagPink)" filter="url(#flagShadow)" />
        </svg>
      </div>
      
      {/* Left side - balloons with gradients, shadows, size variation */}
      <div className="absolute left-0 top-0 bottom-0 w-10">
        {/* Balloon 1 - pink, scale 1.0 */}
        <svg className="absolute top-20 left-1" width="28" height="50" viewBox="0 0 28 50" style={{ filter: 'drop-shadow(0 2px 3px hsl(340 40% 50% / 0.1))' }}>
          <defs>
            <linearGradient id="balloonPink1" x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor="hsl(340 50% 90%)" stopOpacity="0.65" />
              <stop offset="50%" stopColor="hsl(340 50% 85%)" stopOpacity="0.55" />
              <stop offset="100%" stopColor="hsl(340 48% 80%)" stopOpacity="0.5" />
            </linearGradient>
          </defs>
          <ellipse cx="14" cy="16" rx="12" ry="15" fill="url(#balloonPink1)" />
          <ellipse cx="10" cy="11" rx="3" ry="4" fill="hsl(340 40% 95% / 0.35)" /> {/* highlight */}
          <path d="M14,31 L14,48" stroke="hsl(340 40% 75% / 0.4)" strokeWidth="0.8" />
        </svg>
        {/* Balloon 2 - lavender, scale 0.9 */}
        <svg className="absolute top-36 left-3" width="22" height="42" viewBox="0 0 24 45" style={{ filter: 'drop-shadow(0 2px 3px hsl(270 35% 50% / 0.1))' }}>
          <defs>
            <linearGradient id="balloonLav1" x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor="hsl(270 42% 92%)" stopOpacity="0.6" />
              <stop offset="50%" stopColor="hsl(270 40% 88%)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="hsl(270 38% 82%)" stopOpacity="0.45" />
            </linearGradient>
          </defs>
          <ellipse cx="12" cy="14" rx="10" ry="13" fill="url(#balloonLav1)" />
          <ellipse cx="9" cy="10" rx="2.5" ry="3.5" fill="hsl(270 35% 96% / 0.3)" />
          <path d="M12,27 L12,43" stroke="hsl(270 35% 78% / 0.35)" strokeWidth="0.8" />
        </svg>
        {/* Balloon 3 - peach, scale 1.05 */}
        <svg className="absolute top-[48%] left-0" width="28" height="52" viewBox="0 0 26 48" style={{ filter: 'drop-shadow(0 2px 3px hsl(25 40% 50% / 0.1))' }}>
          <defs>
            <linearGradient id="balloonPeach1" x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor="hsl(25 52% 90%)" stopOpacity="0.6" />
              <stop offset="50%" stopColor="hsl(25 50% 86%)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="hsl(25 48% 80%)" stopOpacity="0.45" />
            </linearGradient>
          </defs>
          <ellipse cx="13" cy="15" rx="11" ry="14" fill="url(#balloonPeach1)" />
          <ellipse cx="9" cy="10" rx="2.8" ry="3.8" fill="hsl(25 40% 96% / 0.32)" />
          <path d="M13,29 L13,46" stroke="hsl(25 40% 76% / 0.35)" strokeWidth="0.8" />
        </svg>
      </div>
      
      {/* Right side - balloons with gradients, shadows, size variation */}
      <div className="absolute right-0 top-0 bottom-0 w-10">
        {/* Balloon 1 - lavender, scale 0.95 */}
        <svg className="absolute top-24 right-2" width="23" height="44" viewBox="0 0 24 45" style={{ filter: 'drop-shadow(0 2px 3px hsl(270 35% 50% / 0.1))' }}>
          <defs>
            <linearGradient id="balloonLav2" x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor="hsl(270 45% 90%)" stopOpacity="0.58" />
              <stop offset="50%" stopColor="hsl(270 45% 86%)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="hsl(270 42% 80%)" stopOpacity="0.45" />
            </linearGradient>
          </defs>
          <ellipse cx="12" cy="14" rx="10" ry="13" fill="url(#balloonLav2)" />
          <ellipse cx="9" cy="10" rx="2.5" ry="3.5" fill="hsl(270 38% 96% / 0.3)" />
          <path d="M12,27 L12,43" stroke="hsl(270 35% 76% / 0.35)" strokeWidth="0.8" />
        </svg>
        {/* Balloon 2 - pink, scale 1.0 */}
        <svg className="absolute top-40 right-0" width="26" height="48" viewBox="0 0 26 48" style={{ filter: 'drop-shadow(0 2px 3px hsl(340 40% 50% / 0.1))' }}>
          <defs>
            <linearGradient id="balloonPink2" x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor="hsl(340 46% 91%)" stopOpacity="0.58" />
              <stop offset="50%" stopColor="hsl(340 45% 87%)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="hsl(340 43% 82%)" stopOpacity="0.45" />
            </linearGradient>
          </defs>
          <ellipse cx="13" cy="15" rx="11" ry="14" fill="url(#balloonPink2)" />
          <ellipse cx="9" cy="10" rx="2.8" ry="3.8" fill="hsl(340 40% 96% / 0.3)" />
          <path d="M13,29 L13,46" stroke="hsl(340 35% 77% / 0.35)" strokeWidth="0.8" />
        </svg>
        {/* Balloon 3 - peach, scale 0.92 */}
        <svg className="absolute top-[52%] right-1" width="21" height="40" viewBox="0 0 22 42" style={{ filter: 'drop-shadow(0 2px 3px hsl(25 40% 50% / 0.1))' }}>
          <defs>
            <linearGradient id="balloonPeach2" x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor="hsl(25 46% 92%)" stopOpacity="0.55" />
              <stop offset="50%" stopColor="hsl(25 45% 88%)" stopOpacity="0.45" />
              <stop offset="100%" stopColor="hsl(25 42% 82%)" stopOpacity="0.4" />
            </linearGradient>
          </defs>
          <ellipse cx="11" cy="13" rx="9" ry="12" fill="url(#balloonPeach2)" />
          <ellipse cx="8" cy="9" rx="2.2" ry="3" fill="hsl(25 38% 96% / 0.28)" />
          <path d="M11,25 L11,40" stroke="hsl(25 35% 78% / 0.3)" strokeWidth="0.8" />
        </svg>
      </div>
      
      {/* Bottom balloons - fixed position, decorative only */}
      <div className="absolute bottom-16 left-0 right-0 flex justify-between px-3">
        {/* Left balloon - pink */}
        <svg
          width="32"
          height="58"
          viewBox="0 0 30 55"
          style={{ filter: "drop-shadow(0 2px 4px hsl(340 40% 50% / 0.1))" }}
        >
          <defs>
            <linearGradient id="balloonPink3" x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor="hsl(340 50% 91%)" stopOpacity="0.58" />
              <stop offset="50%" stopColor="hsl(340 48% 86%)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="hsl(340 45% 80%)" stopOpacity="0.45" />
            </linearGradient>
          </defs>
          <ellipse cx="15" cy="17" rx="13" ry="16" fill="url(#balloonPink3)" />
          <ellipse cx="10" cy="11" rx="3.2" ry="4.2" fill="hsl(340 42% 96% / 0.32)" />
          <path d="M15,33 L15,53" stroke="hsl(340 38% 76% / 0.35)" strokeWidth="0.8" />
        </svg>

        {/* Center balloon - lavender */}
        <svg
          width="27"
          height="50"
          viewBox="0 0 28 52"
          style={{ filter: "drop-shadow(0 2px 4px hsl(270 35% 50% / 0.1))" }}
        >
          <defs>
            <linearGradient id="balloonLav3" x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor="hsl(270 44% 92%)" stopOpacity="0.55" />
              <stop offset="50%" stopColor="hsl(270 42% 88%)" stopOpacity="0.45" />
              <stop offset="100%" stopColor="hsl(270 40% 82%)" stopOpacity="0.4" />
            </linearGradient>
          </defs>
          <ellipse cx="14" cy="16" rx="12" ry="15" fill="url(#balloonLav3)" />
          <ellipse cx="10" cy="11" rx="3" ry="4" fill="hsl(270 38% 96% / 0.28)" />
          <path d="M14,31 L14,50" stroke="hsl(270 32% 78% / 0.3)" strokeWidth="0.8" />
        </svg>

        {/* Right balloon - peach */}
        <svg
          width="28"
          height="52"
          viewBox="0 0 28 52"
          style={{ filter: "drop-shadow(0 2px 4px hsl(25 40% 50% / 0.1))" }}
        >
          <defs>
            <linearGradient id="balloonPeach3" x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor="hsl(25 50% 91%)" stopOpacity="0.55" />
              <stop offset="50%" stopColor="hsl(25 48% 87%)" stopOpacity="0.48" />
              <stop offset="100%" stopColor="hsl(25 45% 81%)" stopOpacity="0.42" />
            </linearGradient>
          </defs>
          <ellipse cx="14" cy="16" rx="12" ry="15" fill="url(#balloonPeach3)" />
          <ellipse cx="10" cy="11" rx="3" ry="4" fill="hsl(25 42% 96% / 0.3)" />
          <path d="M14,31 L14,50" stroke="hsl(25 38% 77% / 0.32)" strokeWidth="0.8" />
        </svg>
      </div>

      {/* Extra corner balloons - above bottom row */}
      <svg
        className="absolute left-6 bottom-[72px]"
        width="20"
        height="38"
        viewBox="0 0 20 38"
        style={{ filter: "drop-shadow(0 1.5px 3px hsl(25 40% 50% / 0.1))" }}
      >
        <defs>
          <linearGradient id="balloonPeach4" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="hsl(25 46% 92%)" stopOpacity="0.48" />
            <stop offset="100%" stopColor="hsl(25 44% 85%)" stopOpacity="0.38" />
          </linearGradient>
        </defs>
        <ellipse cx="10" cy="12" rx="8" ry="11" fill="url(#balloonPeach4)" />
        <ellipse cx="7" cy="8" rx="2" ry="2.8" fill="hsl(25 38% 96% / 0.25)" />
        <path d="M10,23 L10,36" stroke="hsl(25 35% 78% / 0.28)" strokeWidth="0.7" />
      </svg>

      <svg
        className="absolute right-8 bottom-[70px]"
        width="22"
        height="40"
        viewBox="0 0 22 40"
        style={{ filter: "drop-shadow(0 1.5px 3px hsl(340 40% 50% / 0.1))" }}
      >
        <defs>
          <linearGradient id="balloonPink4" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="hsl(340 46% 92%)" stopOpacity="0.46" />
            <stop offset="100%" stopColor="hsl(340 44% 85%)" stopOpacity="0.36" />
          </linearGradient>
        </defs>
        <ellipse cx="11" cy="13" rx="9" ry="12" fill="url(#balloonPink4)" />
        <ellipse cx="8" cy="9" rx="2.2" ry="3" fill="hsl(340 38% 96% / 0.24)" />
        <path d="M11,25 L11,38" stroke="hsl(340 35% 78% / 0.26)" strokeWidth="0.7" />
      </svg>
    </div>
  );
};

// Convert MoodEntry to CalendarEntryData
const convertToCalendarEntry = (entry: MoodEntry): CalendarEntryData => ({
  id: entry.id,
  date: new Date(entry.analyzed_at),
  photo: entry.image_url,
  moodKey: `mood${entry.mood}` as TranslationKey,
  descKey: `moodDesc${entry.mood}` as TranslationKey,
  careTipKey: `careTip${entry.mood}` as TranslationKey,
  emoji: entry.mood_emoji,
  confidence: entry.confidence,
  memo: entry.memo || undefined,
  moodText: entry.mood,
  descText: entry.mood_description || undefined,
  careTipText: entry.care_tip || undefined,
});

export function CalendarScreen({ isPremium, isBasic = false, onUpgrade, onNavigateToCamera, onNavigateToProfile, analysisCount = 0, onOpenReport, hasActiveSubscription = false, isReturningUser = false }: CalendarScreenProps) {
  const { t } = useLanguage();
  const {
    entries: moodEntries,
    loading,
    updateMemo,
    uploadImage,
    analyzeMood,
    createEntry,
    deleteEntry,
  } = useMoodEntries();
  const { profile } = useProfile();
  const { getUnreadCountForDate } = useBadge();
  const { getOptimisticImage } = useOptimisticImage();
  const { streakCount, totalRecords, shouldShowStreak } = useStreak(moodEntries);
  const { settings } = useCalendarDecoration();
  const { getPrimaryPhoto } = usePrimaryPhoto();
  const { hasDismissedHint, dismissHint } = useCalendarHint();
  const { pet } = usePet();
  const [currentDate, setCurrentDate] = useState(new Date());
  const { selectedDate, setSelectedDate } = useSelectedDate();
  const [selectedEntry, setSelectedEntry] = useState<CalendarEntryData | null>(null);
  // Force calendar re-render when primary photo changes
  const [refreshKey, setRefreshKey] = useState(0);

  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [decorationDay, setDecorationDay] = useState<{ key: string; label: string } | null>(null);
  // Flag to skip month transition animation (used during Analysis Card close)
  const [instantChange, setInstantChange] = useState(false);
  // Birthday modal state
  const [showBirthdayModal, setShowBirthdayModal] = useState(false);

  // Force re-evaluating "today" (for birthday background) on:
  // - mount/app launch
  // - returning from background (visibility/focus)
  // - local midnight rollover
  const [todayTick, setTodayTick] = useState(() => Date.now());
  useEffect(() => {
    const refreshToday = () => setTodayTick(Date.now());

    // Re-check when app/tab becomes active again
    const handleVisibilityChange = () => {
      if (!document.hidden) refreshToday();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", refreshToday);
    window.addEventListener("pageshow", refreshToday);

    // Re-check at local midnight
    let midnightTimer: number | null = null;
    const scheduleNextMidnightCheck = () => {
      if (midnightTimer) window.clearTimeout(midnightTimer);
      const now = new Date();
      const nextMidnight = new Date(now);
      nextMidnight.setHours(24, 0, 0, 0);
      const msUntilMidnight = nextMidnight.getTime() - now.getTime();
      midnightTimer = window.setTimeout(() => {
        refreshToday();
        scheduleNextMidnightCheck();
      }, Math.max(0, msUntilMidnight) + 50);
    };
    scheduleNextMidnightCheck();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", refreshToday);
      window.removeEventListener("pageshow", refreshToday);
      if (midnightTimer) window.clearTimeout(midnightTimer);
    };
  }, []);

  // Show hint only when: has at least one saved analysis card AND hasn't dismissed hint
  const shouldShowHint = moodEntries.length > 0 && !hasDismissedHint;

  const calendarCardRef = useRef<HTMLDivElement>(null);

  // === TESTING FLAG: Set to true to always show birthday popup & background ===
  const ALWAYS_SHOW_BIRTHDAY_POPUP = false;

  // OUTER birthday background must be based ONLY on *today* matching a birthday date.
  // Viewing months that contain birthday dates must NOT trigger this.
  const isBirthdayToday = useMemo(() => {
    const today = new Date(todayTick);
    const monthDay = formatMonthDay(today);
    return TEST_BIRTHDAY_DATES.includes(monthDay);
  }, [todayTick]);

  // Use testing flag OR actual birthday-today for UI display
  const isBirthday = ALWAYS_SHOW_BIRTHDAY_POPUP || isBirthdayToday;

  // Show birthday modal every time user enters Calendar
  // When ALWAYS_SHOW_BIRTHDAY_POPUP is true, bypass the date check
  useEffect(() => {
    if (!isBirthday) return;
    
    // Show the modal immediately on every Calendar entry
    setShowBirthdayModal(true);
  }, [isBirthday]);

  const handleCloseBirthdayModal = useCallback(() => {
    setShowBirthdayModal(false);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedDate(null);
    setSelectedEntry(null);
  }, []);

  const signupDate = useMemo(() => {
    if (!profile?.created_at) return null;
    return new Date(profile.created_at);
  }, [profile?.created_at]);

  const signupDateForPicker = useMemo(() => signupDate ?? new Date(1970, 0, 1), [signupDate]);

  // Convert entries and use optimistic images where available for instant display
  const entries = useMemo(
    () => moodEntries.map((entry) => {
      const calendarEntry = convertToCalendarEntry(entry);
      // Check if we have a cached local image for this entry (for instant display)
      const optimisticImage = getOptimisticImage(entry.id);
      if (optimisticImage) {
        return { ...calendarEntry, photo: optimisticImage };
      }
      return calendarEntry;
    }).sort((a, b) => a.date.getTime() - b.date.getTime()),
    [moodEntries, getOptimisticImage]
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const selectedDay =
    selectedDate && selectedDate.getFullYear() === year && selectedDate.getMonth() === month
      ? selectedDate.getDate()
      : null;

  const handleDateChange = (date: Date) => {
    setCurrentDate(date);
    // Optional: clear selection only when month actually changes
    setSelectedDate(null);
  };

  const getEntriesForDay = (day: number): CalendarEntryData[] => {
    const dayEntries = entries.filter(entry => 
      entry.date.getFullYear() === year &&
      entry.date.getMonth() === month &&
      entry.date.getDate() === day
    );
    
    if (dayEntries.length <= 1) return dayEntries;
    
    // Check if there's a primary photo set for this date
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const primaryId = getPrimaryPhoto(dateKey);
    
    if (primaryId) {
      // Reorder so primary entry is first
      const primaryEntry = dayEntries.find(e => e.id === primaryId);
      if (primaryEntry) {
        const others = dayEntries.filter(e => e.id !== primaryId);
        return [primaryEntry, ...others];
      }
    }
    
    return dayEntries;
  };

  const handleDayClick = (day: number) => {
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(new Date(year, month, day));
    console.log(`selectedDate set to ${dateKey}`);

    // Permanently dismiss the tap hint after ANY calendar day interaction
    // This ensures the hint never reappears after user's first tap
    dismissHint();

    // Don't open viewer when Decorate modal is open
    if (showCustomizeModal) return;

    const dayEntries = getEntriesForDay(day);
    if (dayEntries.length > 0) {
      // Open viewer for photo-filled dates (only when Decorate is NOT open)
      setSelectedEntry(dayEntries[0]);
    } else {
      setSelectedEntry(null);
    }
  };

  // Deselect when tapping outside the day circles (empty background)
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // If user taps on a day cell (including padding), keep selection (or switch via day click)
      if (target.closest('[data-calendar-day-button="true"]')) return;

      // If user taps calendar controls (e.g., Decorate/Report), keep selection
      if (target.closest('[data-calendar-control="true"]')) return;

      // If tap happens inside the calendar card, MonthCarousel handles background taps
      if (calendarCardRef.current?.contains(target)) return;

      // If tap happens inside any modal/viewer (analysis card, etc.), don't deselect
      if (target.closest('[data-modal-container="true"]')) return;

      clearSelection();
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [clearSelection]);

  const handleMemoChange = async (entryId: string, memo: string) => {
    try {
      await updateMemo(entryId, memo);
    } catch (error) {
      console.error("Error updating memo:", error);
    }
  };

  const handleReplacePhoto = (newEntry: MoodEntry) => {
    const updatedEntry = convertToCalendarEntry(newEntry);
    setSelectedEntry(updatedEntry);
    // Force calendar grid to re-render to show updated primary photo
    setRefreshKey(k => k + 1);
  };

  const hasAnyEntries = entries.some(entry =>
    entry.date.getFullYear() === year && entry.date.getMonth() === month
  );

  // Check if current view is a future month (after today's month)
  const today = new Date();
  const isFutureMonth = year > today.getFullYear() || 
    (year === today.getFullYear() && month > today.getMonth());
  
  // Check if user has an entry for today
  const hasTodayEntry = entries.some(entry => {
    const entryDate = entry.date;
    return entryDate.getFullYear() === today.getFullYear() &&
      entryDate.getMonth() === today.getMonth() &&
      entryDate.getDate() === today.getDate();
  });
  
  // Only show empty state if:
  // 1. Not a future month
  // 2. Current month has no entries
  // 3. If viewing current month and today has no entry yet
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
  const shouldShowEmptyState = !hasAnyEntries && !isFutureMonth && isCurrentMonth && !hasTodayEntry;

  const getDateKey = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const handleDayLongPress = (day: number) => {
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(new Date(year, month, day));
    console.log(`selectedDate set to ${dateKey}`);
    setShowCustomizeModal(true);
  };

  const handleDecorateClick = () => {
    const key = selectedDate
      ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`
      : null;
    console.log("Opening Customize Calendar. selectedDate:", key);
    setShowCustomizeModal(true);
  };

  const getThemeClasses = () => {
    // Birthday theme overrides all other themes
    if (isBirthday) {
      return "relative";
    }
    const theme = settings.theme;
    if (theme === "pawprint") {
      return "relative";
    }
    return themeConfigs[theme].bg;
  };

  // Get theme-based shadow for the calendar card
  const getCalendarShadow = () => {
    // Birthday theme uses a special celebratory shadow
    if (isBirthday) {
      return '0 8px 25px -5px hsl(340 80% 60% / 0.15), 0 4px 10px -4px hsl(45 90% 50% / 0.1), inset 0 1px 0 hsl(0 0% 100% / 0.8)';
    }
    return themeConfigs[settings.theme].shadow;
  };


  // Lock calendar if no active subscription (returning users must resubscribe)
  const isLocked = !hasActiveSubscription;

  const handleUnlock = () => {
    onNavigateToProfile?.(true);
  };

  return (
    <div className={cn("h-full overflow-hidden pb-24 relative flex flex-col", getThemeClasses())}>
      {/* Birthday Theme Background - only background layer, no decorations/banner */}
      {isBirthday && <BirthdayThemeBackground />}
      
      {/* Pawprint pattern overlay - only shows when NOT birthday */}
      {!isBirthday && settings.theme === "pawprint" && (
        <div 
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill='%23b87333'%3E%3Cellipse cx='30' cy='38' rx='8' ry='10'/%3E%3Ccircle cx='20' cy='26' r='5'/%3E%3Ccircle cx='40' cy='26' r='5'/%3E%3Ccircle cx='16' cy='36' r='4'/%3E%3Ccircle cx='44' cy='36' r='4'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}
        />
      )}
      {/* Header - light ambient feel, part of the background */}
      <header className="relative px-5 pt-10 pb-5 z-10">
        {/* Soft ambient glow behind header */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, hsl(25 50% 75% / 0.12) 0%, transparent 70%)",
            filter: "blur(30px)",
          }}
        />
        
        <div className="flex items-center justify-between">
          <div>
            <h1 
              className="text-3xl font-extrabold text-foreground tracking-tight"
              style={{
                textShadow: "0px -1px 0px hsl(0 0% 100% / 0.6), 0px 2px 5px hsl(25 30% 25% / 0.14)",
              }}
            >
              {t("calendarTitle")}
            </h1>
            <p className="text-xs text-muted-foreground/80 mt-0.5">{t("calendarSubtitle")}</p>
          </div>
          
          {/* Secondary Actions - Mood Report & Decorate */}
          <div className="flex items-center gap-2">
            <button
              data-calendar-control="true"
              onClick={handleDecorateClick}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all active:scale-[0.97] bg-card/90 backdrop-blur-sm border border-border/40"
              style={{
                boxShadow: '0 2px 6px -1px hsl(25 20% 30% / 0.08), inset 0 1px 0 hsl(0 0% 100% / 0.6)',
              }}
            >
              <Palette className="w-3.5 h-3.5 text-primary/70" />
              <span className="text-[11px] font-semibold text-foreground/80">Decorate</span>
            </button>
            
            <button
              data-calendar-control="true"
              onClick={onOpenReport}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all active:scale-[0.97] bg-card/90 backdrop-blur-sm border border-border/40"
              style={{
                boxShadow: '0 2px 6px -1px hsl(25 20% 30% / 0.08), inset 0 1px 0 hsl(0 0% 100% / 0.6)',
              }}
            >
              <BarChart3 className="w-3.5 h-3.5 text-primary/70" />
              <span className="text-[11px] font-semibold text-foreground/80">Report</span>
            </button>
          </div>
        </div>
      </header>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {/* Calendar Card with integrated header */}
      {!loading && (
        <>
          <div className="relative px-4">
            {/* Lock wrapper - contains both calendar and lock overlay */}
            <div className="relative">
              {/* Calendar module container - visible but non-interactive when locked (teaser preview) */}
              <div
                ref={calendarCardRef}
                className={cn(
                  "relative z-10 rounded-3xl overflow-hidden ring-1 ring-border/40",
                  isLocked && "opacity-70 pointer-events-none"
                )}
                style={{
                  boxShadow: getCalendarShadow(),
                  filter: isLocked ? "blur(1px)" : undefined,
                }}
              >
                <MonthCarousel
                  currentDate={currentDate}
                  onDateChange={handleDateChange}
                  entries={entries}
                  filteredEntries={entries}
                  searchQuery=""
                  signupDate={signupDate}
                  selectedDay={selectedDay}
                  onDayClick={handleDayClick}
                  onDayLongPress={handleDayLongPress}
                  getUnreadCountForDate={getUnreadCountForDate}
                  showMonthPicker={showMonthPicker}
                  onToggleMonthPicker={() => setShowMonthPicker(!showMonthPicker)}
                  onCloseMonthPicker={() => setShowMonthPicker(false)}
                  signupDateForPicker={signupDateForPicker}
                  onBackgroundPress={clearSelection}
                  streakCount={streakCount}
                  totalRecords={totalRecords}
                  shouldShowStreak={shouldShowStreak}
                  showHint={shouldShowHint}
                  petName={pet?.name}
                  instantChange={instantChange}
                  birthdayDates={[...TEST_BIRTHDAY_DATES]} // Test dates: Jan 2 and Jan 28 only
                />
              </div>

              {/* Locked Overlay - positioned over the calendar module */}
              {isLocked && (
                <div
                  className="absolute inset-0 z-20 rounded-3xl overflow-visible cursor-pointer"
                  onClick={handleUnlock}
                >
                  <UnifiedLockOverlay onUnlock={handleUnlock} isReturningUser={isReturningUser} />
                </div>
              )}
            </div>
          </div>

        </>
      )}

      {/* Empty State - compact card, only shows when today has no entry */}
      {!loading && isCurrentMonth && !hasTodayEntry && onNavigateToCamera && (
        <div className={cn(
          "px-4 mt-6 relative transition-opacity duration-150",
          showMonthPicker ? "opacity-40 pointer-events-none" : "z-10"
        )}>
          <div 
            className="bg-card/80 backdrop-blur-sm rounded-2xl px-4 py-[11px] border border-border/30"
            style={{
              boxShadow: '0 2px 8px -2px hsl(25 20% 30% / 0.08), inset 0 1px 0 hsl(0 0% 100% / 0.5)',
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-foreground">No memories yet today... 💕</p>
              <Button 
                onClick={onNavigateToCamera} 
                size="sm" 
                className="h-[30px] px-3 text-xs rounded-lg flex-shrink-0 gap-1.5 min-h-0"
              >
                <Camera className="w-3.5 h-3.5" />
                Take photo
              </Button>
            </div>
          </div>
        </div>
      )}


      {/* Full Screen Mood Viewer - on close, sync calendar to viewed date */}
      {selectedEntry && selectedDay && (
        <FullScreenMoodViewer
          allEntries={entries}
          initialDateKey={getDateKey(selectedDay)}
          onPreClose={async (dateKey) => {
            // Parse the date key
            const [yearStr, monthStr, dayStr] = dateKey.split('-');
            const newYear = parseInt(yearStr, 10);
            const newMonth = parseInt(monthStr, 10) - 1; // 0-indexed
            const newDay = parseInt(dayStr, 10);
            
            // Enable instant change mode to skip month transition animation
            setInstantChange(true);
            
            // Update calendar state BEFORE animation
            if (newYear !== year || newMonth !== month) {
              setCurrentDate(new Date(newYear, newMonth, 1));
            }
            setSelectedDate(new Date(newYear, newMonth, newDay));
            
            // Wait for React to render the new month, then find the target cell
            return new Promise((resolve) => {
              // Use multiple frames to ensure calendar has rendered with no animation
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  requestAnimationFrame(() => {
                    // Find the target cell by dateKey
                    const targetCell = document.querySelector(
                      `[data-calendar-date-key="${dateKey}"]`
                    );
                    if (targetCell) {
                      // Find the photo container inside the cell
                      const photoContainer = targetCell.querySelector('.w-8.h-8.rounded-full');
                      if (photoContainer) {
                        resolve(photoContainer.getBoundingClientRect());
                        return;
                      }
                      resolve(targetCell.getBoundingClientRect());
                    } else {
                      resolve(null);
                    }
                  });
                });
              });
            });
          }}
          onClose={(finalDateKey) => {
            setSelectedEntry(null);
            // Reset instant change mode
            setInstantChange(false);
            // Final sync if needed (for cases where pre-close wasn't called)
            if (finalDateKey) {
              const [yearStr, monthStr, dayStr] = finalDateKey.split('-');
              const newYear = parseInt(yearStr, 10);
              const newMonth = parseInt(monthStr, 10) - 1;
              const newDay = parseInt(dayStr, 10);
              
              if (newYear !== year || newMonth !== month) {
                setCurrentDate(new Date(newYear, newMonth, 1));
              }
              setSelectedDate(new Date(newYear, newMonth, newDay));
            }
          }}
          moodEntries={moodEntries}
          uploadImage={uploadImage}
          analyzeMood={analyzeMood}
          createEntry={createEntry}
          deleteEntry={deleteEntry}
          onReplace={handleReplacePhoto}
          hasCredits={analysisCount > 0}
          isPremium={isPremium}
          onNavigateToProfile={onNavigateToProfile}
        />
      )}

      {/* Calendar Customization Modal */}
      <CalendarCustomizeModal
        isOpen={showCustomizeModal}
        onClose={() => {
          setShowCustomizeModal(false);
          // Do not reset selectedDate here - keep the selection
        }}
        selectedDate={selectedDate ?? undefined}
      />

      {/* Day Decoration Modal */}
      {decorationDay && (
        <DayDecorationModal
          isOpen={!!decorationDay}
          onClose={() => setDecorationDay(null)}
          dateKey={decorationDay.key}
          dateLabel={decorationDay.label}
        />
      )}

      {/* Birthday Modal - shows once per day on pet's birthday */}
      <BirthdayModal
        isOpen={showBirthdayModal}
        onClose={handleCloseBirthdayModal}
        petName={pet?.name}
      />
    </div>
  );
}