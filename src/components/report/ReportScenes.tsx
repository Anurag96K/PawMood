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
import { ParticleEffect } from "./ParticleEffect";

interface ReportScenesProps {
    data: ReportData;
    period: ReportPeriod;
    petName: string;
    onClose: () => void;
    isLoading?: boolean;
    entries: MoodEntry[];
    lockedIntroBackground?: string;
}

interface Scene {
    id: string;
    duration: number;
    render: () => React.ReactNode;
    background: string;
}

type MoodColorTheme = {
    primary: string;
    secondary: string;
};

const MOOD_COLOR_MAP: Record<string, MoodColorTheme> = {
    playful: { primary: "50 85% 88%", secondary: "45 80% 85%" },
    happy: { primary: "30 80% 90%", secondary: "35 75% 87%" },
    joyful: { primary: "30 80% 90%", secondary: "35 75% 87%" },
    content: { primary: "35 45% 93%", secondary: "40 40% 91%" },
    relaxed: { primary: "35 45% 93%", secondary: "40 40% 91%" },
    curious: { primary: "165 45% 90%", secondary: "170 40% 88%" },
    alert: { primary: "165 45% 90%", secondary: "170 40% 88%" },
    calm: { primary: "220 45% 92%", secondary: "250 40% 90%" },
    peaceful: { primary: "220 45% 92%", secondary: "250 40% 90%" },
    excited: { primary: "40 75% 88%", secondary: "35 70% 85%" },
    energetic: { primary: "40 75% 88%", secondary: "35 70% 85%" },
    tired: { primary: "260 35% 92%", secondary: "270 30% 90%" },
    sleepy: { primary: "260 35% 92%", secondary: "270 30% 90%" },
    anxious: { primary: "210 40% 92%", secondary: "220 35% 90%" },
    worried: { primary: "210 40% 92%", secondary: "220 35% 90%" },
};

function getMoodColor(mood: string): MoodColorTheme {
    const moodLower = mood.toLowerCase();
    for (const [key, theme] of Object.entries(MOOD_COLOR_MAP)) {
        if (moodLower.includes(key)) return theme;
    }
    return { primary: "35 50% 92%", secondary: "30 45% 90%" };
}

function getMomentCountBackground(count: number): string {
    // Tiers based on photo frequency
    if (count >= 21) return "linear-gradient(135deg, hsl(30 90% 90%) 0%, hsl(25 85% 85%) 50%, hsl(35 80% 88%) 100%)";
    if (count >= 14) return "linear-gradient(135deg, hsl(28 80% 90%) 0%, hsl(32 75% 87%) 100%)";
    if (count >= 7) return "linear-gradient(135deg, hsl(20 70% 92%) 0%, hsl(18 65% 89%) 100%)";
    if (count >= 3) return "linear-gradient(135deg, hsl(32 55% 94%) 0%, hsl(28 50% 92%) 100%)";
    return "linear-gradient(135deg, hsl(38 28% 96%) 0%, hsl(35 22% 94%) 100%)";
}

function getMoodBreakdownBackground(moodPercentages: Array<{ mood: string; percentage: number }>): string {
    if (moodPercentages.length === 0) return "linear-gradient(180deg, hsl(40 25% 97%) 0%, hsl(35 20% 95%) 100%)";

    // Ordered by percentage
    const sorted = [...moodPercentages].sort((a, b) => b.percentage - a.percentage);
    const dominant = sorted[0];
    const dominantColor = getMoodColor(dominant.mood);

    if (sorted.length === 1 || dominant.percentage > 70) {
        return `linear-gradient(180deg, hsl(${dominantColor.primary}) 0%, hsl(${dominantColor.secondary}) 100%)`;
    }

    const secondary = sorted[1];
    const secondaryColor = getMoodColor(secondary.mood);

    // Blend/mix colors based on percentages
    return `linear-gradient(180deg, hsl(${dominantColor.primary}) 0%, hsl(${dominantColor.secondary}) ${Math.max(40, dominant.percentage)}%, hsl(${secondaryColor.primary}) 100%)`;
}

function getMoodHighlightBackground(mood: string): string {
    const moodLower = mood.toLowerCase();
    if (moodLower.includes('playful')) return "linear-gradient(135deg, hsl(50 85% 90%) 0%, hsl(48 80% 87%) 100%)";
    if (moodLower.includes('happy') || moodLower.includes('joyful')) return "linear-gradient(135deg, hsl(30 85% 90%) 0%, hsl(28 80% 87%) 100%)";
    if (moodLower.includes('content') || moodLower.includes('relaxed')) return "linear-gradient(135deg, hsl(35 50% 94%) 0%, hsl(38 45% 91%) 100%)";
    if (moodLower.includes('curious') || moodLower.includes('alert')) return "linear-gradient(135deg, hsl(165 50% 90%) 0%, hsl(168 45% 87%) 100%)";
    if (moodLower.includes('calm') || moodLower.includes('peaceful')) return "linear-gradient(135deg, hsl(220 50% 92%) 0%, hsl(250 45% 90%) 100%)";
    if (moodLower.includes('excited') || moodLower.includes('energetic')) return "linear-gradient(135deg, hsl(40 80% 90%) 0%, hsl(38 75% 87%) 100%)";
    if (moodLower.includes('tired') || moodLower.includes('sleepy')) return "linear-gradient(135deg, hsl(260 40% 92%) 0%, hsl(265 35% 90%) 100%)";
    return "linear-gradient(135deg, hsl(35 55% 92%) 0%, hsl(30 50% 90%) 100%)";
}

type AdviceTone = 'comfort' | 'encouragement' | 'guidance' | 'balance';

function getAdviceTone(mood: string): AdviceTone {
    const moodLower = mood.toLowerCase();
    if (moodLower.includes('calm') || moodLower.includes('peaceful') || moodLower.includes('relaxed') || moodLower.includes('content') || moodLower.includes('sleepy') || moodLower.includes('tired')) return 'comfort';
    if (moodLower.includes('happy') || moodLower.includes('joyful') || moodLower.includes('playful') || moodLower.includes('excited') || moodLower.includes('energetic')) return 'encouragement';
    if (moodLower.includes('curious') || moodLower.includes('alert')) return 'guidance';
    if (moodLower.includes('anxious') || moodLower.includes('worried')) return 'balance';
    return 'encouragement';
}

function getAdviceBackground(mood: string): string {
    const tone = getAdviceTone(mood);
    switch (tone) {
        case 'comfort': return "linear-gradient(180deg, hsl(220 45% 94%) 0%, hsl(240 40% 91%) 100%)";
        case 'encouragement': return "linear-gradient(180deg, hsl(38 85% 94%) 0%, hsl(32 80% 90%) 100%)";
        case 'guidance': return "linear-gradient(180deg, hsl(165 45% 94%) 0%, hsl(175 40% 91%) 100%)";
        case 'balance': return "linear-gradient(180deg, hsl(210 30% 94%) 0%, hsl(225 25% 91%) 100%)";
        default: return "linear-gradient(180deg, hsl(40 50% 94%) 0%, hsl(35 45% 92%) 100%)";
    }
}

function getOutroBackgroundFallback(): string {
    const outroBackgrounds = [
        "linear-gradient(135deg, hsl(30 60% 94%) 0%, hsl(35 55% 91%) 100%)",
        "linear-gradient(135deg, hsl(45 50% 94%) 0%, hsl(40 45% 92%) 100%)",
        "linear-gradient(135deg, hsl(25 65% 93%) 0%, hsl(20 60% 90%) 100%)",
        "linear-gradient(135deg, hsl(35 55% 95%) 0%, hsl(30 50% 93%) 100%)",
        "linear-gradient(135deg, hsl(15 70% 94%) 0%, hsl(20 65% 91%) 100%)",
    ];
    return outroBackgrounds[Math.floor(Date.now() / 60000) % outroBackgrounds.length];
}

export function ReportScenes({ data, period, petName, onClose, isLoading = false, entries, lockedIntroBackground }: ReportScenesProps) {
    const { t } = useLanguage();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [progress, setProgress] = useState(0);
    const [showSharePreview, setShowSharePreview] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const reportContainerRef = useRef<HTMLDivElement>(null);

    const handleOpenShare = useCallback(async () => {
        const container = reportContainerRef.current;
        if (!container) return;
        const controlEls = container.querySelectorAll<HTMLElement>("[data-report-controls]");
        controlEls.forEach(el => el.style.visibility = "hidden");
        try {
            const canvas = await html2canvas(container, {
                useCORS: true,
                allowTaint: true,
                scale: 2,
                backgroundColor: null,
            });
            setCapturedImage(canvas.toDataURL("image/png", 1.0));
            setShowSharePreview(true);
        } catch (error) {
            console.error("Capture failed:", error);
        } finally {
            controlEls.forEach(el => el.style.visibility = "");
        }
    }, []);

    const [entranceStage, setEntranceStage] = useState<"expanding" | "image" | "title" | "subtitle" | "progress" | "controls" | "complete">("expanding");
    const { heroPhotoUrl, lockedOutroBackground: hookOutro, isImagePreloaded } = useWeeklyHeroPhoto(entries, data.hasEnoughData);
    const introReady = !!heroPhotoUrl && isImagePreloaded;
    const finalIntroBackground = useMemo(() => lockedIntroBackground || "linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--background)) 100%)", [lockedIntroBackground]);
    const outroBackground = useMemo(() => hookOutro || getOutroBackgroundFallback(), [hookOutro]);
    const entranceStarted = useRef(false);

    useEffect(() => {
        if (entranceStarted.current || !introReady) return;
        entranceStarted.current = true;
        const rafId = requestAnimationFrame(() => {
            setEntranceStage("image");
            setTimeout(() => setEntranceStage("title"), 250);
            setTimeout(() => setEntranceStage("subtitle"), 400);
            setTimeout(() => setEntranceStage("progress"), 550);
            setTimeout(() => setEntranceStage("controls"), 700);
            setTimeout(() => setEntranceStage("complete"), 850);
        });
        return () => cancelAnimationFrame(rafId);
    }, [introReady]);

    const scenes: Scene[] = [
        {
            id: "intro",
            duration: 4000,
            background: finalIntroBackground,
            render: () => (
                <div className="flex flex-col items-center justify-center h-full text-center px-8">
                    {heroPhotoUrl && (
                        <div className="mb-8 relative" style={{ width: '160px', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ transition: 'opacity 300ms ease-out, transform 400ms cubic-bezier(0.22, 1, 0.36, 1)', opacity: entranceStage === "expanding" ? 0 : 1, transform: entranceStage === "expanding" ? 'scale(0.85)' : 'scale(1)', willChange: 'opacity, transform' }}>
                                <div className="w-40 h-40 rounded-full overflow-hidden shadow-2xl ring-4 ring-primary/20">
                                    <img src={heroPhotoUrl} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className="absolute inset-0 rounded-full bg-primary/15 blur-xl -z-10" style={{ transform: 'scale(1.3)', opacity: entranceStage === "expanding" ? 0 : 0.7, transition: 'opacity 400ms ease-out' }} />
                            </div>
                        </div>
                    )}
                    <IntroTitleBlock petName={petName} entranceStage={entranceStage} />
                    <p className="text-lg text-muted-foreground" style={{ transition: 'opacity 400ms cubic-bezier(0.33, 0, 0.2, 1), transform 400ms cubic-bezier(0.33, 0, 0.2, 1)', opacity: ["expanding", "image", "title"].includes(entranceStage) ? 0 : 1, transform: ["expanding", "image", "title"].includes(entranceStage) ? 'translateY(10px) scale(0.98)' : 'translateY(0) scale(1)' }}>
                        {t("reportLetsSeeCaptured")} ✨
                    </p>
                </div>
            ),
        },
        {
            id: "total",
            duration: 5000,
            background: getMomentCountBackground(data.totalEntries),
            render: () => (
                <div className="relative flex flex-col items-center justify-center h-full text-center px-8">
                    <FallingPhotos imageUrls={data.periodImageUrls} count={data.totalEntries} active={currentIndex === 1} runId={currentIndex} />
                    <p className="text-lg text-muted-foreground mb-4 relative z-20">{t("reportYouCaptured")}</p>
                    <div className="text-7xl font-bold text-primary mb-4 relative z-20">
                        <CountUpNumber value={data.totalEntries} duration={1800} />
                    </div>
                    <p className="text-xl text-foreground relative z-20">{t("reportMoodMoments")} {period}</p>
                </div>
            ),
        },
        ...(data.moodPercentages.length > 0 ? [{
            id: "breakdown",
            duration: 6000,
            background: getMoodBreakdownBackground(data.moodPercentages),
            render: () => (
                <div className="flex flex-col w-full pt-4">
                    <h2 className="text-2xl font-bold text-foreground mb-6 text-center">{t("reportMoodBreakdown")}</h2>
                    <div className="w-full space-y-5 pl-4 pr-6 mb-8">
                        {data.moodPercentages.slice(0, 4).map((mood, idx) => (
                            <div key={mood.mood} className="animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${idx * 150}ms` }}>
                                <div className="flex items-center gap-2 mb-2 min-w-0">
                                    <span className="flex-1 text-foreground font-medium truncate text-sm">{mood.mood}</span>
                                    <span className="text-primary font-bold text-sm flex-shrink-0">
                                        <CountUpNumber value={mood.percentage} suffix="%" duration={1000 + idx * 200} />
                                    </span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
                                    <div className="h-full bg-primary/70 rounded-full" style={{ width: `${mood.percentage}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-center" data-report-controls>
                        <button
                            onClick={handleOpenShare}
                            className="py-2.5 px-6 rounded-full bg-primary/10 text-primary font-bold text-xs hover:bg-primary/20 transition-colors"
                        >
                            Share this story
                        </button>
                    </div>
                </div>
            ),
        }] : []),
        {
            id: "top-percentage",
            duration: 5000,
            background: getMoodHighlightBackground(data.dominantMood.mood),
            render: () => {
                // Section 4: Random photo from top-percentage mood entries
                const topMoodEntries = entries.filter(e => e.mood?.toLowerCase().includes(data.dominantMood.mood.toLowerCase()) && e.image_url);
                const randomTopPhoto = topMoodEntries.length > 0
                    ? topMoodEntries[Math.floor(Math.random() * topMoodEntries.length)].image_url
                    : heroPhotoUrl;

                return (
                    <TopPercentageScene
                        dominantMood={data.dominantMood}
                        petName={petName}
                        period={period}
                        heroImageUrl={randomTopPhoto}
                        onShare={handleOpenShare}
                    />
                );
            },
        },
        {
            id: "advice",
            duration: 5000,
            background: getAdviceBackground(data.dominantMood.mood),
            render: () => (
                <div className="flex flex-col items-center justify-center h-full text-center px-8">
                    <div className="text-5xl mb-6">💡</div>
                    <h2 className="text-xl font-semibold text-foreground mb-4">{t("reportAdviceTitle")}</h2>
                    <p className="text-lg text-muted-foreground leading-relaxed max-w-sm">
                        {getAdviceText(data, period, petName)}
                    </p>
                </div>
            ),
        },
        {
            id: "outro",
            duration: 5000,
            background: outroBackground,
            render: () => (
                <div className="flex flex-col items-center justify-center h-full text-center px-8 relative">
                    <ParticleEffect isActive={currentIndex === scenes.length - 1} />
                    <div className="text-6xl mb-6">🐾</div>
                    <h2 className="text-2xl font-bold text-foreground mb-4">{t("reportKeepMomentsComing")}</h2>
                    <p className="text-lg text-muted-foreground mb-8">{t("reportEverySnapshot")}</p>
                    <button onClick={onClose} className="py-3 px-8 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-warm-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
                        {t("reportDone")}
                    </button>
                </div>
            ),
        },
    ];

    const elapsedRef = useRef(0);
    useEffect(() => { elapsedRef.current = 0; }, [currentIndex]);
    useEffect(() => {
        if (isPaused || showSharePreview || currentIndex >= scenes.length) return;
        const interval = 50;
        const timer = setInterval(() => {
            elapsedRef.current += interval;
            setProgress((elapsedRef.current / scenes[currentIndex].duration) * 100);
            if (elapsedRef.current >= scenes[currentIndex].duration) {
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

    const progressVisible = ["progress", "controls", "complete"].indexOf(entranceStage) >= 0;
    const controlsVisible = ["controls", "complete"].indexOf(entranceStage) >= 0;

    return (
        <div ref={reportContainerRef} className="fixed inset-0 z-50 overflow-hidden" style={{ background: scenes[currentIndex].background }}>
            <div className={cn("absolute inset-0 bg-background pointer-events-none transition-opacity duration-500", entranceStage === "expanding" ? "opacity-100" : "opacity-0")} style={{ zIndex: 1 }} />
            <div data-report-controls className="absolute top-0 left-0 right-0 pt-8 px-4 z-20">
                <div className={cn("flex items-center justify-start mb-5 transition-all duration-500", progressVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2")}>
                    <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center bg-foreground/10 backdrop-blur-sm"><X className="w-4 h-4" /></button>
                </div>
                <div className="flex gap-1.5">
                    {scenes.map((scene, idx) => (
                        <div key={scene.id} className="flex-1 h-1 bg-muted/40 rounded-full overflow-hidden" style={{ opacity: progressVisible ? 1 : 0 }}>
                            <div className="h-full bg-primary rounded-full" style={{ width: idx < currentIndex ? "100%" : idx === currentIndex ? `${progress}%` : "0%" }} />
                        </div>
                    ))}
                </div>
            </div>
            <div className="relative h-full pt-28 pb-36 flex flex-col">
                <div className="flex-1 flex items-center justify-center">
                    {scenes[currentIndex].render()}
                </div>
            </div>
            <div data-report-controls className={cn("absolute bottom-0 left-0 right-0 p-6 pb-14 flex items-center justify-between z-10 px-10 transition-all duration-500", controlsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")}>
                <button onClick={() => currentIndex > 0 && setCurrentIndex(prev => prev - 1)} disabled={currentIndex === 0} className="w-12 h-12 rounded-full flex items-center justify-center bg-muted/60"><ChevronLeft /></button>
                <button onClick={() => setIsPaused(!isPaused)} className="w-14 h-14 rounded-full flex items-center justify-center bg-primary text-primary-foreground shadow-warm-lg">{isPaused ? <Play /> : <Pause />}</button>
                <button onClick={() => currentIndex < scenes.length - 1 && setCurrentIndex(prev => prev + 1)} disabled={currentIndex === scenes.length - 1} className="w-12 h-12 rounded-full flex items-center justify-center bg-muted/60"><ChevronRight /></button>
            </div>
            <SharePreviewSheet isOpen={showSharePreview} onClose={() => setShowSharePreview(false)} petName={petName} capturedImage={capturedImage} dominantMood={data.dominantMood.mood} />
        </div>
    );
}

function getAdviceText(data: ReportData, period: ReportPeriod, petName: string): string {
    const moodLower = data.dominantMood.mood.toLowerCase();
    const periodName = period === "weekly" ? "this week" : "this month";
    if (moodLower.includes('happy')) return `${petName} is thriving! Keep up the wonderful care — those joyful moments are precious.`;
    if (moodLower.includes('playful')) return `All that playfulness shows ${petName} feels safe and loved. Keep the play sessions going!`;
    if (moodLower.includes('calm')) return `A peaceful ${periodName} for ${petName}. Your calm environment is clearly working.`;
    if (moodLower.includes('excited')) return `${petName}'s energy is wonderful! Balance activity with rest.`;
    if (moodLower.includes('tired')) return `${petName} might need some extra cozy time ${periodName}.`;
    if (moodLower.includes('alert')) return `${petName} is staying curious! Try introducing new safe experiences.`;
    if (moodLower.includes('anxious')) return `If ${petName} seems anxious, try to identify stressors. Routines help.`;
    return `You've captured ${data.totalEntries} moments ${periodName}. Keep exploring ${petName}'s journey!`;
}
