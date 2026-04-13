import { Lock, Sparkles, Camera, ImagePlus } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { TranslationKey } from "@/lib/translations";
import { ContentCard, ContentCardCorners } from "@/components/ui/content-card";
import { Button } from "@/components/ui/button";

interface AnalyzeLockedModuleProps {
    onUnlock: () => void;
    /** Whether user has ever subscribed (for copy differentiation) */
    isReturningUser?: boolean;
}

/**
 * Sparkle particle component
 */
function Sparkle({ className, delay = 0 }: { className?: string; delay?: number }) {
    return (
        <div
            className={`absolute animate-pulse pointer-events-none ${className}`}
            style={{ animationDelay: `${delay}ms`, animationDuration: '3s' }}
        >
            <Sparkles className="w-3 h-3 text-[hsl(25,80%,60%)] opacity-40" />
        </div>
    );
}

/**
 * AnalyzeLockedModule - Full-sized lock screen for Home/Camera
 * 
 * OPTION A Implementation: When locked, we render ONLY the lock UI.
 * No underlying buttons are rendered at all - they are completely replaced.
 * 
 * Layout covers the entire camera module area with proper horizontal padding.
 */
export function AnalyzeLockedModule({ onUnlock }: AnalyzeLockedModuleProps) {
    const { t } = useLanguage();

    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[60vh] px-4 pt-4">
            {/* Lock container - wraps entire camera module area */}
            <div
                className="relative w-full cursor-pointer"
                onClick={onUnlock}
            >
                {/* ContentCard provides the background structure matching unlocked state */}
                <div className="relative">
                    <ContentCard className="w-full min-h-[420px] shadow-plush">
                        {/* Blurred content teaser */}

                        <ContentCardCorners />

                        {/* Lock overlay - covers entire ContentCard */}
                        <div
                            className="absolute inset-0 z-30 overflow-hidden pointer-events-auto rounded-3xl"
                        >
                            {/* Warm glassmorphism background */}
                            <div
                                className="absolute inset-0 rounded-3xl"
                                style={{
                                    background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 248, 240, 0.6) 100%)',
                                    backdropFilter: 'blur(8px)',
                                }}
                            />

                            {/* Sparkle particles */}
                            <Sparkle className="top-[15%] left-[12%]" delay={0} />
                            <Sparkle className="top-[22%] right-[15%]" delay={700} />
                            <Sparkle className="top-[45%] left-[10%]" delay={1200} />
                            <Sparkle className="top-[55%] right-[10%]" delay={400} />
                            <Sparkle className="bottom-[25%] left-[20%]" delay={900} />

                            {/* Centered lock content */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="flex flex-col items-center gap-6">
                                    {/* Lock icon in gold glass circle */}
                                    <div className="relative group">
                                        <div
                                            className="absolute -inset-4 rounded-full blur-xl opacity-40 group-hover:opacity-60 transition-opacity"
                                            style={{
                                                background: 'radial-gradient(circle, rgba(255, 170, 110, 0.6) 0%, transparent 70%)',
                                            }}
                                        />
                                        <div
                                            className="relative w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-warm-glow border-2 border-orange-100"
                                        >
                                            <Lock className="w-7 h-7 text-orange-400" />
                                        </div>
                                    </div>

                                    {/* Vibrant Glass CTA button - Large rounded rect shape matching image */}
                                    <button
                                        className="px-8 py-4 rounded-xl flex items-center gap-3 transition-all hover:scale-105 active:scale-[0.98] shadow-warm-glow border-2 border-white/40"
                                        style={{
                                            background: 'linear-gradient(135deg, #FFD0A0 0%, #FFB070 100%)',
                                            boxShadow: '0 8px 24px rgba(255, 160, 100, 0.3)',
                                        }}
                                    >
                                        <span className="text-[17px] font-bold text-orange-950">
                                            {t("unlockWithFreeCredits" as TranslationKey)}
                                        </span>
                                        <Sparkles className="w-5 h-5 text-orange-900/60" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </ContentCard>
                </div>
            </div>
        </div>
    );
}
