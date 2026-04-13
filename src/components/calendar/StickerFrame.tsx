
import { useMemo } from "react";

// Illustrated icon SVGs - consistent cute flat style
const STICKER_ICONS: Record<string, React.FC<{ className?: string }>> = {
    "⭐": ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
    ),
    "❤️": ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
    ),
    "🌸": ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="3" />
            <ellipse cx="12" cy="5" rx="2.5" ry="4" />
            <ellipse cx="12" cy="19" rx="2.5" ry="4" />
            <ellipse cx="5" cy="12" rx="4" ry="2.5" />
            <ellipse cx="19" cy="12" rx="4" ry="2.5" />
        </svg>
    ),
    "🍀": ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c-2-3-5-4-7-2s-1 5 2 7c-3 2-4 5-2 7s5 1 7-2c2 3 5 4 7 2s1-5-2-7c3-2 4-5 2-7s-5-1-7 2z" transform="translate(0,-2)" />
        </svg>
    ),
    "✨": ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2z" />
            <path d="M19 15l.75 2.25L22 18l-2.25.75L19 21l-.75-2.25L16 18l2.25-.75L19 15z" opacity="0.7" />
        </svg>
    ),
    "🐾": ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <ellipse cx="12" cy="17" rx="5" ry="4" />
            <circle cx="7" cy="10" r="2.5" />
            <circle cx="17" cy="10" r="2.5" />
            <circle cx="5" cy="14" r="2" />
            <circle cx="19" cy="14" r="2" />
        </svg>
    ),
    "🌈": ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M4 18C4 12 8 6 12 6s8 6 8 12" strokeLinecap="round" />
            <path d="M7 18C7 14 9 10 12 10s5 4 5 8" strokeLinecap="round" opacity="0.7" />
        </svg>
    ),
    "🎀": ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12l-4-4c-2-2-5-1-5 2s2 5 5 5l4-3z" />
            <path d="M12 12l4-4c2-2 5-1 5 2s-2 5-5 5l-4-3z" />
            <circle cx="12" cy="12" r="2.5" />
            <path d="M10 14l-2 6h8l-2-6" opacity="0.7" />
        </svg>
    ),
    "🌙": ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
    ),
    "☀️": ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="12" y1="20" x2="12" y2="23" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="1" y1="12" x2="4" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="20" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="17.66" y1="6.34" x2="19.78" y2="4.22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
    ),
};

interface StickerFrameProps {
    sticker: string;
    dateKey: string;
}

/**
 * Sticker overlay component - renders as absolute positioned layer.
 * Does NOT affect parent layout.
 * 
 * Renders exactly 2 sticker icons:
 * - Left: positioned at left edge, rotated +12° (tilted inward)
 * - Right: positioned at right edge, rotated -12° (tilted inward)
 * 
 * All transforms apply ONLY to the emoji elements, not to the overlay container.
 */
export function StickerFrame({ sticker, dateKey }: StickerFrameProps) {
    // Check if we have a custom SVG for this sticker
    const hasCustomIcon = sticker in STICKER_ICONS;
    const IconComponent = hasCustomIcon ? STICKER_ICONS[sticker] : null;

    const iconColor = useMemo(() => {
        const colors: Record<string, string> = {
            "⭐": "hsl(45, 90%, 50%)",
            "❤️": "hsl(350, 80%, 55%)",
            "🌸": "hsl(330, 65%, 65%)",
            "🍀": "hsl(140, 55%, 45%)",
            "✨": "hsl(45, 85%, 55%)",
            "🐾": "hsl(25, 45%, 50%)",
            "🌈": "hsl(280, 55%, 60%)",
            "🎀": "hsl(340, 65%, 60%)",
            "🌙": "hsl(220, 45%, 55%)",
            "☀️": "hsl(40, 90%, 50%)",
        };
        return colors[sticker] || undefined;
    }, [sticker]);

    // Render either a custom SVG icon or the actual emoji text
    // position: "left" | "right" determines rotation direction
    const renderSticker = (position: "left" | "right") => {
        // Left tilts clockwise (+12°), right tilts counter-clockwise (-12°)
        const rotation = position === "left" ? "12deg" : "-12deg";

        if (IconComponent) {
            // Custom SVG icon with color - sized at 9px
            return (
                <div
                    className="w-[11px] h-[11px]"
                    style={{
                        color: iconColor,
                        opacity: 0.9,
                        transform: `rotate(${rotation}) scale(1.05)`,
                    }}
                >
                    <IconComponent className="w-full h-full" />
                </div>
            );
        } else {
            // Render the actual emoji character directly
            return (
                <span
                    className="text-[11px] leading-none select-none"
                    style={{
                        opacity: 0.9,
                        transform: `rotate(${rotation}) scale(1.05)`,
                        display: "inline-block",
                    }}
                >
                    {sticker}
                </span>
            );
        }
    };

    return (
        // Absolute overlay - positioned at bottom of cell near date number
        // pointer-events-none ensures it doesn't interfere with clicks
        // Number safe zone: flanking the date at approximately 16% from edges
        <div
            className="absolute bottom-[3px] left-0 right-0 pointer-events-none z-[1]"
            style={{ height: "12px" }}
            aria-hidden="true"
        >
            {/* Left sticker - positioned close to edge to flank the number with space */}
            <div
                className="absolute top-1/2"
                style={{
                    // Pushed to edge: 5% offset
                    left: "5%",
                    transform: "translateY(-50%)",
                }}
            >
                {renderSticker("left")}
            </div>
            {/* Right sticker - positioned close to edge to flank the number with space */}
            <div
                className="absolute top-1/2"
                style={{
                    // Pushed to edge: 5% offset
                    right: "5%",
                    transform: "translateY(-50%)",
                }}
            >
                {renderSticker("right")}
            </div>
        </div>
    );
}
