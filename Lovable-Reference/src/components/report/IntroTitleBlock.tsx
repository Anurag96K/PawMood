import { useState, useEffect, useRef, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface IntroTitleBlockProps {
  petName: string;
  entranceStage: "expanding" | "image" | "title" | "subtitle" | "progress" | "controls" | "complete";
}

/**
 * Measures the rendered width of text using an off-screen canvas.
 */
function measureTextWidth(text: string, font: string): number {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return 0;
  ctx.font = font;
  return ctx.measureText(text).width;
}

/**
 * Dynamic intro title block for the Mood Report.
 * 
 * Layout logic:
 * 1. At default font sizes, measure if "{PetName}'s {LocalizedThisWeek}" fits
 * 2. If it fits → single line
 * 3. If it doesn't fit → two lines (NO font shrinking to force single line)
 * 
 * Font sizing:
 * - "This Week" is ALWAYS at fixed size (30px) - never scaled
 * - Pet name may scale down ONLY to prevent clipping (safety measure)
 */
export function IntroTitleBlock({ petName, entranceStage }: IntroTitleBlockProps) {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Layout state
  const [layout, setLayout] = useState<"single" | "two-line">("two-line");
  const [petNameFontSize, setPetNameFontSize] = useState(30); // px - only pet name may scale
  const [isReady, setIsReady] = useState(false);

  // Fixed font size for "This Week" - NEVER changes
  const THIS_WEEK_FONT_SIZE = 30; // px (equivalent to text-3xl)
  const DEFAULT_PET_NAME_SIZE = 30;
  const MIN_PET_NAME_SIZE = 20;

  // Get localized "This Week" text
  const thisWeekText = t("reportThisWeek");
  const petNameWithPossessive = `${petName}'s`;
  
  // Combined text for single-line layout
  const combinedText = `${petNameWithPossessive} ${thisWeekText}`;

  // Font stack for measurement (must match rendered font)
  const fontFamily = '"Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, -apple-system, Roboto, sans-serif';

  const calculateLayout = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const containerWidth = container.offsetWidth;
    const safeWidth = containerWidth - 8;

    const fontWeight = 700;
    const defaultFont = `${fontWeight} ${DEFAULT_PET_NAME_SIZE}px ${fontFamily}`;

    // Measure combined text at default size
    const combinedWidth = measureTextWidth(combinedText, defaultFont);

    // Layout decision: if it fits at default size → single line, otherwise two lines
    const useSingleLine = combinedWidth <= safeWidth;

    // Pet name font size - only scale down if needed to prevent clipping
    let finalPetNameSize = DEFAULT_PET_NAME_SIZE;

    if (!useSingleLine) {
      // Two-line mode: check if pet name line fits, scale only if needed
      let currentSize = DEFAULT_PET_NAME_SIZE;
      while (currentSize >= MIN_PET_NAME_SIZE) {
        const font = `${fontWeight} ${currentSize}px ${fontFamily}`;
        const petNameWidth = measureTextWidth(petNameWithPossessive, font);
        if (petNameWidth <= safeWidth) {
          break;
        }
        currentSize -= 1;
      }
      finalPetNameSize = Math.max(currentSize, MIN_PET_NAME_SIZE);
    }

    setLayout(useSingleLine ? "single" : "two-line");
    setPetNameFontSize(finalPetNameSize);
    setIsReady(true);
  }, [combinedText, petNameWithPossessive, fontFamily]);

  useEffect(() => {
    const timer = setTimeout(() => {
      calculateLayout();
    }, 10);
    
    const handleResize = () => calculateLayout();
    window.addEventListener("resize", handleResize);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, [calculateLayout]);

  const isVisible = entranceStage !== "expanding" && entranceStage !== "image";

  return (
    <div 
      ref={containerRef}
      className="w-full max-w-[90vw] px-4 mb-6 text-center"
      style={{
        transition: 'opacity 450ms cubic-bezier(0.33, 0, 0.2, 1), transform 450ms cubic-bezier(0.33, 0, 0.2, 1)',
        opacity: isVisible && isReady ? 1 : 0,
        transform: isVisible 
          ? 'translateY(0) scale(1)' 
          : 'translateY(12px) scale(0.96)',
      }}
    >
      {layout === "single" ? (
        /* Single-line layout */
        <h1 
          className="font-bold text-foreground leading-tight whitespace-nowrap"
          style={{
            fontSize: `${DEFAULT_PET_NAME_SIZE}px`,
            fontFamily,
            maxWidth: '100%',
            overflow: 'hidden',
          }}
        >
          {combinedText}
        </h1>
      ) : (
        /* Two-line layout */
        <>
          {/* Pet name - may scale down only to prevent clipping */}
          <h1 
            className="font-bold text-foreground leading-tight whitespace-nowrap"
            style={{
              fontSize: `${petNameFontSize}px`,
              fontFamily,
              maxWidth: '100%',
              overflow: 'hidden',
            }}
          >
            {petNameWithPossessive}
          </h1>
          {/* "This Week" - FIXED size, never scales */}
          <h1 
            className="text-3xl font-bold text-foreground leading-tight"
            style={{
              fontFamily,
            }}
          >
            {thisWeekText}
          </h1>
        </>
      )}
    </div>
  );
}
