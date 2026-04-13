import { useState, useEffect, forwardRef } from "react";
import { ReportPeriod } from "./ReportTypes";
import { cn } from "@/lib/utils";

interface TopPercentageSceneProps {
    dominantMood: {
        mood: string;
        emoji: string;
        count: number;
    };
    petName: string;
    period: ReportPeriod;
    heroImageUrl?: string;
    onShare?: () => void;
}

function calculateTopPercentage(mood: string, period: string): number {
    const hash = (mood + period).split('').reduce((acc, char) => {
        return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);

    const isPositiveMood = ['happy', 'playful', 'excited', 'joyful', 'content', 'calm', 'relaxed']
        .some(m => mood.toLowerCase().includes(m));

    if (isPositiveMood) {
        return 1 + Math.abs(hash % 15);
    }
    return 10 + Math.abs(hash % 25);
}

function getMoodEmotion(mood: string): string {
    const moodLower = mood.toLowerCase();
    if (moodLower.includes('happy') || moodLower.includes('joyful')) return 'happiness';
    if (moodLower.includes('playful')) return 'playfulness';
    if (moodLower.includes('excited')) return 'excitement';
    if (moodLower.includes('calm') || moodLower.includes('relaxed')) return 'calmness';
    if (moodLower.includes('content')) return 'contentment';
    if (moodLower.includes('curious') || moodLower.includes('alert')) return 'curiosity';
    if (moodLower.includes('tired') || moodLower.includes('sleepy')) return 'relaxation';
    return 'positive vibes';
}

export const TopPercentageScene = forwardRef<HTMLDivElement, TopPercentageSceneProps>(
    function TopPercentageScene({
        dominantMood,
        petName,
        period,
        heroImageUrl,
        onShare,
    }, ref) {
        const [isVisible, setIsVisible] = useState(false);
        const [percentageVisible, setPercentageVisible] = useState(false);
        const [supportTextVisible, setSupportTextVisible] = useState(false);

        const [stableValues] = useState(() => ({
            percentage: calculateTopPercentage(dominantMood.mood, period),
            emotion: getMoodEmotion(dominantMood.mood),
            periodLabel: period === "weekly" ? "this week" : period === "monthly" ? "this month" : "this year",
        }));

        useEffect(() => {
            const imageTimer = setTimeout(() => setIsVisible(true), 100);
            const percentTimer = setTimeout(() => setPercentageVisible(true), 600);
            const supportTimer = setTimeout(() => setSupportTextVisible(true), 950);

            return () => {
                clearTimeout(imageTimer);
                clearTimeout(percentTimer);
                clearTimeout(supportTimer);
            };
        }, []);

        return (
            <div ref={ref} className="flex flex-col items-center justify-center h-full text-center px-6">
                {heroImageUrl && (
                    <div
                        className={cn(
                            "relative mb-8",
                            isVisible ? "opacity-100 scale-100" : "opacity-0 scale-90"
                        )}
                        style={{
                            transition: "opacity 700ms ease-out, transform 700ms ease-out",
                            willChange: "opacity, transform",
                        }}
                    >
                        <div className="w-40 h-40 rounded-full overflow-hidden shadow-2xl ring-4 ring-primary/20">
                            <img
                                src={heroImageUrl}
                                alt=""
                                className="w-full h-full object-cover"
                                draggable={false}
                            />
                        </div>
                        <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl -z-10 scale-110" />
                    </div>
                )}

                <div className="flex items-center justify-center w-full mb-2" style={{ minHeight: "72px" }}>
                    <div
                        className="text-6xl font-bold text-primary text-center"
                        style={{
                            opacity: percentageVisible ? 1 : 0,
                            transform: percentageVisible ? "scale(1)" : "scale(0.6)",
                            animation: percentageVisible ? "top-percent-bounce 0.7s cubic-bezier(0.34, 1.2, 0.64, 1) forwards" : "none",
                            willChange: "opacity, transform",
                            fontVariantNumeric: "tabular-nums",
                            minWidth: "200px",
                        }}
                    >
                        Top {stableValues.percentage}%
                    </div>
                </div>

                <div
                    className="flex flex-col items-center w-full"
                    style={{
                        opacity: supportTextVisible ? 1 : 0,
                        transform: supportTextVisible ? "translateY(0)" : "translateY(12px)",
                        transition: "opacity 500ms ease-out, transform 500ms ease-out",
                        willChange: "opacity, transform",
                    }}
                >
                    <p className="text-xl text-foreground mb-3 text-center">
                        in {stableValues.emotion}
                    </p>
                    <p className="text-base text-muted-foreground text-center mb-6 px-4" style={{ maxWidth: "320px" }}>
                        <span className="font-medium">{petName}</span>'s {stableValues.emotion} mood is in the top {stableValues.percentage}% {stableValues.periodLabel}.
                    </p>
                </div>

                {onShare && (
                    <div
                        data-report-controls
                        style={{
                            opacity: supportTextVisible ? 1 : 0,
                            transform: supportTextVisible ? "translateY(0)" : "translateY(12px)",
                            transition: "opacity 400ms ease-out 200ms, transform 400ms ease-out 200ms",
                            willChange: "opacity, transform",
                        }}
                    >
                        <button
                            onClick={onShare}
                            className={cn(
                                "mt-4 py-3.5 px-8 rounded-full",
                                "bg-primary text-primary-foreground",
                                "font-medium text-sm",
                                "shadow-warm-lg",
                                "hover:opacity-95 active:scale-[0.98]",
                                "transition-all duration-200"
                            )}
                        >
                            Share this story
                        </button>
                    </div>
                )}

                <style>{`
          @keyframes top-percent-bounce {
            0% { opacity: 0; transform: scale(0.6); }
            60% { opacity: 1; transform: scale(1.06); }
            100% { opacity: 1; transform: scale(1); }
          }
        `}</style>
            </div>
        );
    }
);
