import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import html2canvas from "html2canvas";
import { cn } from "@/lib/utils";
import { CountUpNumber } from "./CountUpNumber";
import { ReportData, ReportPeriod } from "./ReportTypes";
import { FallingPhotos } from "./FallingPhotos";
import { TopPercentageScene } from "./TopPercentageScene";
import { SharePreviewSheet } from "./SharePreviewSheet";
import { IntroTitleBlock } from "./IntroTitleBlock";
import { Pause, Play, ChevronLeft, ChevronRight, X } from "lucide-react";
import { MoodEntry } from "@/hooks/useMoodEntries";
import { useWeeklyHeroPhoto } from "@/hooks/useWeeklyHeroPhoto";
import { useLanguage } from "@/contexts/LanguageContext";
interface ReportScenesProps {
  data: ReportData;
  period: ReportPeriod;
  petName: string;
  onClose: () => void;
  isLoading?: boolean;
  entries: MoodEntry[];
}

interface Scene {
  id: string;
  duration: number;
  render: () => React.ReactNode;
  background: string; // CSS gradient/color for this scene
}

// Mood color mapping for consistent theming
type MoodColorTheme = {
  primary: string;    // Main HSL values
  secondary: string;  // Secondary HSL values
};

const MOOD_COLOR_MAP: Record<string, MoodColorTheme> = {
  playful: { primary: "50 85% 88%", secondary: "45 80% 85%" },         // Yellow
  happy: { primary: "30 80% 90%", secondary: "35 75% 87%" },           // Light Orange
  joyful: { primary: "30 80% 90%", secondary: "35 75% 87%" },          // Light Orange
  content: { primary: "35 45% 93%", secondary: "40 40% 91%" },         // Beige / Cream
  relaxed: { primary: "35 45% 93%", secondary: "40 40% 91%" },         // Beige / Cream
  curious: { primary: "165 45% 90%", secondary: "170 40% 88%" },       // Mint / Light Teal
  alert: { primary: "165 45% 90%", secondary: "170 40% 88%" },         // Mint / Light Teal
  calm: { primary: "220 45% 92%", secondary: "250 40% 90%" },          // Soft Blue / Lavender
  peaceful: { primary: "220 45% 92%", secondary: "250 40% 90%" },      // Soft Blue / Lavender
  excited: { primary: "40 75% 88%", secondary: "35 70% 85%" },         // Warm Yellow-Orange
  energetic: { primary: "40 75% 88%", secondary: "35 70% 85%" },       // Warm Yellow-Orange
  tired: { primary: "260 35% 92%", secondary: "270 30% 90%" },         // Soft Lavender
  sleepy: { primary: "260 35% 92%", secondary: "270 30% 90%" },        // Soft Lavender
  anxious: { primary: "210 40% 92%", secondary: "220 35% 90%" },       // Cool Blue
  worried: { primary: "210 40% 92%", secondary: "220 35% 90%" },       // Cool Blue
};

function getMoodColor(mood: string): MoodColorTheme {
  const moodLower = mood.toLowerCase();
  for (const [key, theme] of Object.entries(MOOD_COLOR_MAP)) {
    if (moodLower.includes(key)) return theme;
  }
  // Default warm tone
  return { primary: "35 50% 92%", secondary: "30 45% 90%" };
}

// SECTION 2 — Moment Count: Background based on count range
function getMomentCountBackground(count: number): string {
  if (count >= 20) {
    // Celebratory warm gradient (orange + peach, brighter)
    return "linear-gradient(135deg, hsl(30 90% 90%) 0%, hsl(25 85% 85%) 50%, hsl(35 80% 88%) 100%)";
  } else if (count >= 15) {
    // Energetic orange gradient (high activity)
    return "linear-gradient(135deg, hsl(28 80% 90%) 0%, hsl(32 75% 87%) 100%)";
  } else if (count >= 10) {
    // Peach / coral tone (very active)
    return "linear-gradient(135deg, hsl(20 70% 92%) 0%, hsl(18 65% 89%) 100%)";
  } else if (count >= 5) {
    // Warm light orange (active)
    return "linear-gradient(135deg, hsl(32 55% 94%) 0%, hsl(28 50% 92%) 100%)";
  } else {
    // Soft neutral beige / light cream (low activity: 1-4)
    return "linear-gradient(135deg, hsl(38 28% 96%) 0%, hsl(35 22% 94%) 100%)";
  }
}

// SECTION 3 — Mood Breakdown: Dominant + Weighted Color Blend
function getMoodBreakdownBackground(moodPercentages: Array<{ mood: string; percentage: number }>): string {
  if (moodPercentages.length === 0) {
    // Fallback neutral
    return "linear-gradient(180deg, hsl(40 25% 97%) 0%, hsl(35 20% 95%) 100%)";
  }

  // Get dominant mood (highest %) - use as primary (60-70%)
  const dominant = moodPercentages[0];
  const dominantColor = getMoodColor(dominant.mood);
  
  // If only one mood or dominant is overwhelming (>80%), use single color gradient
  if (moodPercentages.length === 1 || dominant.percentage > 80) {
    return `linear-gradient(180deg, hsl(${dominantColor.primary}) 0%, hsl(${dominantColor.secondary}) 100%)`;
  }
  
  // Get secondary moods for subtle blending (top 2-3 non-dominant)
  const secondaryMoods = moodPercentages.slice(1, 3).filter(m => m.percentage >= 10);
  
  if (secondaryMoods.length === 0) {
    // Only dominant matters
    return `linear-gradient(180deg, hsl(${dominantColor.primary}) 0%, hsl(${dominantColor.secondary}) 100%)`;
  }
  
  // Create a blended gradient with dominant as primary
  // Dominant color covers center, secondary tints at edges
  const secondaryColor = getMoodColor(secondaryMoods[0].mood);
  
  // Radial-style blend: dominant at center, secondary as subtle edge tint
  return `linear-gradient(180deg, hsl(${dominantColor.primary}) 0%, hsl(${dominantColor.secondary}) 70%, hsl(${secondaryColor.primary} / 0.3) 100%)`;
}

// SECTION 4 — Highlight / Top Percentile: Single mood color only
function getMoodHighlightBackground(mood: string): string {
  const moodLower = mood.toLowerCase();
  
  if (moodLower.includes('playful')) {
    // Yellow
    return "linear-gradient(135deg, hsl(50 85% 90%) 0%, hsl(48 80% 87%) 100%)";
  } else if (moodLower.includes('happy') || moodLower.includes('joyful')) {
    // Orange
    return "linear-gradient(135deg, hsl(30 85% 90%) 0%, hsl(28 80% 87%) 100%)";
  } else if (moodLower.includes('content') || moodLower.includes('relaxed')) {
    // Beige
    return "linear-gradient(135deg, hsl(35 50% 94%) 0%, hsl(38 45% 91%) 100%)";
  } else if (moodLower.includes('curious') || moodLower.includes('alert')) {
    // Mint
    return "linear-gradient(135deg, hsl(165 50% 90%) 0%, hsl(168 45% 87%) 100%)";
  } else if (moodLower.includes('calm') || moodLower.includes('peaceful')) {
    // Soft Blue / Lavender
    return "linear-gradient(135deg, hsl(220 50% 92%) 0%, hsl(250 45% 90%) 100%)";
  } else if (moodLower.includes('excited') || moodLower.includes('energetic')) {
    // Warm Yellow-Orange
    return "linear-gradient(135deg, hsl(40 80% 90%) 0%, hsl(38 75% 87%) 100%)";
  } else if (moodLower.includes('tired') || moodLower.includes('sleepy')) {
    // Soft Lavender
    return "linear-gradient(135deg, hsl(260 40% 92%) 0%, hsl(265 35% 90%) 100%)";
  }
  
  // Default warm tone
  return "linear-gradient(135deg, hsl(35 55% 92%) 0%, hsl(30 50% 90%) 100%)";
}

// SECTION 5 — Advice: Strong color shift based on advice TONE (ignores mood)
// Maps advice category to distinct background
type AdviceTone = 'comfort' | 'encouragement' | 'guidance' | 'balance';

function getAdviceTone(mood: string): AdviceTone {
  const moodLower = mood.toLowerCase();
  
  // Comfort / Safety / Love / Bonding
  if (moodLower.includes('calm') || moodLower.includes('peaceful') || 
      moodLower.includes('relaxed') || moodLower.includes('content') ||
      moodLower.includes('sleepy') || moodLower.includes('tired')) {
    return 'comfort';
  }
  
  // Encouragement / Motivation / Positive Reinforcement
  if (moodLower.includes('happy') || moodLower.includes('joyful') || 
      moodLower.includes('playful') || moodLower.includes('excited') ||
      moodLower.includes('energetic')) {
    return 'encouragement';
  }
  
  // Guidance / Suggestion / Instruction
  if (moodLower.includes('curious') || moodLower.includes('alert')) {
    return 'guidance';
  }
  
  // Balance / Caution / Slow Down
  if (moodLower.includes('anxious') || moodLower.includes('worried')) {
    return 'balance';
  }
  
  // Default to encouragement
  return 'encouragement';
}

function getAdviceBackground(mood: string): string {
  const tone = getAdviceTone(mood);
  
  switch (tone) {
    case 'comfort':
      // Lavender / Soft Blue — calming, safety-focused
      return "linear-gradient(180deg, hsl(240 45% 94%) 0%, hsl(220 40% 91%) 100%)";
    case 'encouragement':
      // Yellow / Bright Warm Orange — motivating, positive
      return "linear-gradient(180deg, hsl(45 80% 92%) 0%, hsl(35 75% 88%) 100%)";
    case 'guidance':
      // Mint / Sage Green — instructive, forward-looking
      return "linear-gradient(180deg, hsl(150 40% 92%) 0%, hsl(145 35% 89%) 100%)";
    case 'balance':
      // Cool Gray / Blue-Gray — calming caution
      return "linear-gradient(180deg, hsl(210 25% 92%) 0%, hsl(215 20% 88%) 100%)";
    default:
      return "linear-gradient(180deg, hsl(40 50% 94%) 0%, hsl(35 45% 92%) 100%)";
  }
}

// Fallback outro background (used when no locked background exists)
function getOutroBackgroundFallback(): string {
  const outroBackgrounds = [
    "linear-gradient(135deg, hsl(30 60% 94%) 0%, hsl(35 55% 91%) 100%)", // Warm peach
    "linear-gradient(135deg, hsl(45 50% 94%) 0%, hsl(40 45% 92%) 100%)", // Soft cream
    "linear-gradient(135deg, hsl(25 65% 93%) 0%, hsl(20 60% 90%) 100%)", // Light coral
    "linear-gradient(135deg, hsl(35 55% 95%) 0%, hsl(30 50% 93%) 100%)", // Gentle beige
    "linear-gradient(135deg, hsl(15 70% 94%) 0%, hsl(20 65% 91%) 100%)", // Soft apricot
  ];
  
  // Use a pseudo-random but stable selection based on current timestamp minutes
  const index = Math.floor(Date.now() / 60000) % outroBackgrounds.length;
  return outroBackgrounds[index];
}

export function ReportScenes({
  data,
  period,
  petName,
  onClose,
  isLoading = false,
  entries,
}: ReportScenesProps) {
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [countAnimationDone, setCountAnimationDone] = useState(false);
  const [showSharePreview, setShowSharePreview] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const reportContainerRef = useRef<HTMLDivElement>(null);
  
  // Capture the current report scene as a screenshot and open share preview
  const handleOpenShare = useCallback(async () => {
    const container = reportContainerRef.current;
    if (!container) return;

    // Temporarily hide controls for a clean capture
    const controlEls = container.querySelectorAll<HTMLElement>("[data-report-controls]");
    controlEls.forEach((el) => {
      el.style.visibility = "hidden";
    });

    try {
      const canvas = await html2canvas(container, {
        useCORS: true,
        allowTaint: true,
        scale: 2, // High-res capture
        backgroundColor: null,
        logging: false,
        width: container.offsetWidth,
        height: container.offsetHeight,
      });

      const dataUrl = canvas.toDataURL("image/png", 1.0);
      setCapturedImage(dataUrl);
      setShowSharePreview(true);
    } catch (error) {
      console.error("Failed to capture report scene:", error);
    } finally {
      // Restore controls
      controlEls.forEach((el) => {
        el.style.visibility = "";
      });
    }
  }, []);
  
  // Entrance animation stages - only for intro screen (index 0)
  const [entranceStage, setEntranceStage] = useState<"expanding" | "image" | "title" | "subtitle" | "progress" | "controls" | "complete">("expanding");

  // Collect all image URLs for animations
  const allImageUrls = data.moodPercentages.flatMap(m => m.imageUrls || []);
  
  // Use persistent weekly hero photo selection
  // This photo and outro background are fixed once the 5/5 threshold is reached
  const { heroPhotoUrl, lockedOutroBackground, isImagePreloaded } = useWeeklyHeroPhoto(entries, data.hasEnoughData);

  // Intro entrance should only start once the hero image exists AND is ready.
  // Otherwise the photo mounts after the entrance finishes, which removes the “small → big” animation.
  const introReady = !!heroPhotoUrl && isImagePreloaded;

  // Memoize outro background: use locked background if available, otherwise fallback
  const outroBackground = useMemo(() => {
    return lockedOutroBackground || getOutroBackgroundFallback();
  }, [lockedOutroBackground]);

  // Entrance animation sequence - runs on mount
  // Using a ref to track if animation has started to avoid cleanup issues
  const entranceStarted = useRef(false);
  
  useEffect(() => {
    // Skip if already started
    if (entranceStarted.current) {
      return;
    }

    // Wait until the hero photo is available + preloaded so the entrance can actually animate.
    if (!introReady) return;
    
    // Mark as started
    entranceStarted.current = true;
    
    // Use requestAnimationFrame for smoother animation scheduling
    const rafId = requestAnimationFrame(() => {
      setEntranceStage("image");
      setTimeout(() => setEntranceStage("title"), 250);
      setTimeout(() => setEntranceStage("subtitle"), 400);
      setTimeout(() => setEntranceStage("progress"), 550);
      setTimeout(() => setEntranceStage("controls"), 700);
      setTimeout(() => setEntranceStage("complete"), 850);
    });
    
    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [introReady]);

  // Build scenes based on data (screens 2-5 use live data, screen 1 and outro use locked visuals)
  const scenes: Scene[] = [
    // Section 1 — Intro: Keep current background (default gradient)
    {
      id: "intro",
      duration: 4000,
      background: "linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--background)) 100%)", // Keep as-is
      render: () => (
        <div className="flex flex-col items-center justify-center h-full text-center px-8">
          {/* Pet photo with optimized entrance animation */}
          {heroPhotoUrl && (
            <div 
              className="mb-8 relative"
              style={{
                width: '160px',
                height: '160px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Photo container with GPU-accelerated animation */}
              <div 
                className="relative"
                style={{
                  transition: 'opacity 300ms ease-out, transform 400ms cubic-bezier(0.22, 1, 0.36, 1)',
                  opacity: entranceStage === "expanding" ? 0 : 1,
                  transform: entranceStage === "expanding" 
                    ? 'scale(0.85)' 
                    : 'scale(1)',
                  willChange: 'opacity, transform',
                }}
              >
                <div className="w-40 h-40 rounded-full overflow-hidden shadow-2xl ring-4 ring-primary/20">
                  <img
                    src={heroPhotoUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    draggable={false}
                    style={{ 
                      imageRendering: 'auto',
                      backfaceVisibility: 'hidden',
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
                {/* Subtle glow - reduced blur for performance */}
                <div 
                  className="absolute inset-0 rounded-full bg-primary/15 blur-xl -z-10"
                  style={{
                    transform: 'scale(1.3)',
                    opacity: entranceStage === "expanding" ? 0 : 0.7,
                    transition: 'opacity 400ms ease-out',
                  }}
                />
              </div>
            </div>
          )}
          
          {/* Dynamic title block - measures rendered width and chooses one or two line layout */}
          <IntroTitleBlock petName={petName} entranceStage={entranceStage} />
          
          {/* Subtitle with staggered fade */}
          <p 
            className="text-lg text-muted-foreground"
            style={{
              transition: 'opacity 400ms cubic-bezier(0.33, 0, 0.2, 1), transform 400ms cubic-bezier(0.33, 0, 0.2, 1)',
              opacity: entranceStage === "expanding" || entranceStage === "image" || entranceStage === "title" ? 0 : 1,
              transform: entranceStage === "expanding" || entranceStage === "image" || entranceStage === "title"
                ? 'translateY(10px) scale(0.98)'
                : 'translateY(0) scale(1)',
            }}
          >
            {t("reportLetsSeeCaptured")} ✨
          </p>
        </div>
      ),
    },
    // Section 2 — Moment Count: Background based on number of moments
    {
      id: "total",
      duration: 5000,
      background: getMomentCountBackground(data.totalEntries),
      render: () => (
        <div className="relative flex flex-col items-center justify-center h-full text-center px-8">
          <FallingPhotos 
            imageUrls={data.periodImageUrls}
            count={data.totalEntries}
            active={currentIndex === 1}
            runId={currentIndex}
          />
          
          <p className="text-lg text-muted-foreground mb-4 relative z-20">{t("reportYouCaptured")}</p>
          <div className="text-7xl font-bold text-primary mb-4 relative z-20">
            <CountUpNumber 
              value={data.totalEntries} 
              duration={1800}
            />
          </div>
          <p className="text-xl text-foreground relative z-20">
            {t("reportMoodMoments")} {period === "weekly" ? t("reportThisWeek").toLowerCase() : period === "monthly" ? t("january").toLowerCase() : t("january").toLowerCase()}
          </p>
        </div>
      ),
    },
    // Section 3 — Mood Breakdown: Dominant + Weighted Color Blend
    ...(data.moodPercentages.length > 0 ? [{
      id: "breakdown",
      duration: 6000,
      background: getMoodBreakdownBackground(data.moodPercentages),
      render: () => (
        <div className="flex flex-col w-full pt-4">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
            {t("reportMoodBreakdown")}
          </h2>
          {/* Content with natural layout - will scroll with page if needed */}
          <div className="w-full space-y-5 pl-4 pr-6">
            {data.moodPercentages.slice(0, 4).map((mood, index) => (
              <div 
                key={mood.mood} 
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="flex items-center gap-2 mb-2 min-w-0">
                  <span className="flex-1 text-foreground font-medium truncate text-sm">{mood.mood}</span>
                  <span className="text-primary font-bold text-sm flex-shrink-0">
                    <CountUpNumber value={mood.percentage} suffix="%" duration={1000 + index * 200} />
                  </span>
                </div>
                
                <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
                  <div 
                    className="h-full bg-primary/70 rounded-full"
                    style={{ width: `${mood.percentage}%` }}
                  />
                </div>
                
                {mood.imageUrls && mood.imageUrls.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {mood.imageUrls.map((url, imgIndex) => (
                      <div
                        key={imgIndex}
                        className="flex-shrink-0 w-11 h-11 rounded-lg overflow-hidden bg-muted/50 shadow-sm"
                        style={{ 
                          animationDelay: `${index * 150 + imgIndex * 50}ms`,
                        }}
                      >
                        <img
                          src={url}
                          alt=""
                          className="w-full h-full object-cover pointer-events-none select-none"
                          draggable={false}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Bottom spacing to keep content clear of navigation */}
          <div className="mb-20" />
        </div>
      ),
    }] : []),
    // Section 4 — Top Percentage / Highlight: Background based on dominant mood
    {
      id: "top-percentage",
      duration: 5000,
      background: getMoodHighlightBackground(data.dominantMood.mood),
      render: () => (
        <TopPercentageScene
          dominantMood={data.dominantMood}
          petName={petName}
          period={period}
          heroImageUrl={heroPhotoUrl}
          onShare={() => handleOpenShare()}
        />
      ),
    },
    // Section 5 — Advice: Background based on advice tone
    {
      id: "advice",
      duration: 5000,
      background: getAdviceBackground(data.dominantMood.mood),
      render: () => {
        const advice = getAdviceText(data, period, petName);
        return (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            {/* Lightbulb with scale-in + triple slow breathing glow */}
            <div 
              className="text-5xl mb-6 animate-[advice-bulb-entrance_0.5s_ease-out_forwards,advice-pulse-glow_3.9s_ease-in-out_0.6s_1]"
              style={{ opacity: 0 }}
            >
              💡
            </div>
            {/* Title with upward reveal */}
            <h2 
              className="text-xl font-semibold text-foreground mb-4 animate-[advice-title-reveal_0.5s_ease-out_0.3s_forwards]"
              style={{ opacity: 0, transform: 'translateY(12px)' }}
            >
              {t("reportAdviceTitle")}
            </h2>
            {/* Body text with clean fade + upward reveal (no blur) */}
            <p 
              className="text-lg text-muted-foreground leading-relaxed max-w-sm animate-[advice-body-reveal_0.3s_ease-out_0.55s_forwards]"
              style={{ opacity: 0, transform: 'translateY(10px)' }}
            >
              {advice}
            </p>
          </div>
        );
      },
    },
    // Section 6 — Outro: Random background from approved palette
    {
      id: "outro",
      duration: 5000,
      background: outroBackground,
      render: () => (
        <div className="flex flex-col items-center justify-center h-full text-center px-8">
          <div className="text-6xl mb-6 animate-wiggle">🐾</div>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            {t("reportKeepMomentsComing")}
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            {t("reportEverySnapshot")}
          </p>
          <button
            onClick={onClose}
            className={cn(
              "py-3 px-8 rounded-2xl",
              "bg-primary text-primary-foreground",
              "font-semibold text-base",
              "shadow-warm-lg",
              "transform hover:scale-[1.02] active:scale-[0.98]",
              "transition-all duration-200"
            )}
          >
            {t("reportDone")}
          </button>
        </div>
      ),
    },
  ];

  // Ref to track elapsed time persistently across pause/resume cycles
  const elapsedRef = useRef(0);
  
  // Reset elapsed time when scene changes
  useEffect(() => {
    elapsedRef.current = 0;
  }, [currentIndex]);

  // Auto-advance timer - pauses when isPaused OR when share preview is open
  useEffect(() => {
    // Pause progress when user pauses OR when share modal is open (internal pause)
    const shouldPause = isPaused || showSharePreview;
    if (shouldPause || currentIndex >= scenes.length) return;

    const currentScene = scenes[currentIndex];
    const interval = 50;

    const timer = setInterval(() => {
      elapsedRef.current += interval;
      const newProgress = (elapsedRef.current / currentScene.duration) * 100;
      setProgress(newProgress);

      if (elapsedRef.current >= currentScene.duration) {
        if (currentIndex < scenes.length - 1) {
          setCurrentIndex(prev => prev + 1);
          setProgress(0);
          elapsedRef.current = 0;
        }
        clearInterval(timer);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [currentIndex, isPaused, showSharePreview, scenes.length]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
    }
  }, [currentIndex]);

  const goToNext = useCallback(() => {
    if (currentIndex < scenes.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    }
  }, [currentIndex, scenes.length]);

  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  const currentScene = scenes[currentIndex];

  // Calculate entrance stage indices for staggered animations
  const stageIndex = ["expanding", "image", "title", "subtitle", "progress", "controls", "complete"].indexOf(entranceStage);
  const progressVisible = stageIndex >= 4;
  const controlsVisible = stageIndex >= 5;

  return (
    <div 
      ref={reportContainerRef}
      className="fixed inset-0 z-50 overflow-hidden"
      style={{
        // Full-bleed background from start - no container scaling
        background: currentScene.background,
      }}
    >
      {/* Smooth background crossfade layer */}
      <div 
        className="absolute inset-0 transition-opacity duration-700 ease-out"
        style={{
          background: currentScene.background,
        }}
      />
      
      {/* Entrance fade overlay - fades OUT to reveal content (no box/scale animation) */}
      <div 
        className={cn(
          "absolute inset-0 bg-background pointer-events-none transition-opacity duration-500 ease-out",
          entranceStage === "expanding" ? "opacity-100" : "opacity-0"
        )}
        style={{ zIndex: 1 }}
      />
      
      {/* Subtle floating orbs for depth - always present, fade in smoothly */}
      <div 
        className={cn(
          "absolute inset-0 overflow-hidden pointer-events-none transition-opacity duration-700 ease-out",
          entranceStage === "expanding" ? "opacity-0" : "opacity-100"
        )}
      >
        <div 
          className="absolute w-[600px] h-[600px] rounded-full blur-3xl opacity-10"
          style={{
            background: "hsl(var(--primary))",
            top: "-200px",
            right: "-200px",
            animation: "float 8s ease-in-out infinite",
          }}
        />
        <div 
          className="absolute w-[400px] h-[400px] rounded-full blur-3xl opacity-8"
          style={{
            background: "hsl(var(--accent))",
            bottom: "-100px",
            left: "-100px",
            animation: "float 6s ease-in-out infinite reverse",
          }}
        />
      </div>

      {/* Top bar with close button above progress */}
      <div data-report-controls className="absolute top-0 left-0 right-0 pt-8 px-4 z-20">
        {/* Close button row */}
        <div 
          className={cn(
            "flex items-center justify-start mb-5 transition-all duration-500 ease-out",
            progressVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
          )}
        >
          <button
            onClick={onClose}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              "bg-foreground/10 backdrop-blur-sm",
              "hover:bg-foreground/20 active:scale-95",
              "transition-all duration-200"
            )}
            aria-label="Close report"
          >
            <X className="w-4 h-4 text-foreground" />
          </button>
        </div>
        
        {/* Progress bars row - fade + subtle slide down with content */}
        <div className="flex gap-1.5">
          {scenes.map((scene, index) => (
            <div 
              key={scene.id}
              className={cn(
                "flex-1 h-1 bg-muted/40 rounded-full overflow-hidden",
                "transition-all duration-300 ease-out"
              )}
              style={{
                opacity: progressVisible ? 1 : 0,
                transform: progressVisible ? "translateY(0) scale(1)" : "translateY(-2px) scale(0.98)",
                transitionDelay: progressVisible ? `${50 + index * 30}ms` : "0ms"
              }}
            >
              <div 
                className="h-full bg-primary rounded-full transition-all duration-100"
                style={{
                  width: index < currentIndex 
                    ? "100%" 
                    : index === currentIndex 
                      ? `${progress}%` 
                      : "0%"
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Scene content */}
      <div className="relative h-full pt-28 pb-36 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full flex justify-center">
            {currentScene.render()}
          </div>
        </div>
      </div>

      {/* Controls - slide up + fade with delay */}
      <div 
        data-report-controls
        className={cn(
          "absolute bottom-0 left-0 right-0 p-6 pb-14 flex items-center justify-between z-10 px-10",
          "transition-all duration-500 ease-out",
          controlsVisible 
            ? "opacity-100 translate-y-0" 
            : "opacity-0 translate-y-6"
        )}
      >
        <button
          onClick={goToPrevious}
          disabled={currentIndex === 0}
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center",
            "bg-muted/60 backdrop-blur-sm",
            "disabled:opacity-30 disabled:cursor-not-allowed",
            "transition-all duration-200"
          )}
        >
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>

        <button
          onClick={togglePause}
          className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center",
            "bg-primary text-primary-foreground",
            "shadow-warm-lg",
            "transition-all duration-200"
          )}
        >
          {isPaused ? (
            <Play className="w-6 h-6 ml-0.5" />
          ) : (
            <Pause className="w-6 h-6" />
          )}
        </button>

        <button
          onClick={goToNext}
          disabled={currentIndex === scenes.length - 1}
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center",
            "bg-muted/60 backdrop-blur-sm",
            "disabled:opacity-30 disabled:cursor-not-allowed",
            "transition-all duration-200"
          )}
        >
          <ChevronRight className="w-6 h-6 text-foreground" />
        </button>
      </div>

      {/* Custom animations */}
      <style>{`
        @keyframes gradient-shift {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(5deg); }
        }
        @keyframes advice-bulb-entrance {
          0% { opacity: 0; transform: scale(0.85); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes advice-pulse-glow {
          /* 3 slow breathing pulses: each ~900ms glow + ~300ms pause = ~1300ms per cycle × 3 = 3900ms */
          0% { filter: drop-shadow(0 0 0px hsl(var(--primary) / 0)); }
          11.5% { filter: drop-shadow(0 0 18px hsl(var(--primary) / 0.5)); }
          23% { filter: drop-shadow(0 0 0px hsl(var(--primary) / 0)); }
          30.8% { filter: drop-shadow(0 0 0px hsl(var(--primary) / 0)); }
          42.3% { filter: drop-shadow(0 0 18px hsl(var(--primary) / 0.5)); }
          53.8% { filter: drop-shadow(0 0 0px hsl(var(--primary) / 0)); }
          61.5% { filter: drop-shadow(0 0 0px hsl(var(--primary) / 0)); }
          73% { filter: drop-shadow(0 0 18px hsl(var(--primary) / 0.5)); }
          84.6%, 100% { filter: drop-shadow(0 0 0px hsl(var(--primary) / 0)); }
        }
        @keyframes advice-title-reveal {
          0% { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes advice-body-reveal {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Share Preview Sheet */}
      <SharePreviewSheet
        isOpen={showSharePreview}
        onClose={() => setShowSharePreview(false)}
        petName={petName}
        capturedImage={capturedImage}
        dominantMood={data.dominantMood.mood}
      />
    </div>
  );
}

// Generate advice text based on dominant mood
function getAdviceText(data: ReportData, period: ReportPeriod, petName: string): string {
  const dominant = data.dominantMood;
  const periodName = period === "weekly" ? "this week" : period === "monthly" ? "this month" : "this year";
  const moodLower = dominant.mood.toLowerCase();
  
  if (moodLower.includes('happy') || moodLower.includes('joyful')) {
    return `${petName} is thriving! Keep up the wonderful care — those joyful moments are precious. Consider capturing even more of these happy times.`;
  } else if (moodLower.includes('playful')) {
    return `All that playfulness shows ${petName} feels safe and loved. Keep the play sessions going — they're great for bonding!`;
  } else if (moodLower.includes('calm') || moodLower.includes('relaxed')) {
    return `A peaceful ${periodName} for ${petName}. Your calm environment is clearly working. Keep providing that sense of security.`;
  } else if (moodLower.includes('excited') || moodLower.includes('energetic')) {
    return `${petName}'s energy is wonderful! Make sure to balance activity with rest, and keep those adventures coming.`;
  } else if (moodLower.includes('tired') || moodLower.includes('sleepy')) {
    return `${petName} might need some extra cozy time ${periodName}. Ensure they have a quiet, comfortable space to rest.`;
  } else if (moodLower.includes('alert') || moodLower.includes('curious')) {
    return `${petName} is staying curious and engaged! Try introducing new safe experiences to keep that curiosity satisfied.`;
  } else if (moodLower.includes('anxious') || moodLower.includes('worried')) {
    return `If ${petName} seems anxious, try to identify and minimize stressors. Consistent routines and calm environments can help.`;
  }
  
  return `You've captured ${data.totalEntries} precious moments ${periodName}. Keep exploring ${petName}'s emotional journey — every snapshot tells a story!`;
}
