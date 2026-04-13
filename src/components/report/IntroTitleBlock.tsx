import { useState, useEffect, useRef, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface IntroTitleBlockProps {
    petName: string;
    entranceStage: "expanding" | "image" | "title" | "subtitle" | "progress" | "controls" | "complete";
}

/**
 * Measures the rendered width of text using an off-screen canvas.
 * Now supports letter-spacing in the font string.
 */
function measureTextWidth(text: string, font: string, letterSpacing: string = "normal"): number {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return 0;

    // Canvas letter-spacing is a newer API, but we can simulate it if needed.
    // Standard way is setting ctx.letterSpacing = "..." before measuring.
    // Note: Support for ctx.letterSpacing is good in modern browsers.
    if ('letterSpacing' in ctx) {
        (ctx as any).letterSpacing = letterSpacing;
    }

    ctx.font = font;
    const width = ctx.measureText(text).width;

    // Fallback for letterSpacing measurement if the browser doesn't support the API
    if (!('letterSpacing' in ctx) && letterSpacing !== "normal") {
        const spacingValue = parseFloat(letterSpacing);
        if (!isNaN(spacingValue)) {
            // Very crude approximation: add (count-1) * spacing * fontSize
            const fontSizeMatch = font.match(/(\d+)px/);
            if (fontSizeMatch) {
                const fontSize = parseInt(fontSizeMatch[1]);
                const emInPx = fontSize; // 1em = current font size
                return width + (text.length - 1) * spacingValue * emInPx;
            }
        }
    }

    return width;
}

/**
 * Enhanced IntroTitleBlock with adaptive layout and strict anti-clipping.
 */
export function IntroTitleBlock({ petName, entranceStage }: IntroTitleBlockProps) {
    const { t } = useLanguage();
    const containerRef = useRef<HTMLDivElement>(null);

    const [layout, setLayout] = useState<"single" | "two-line">("two-line");
    const [petNameFontSize, setPetNameFontSize] = useState(30);
    const [petNameLetterSpacing, setPetNameLetterSpacing] = useState("normal");
    const [isReady, setIsReady] = useState(false);

    const THIS_WEEK_FONT_SIZE = 30; // 3xl equivalent
    const DEFAULT_PET_NAME_SIZE = 30;
    const MIN_PET_NAME_SIZE = 22; // Don't go too tiny

    const thisWeekText = t("reportThisWeek");
    const petNameWithPossessive = `${petName}'s`;
    const combinedText = `${petNameWithPossessive} ${thisWeekText}`;
    const fontFamily = '"Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, -apple-system, Roboto, sans-serif';

    const calculateLayout = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;

        const containerWidth = container.offsetWidth;
        const safeWidth = containerWidth - 32; // Increased safety margin (16px each side)

        const fontWeight = 700;
        const baseFontTemplate = `${fontWeight} ${DEFAULT_PET_NAME_SIZE}px ${fontFamily}`;

        // Rule: Only split if combined text exceeds safe width at 100% scale
        const combinedWidth = measureTextWidth(combinedText, baseFontTemplate);

        if (combinedWidth <= safeWidth) {
            setLayout("single");
        } else {
            setLayout("two-line");
        }

        // Font size and spacing are now FIXED as per requirements
        setPetNameFontSize(DEFAULT_PET_NAME_SIZE);
        setPetNameLetterSpacing("normal");
        setIsReady(true);
    }, [combinedText, fontFamily]);

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
                <h1
                    className="font-bold text-foreground leading-tight py-1 px-1"
                    style={{
                        fontSize: `${petNameFontSize}px`,
                        letterSpacing: petNameLetterSpacing,
                        fontFamily,
                        maxWidth: '100%',
                    }}
                >
                    {combinedText}
                </h1>
            ) : (
                <div className="flex flex-col items-center gap-1">
                    <h1
                        className="font-bold text-foreground leading-tight py-1 px-2 text-center"
                        style={{
                            fontSize: `${petNameFontSize}px`,
                            letterSpacing: petNameLetterSpacing,
                            fontFamily,
                            maxWidth: '100%',
                            wordBreak: 'break-word',
                        }}
                    >
                        {petNameWithPossessive}
                    </h1>
                    <h1
                        className="text-[30px] font-bold text-foreground leading-tight py-1 px-1"
                        style={{
                            fontFamily,
                        }}
                    >
                        {thisWeekText}
                    </h1>
                </div>
            )}
        </div>
    );
}
