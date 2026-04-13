import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface StreakBadgeProps {
    count: number;
    totalRecords: number;
    shouldShowStreak: boolean;
    petName?: string;
    className?: string;
}

const encouragementMessages: Record<string, string[]> = {
    "1-3": ["Great", "Nice", "Go"],
    "4-6": ["Strong", "Solid", "Yes"],
    "7-9": ["Awesome", "Wow", "Fire"],
    "10-19": ["Amazing", "Epic", "Legend"],
    "20-29": ["Incredible", "Unstoppable", "Pro"],
    "30-49": ["Insane", "Master", "Hero"],
    "50-99": ["Legendary", "Fantastic", "Great"],
    "100+": ["Amazing", "Incredible", "Unreal"],
};

function getEncouragementText(count: number): string {
    let range: string;

    if (count <= 3) range = "1-3";
    else if (count <= 6) range = "4-6";
    else if (count <= 9) range = "7-9";
    else if (count <= 19) range = "10-19";
    else if (count <= 29) range = "20-29";
    else if (count <= 49) range = "30-49";
    else if (count <= 99) range = "50-99";
    else range = "100+";

    const messages = encouragementMessages[range];
    const index = count % messages.length;
    return messages[index];
}

// Tiered streak visuals based on streak count
interface StreakTierStyle {
    emoji: string;
    bgColor: string;
    textColor: string;
}

function getStreakTierStyle(count: number): StreakTierStyle {
    if (count >= 100) {
        // Tier 3: 100+ days - Gold / Premium
        return {
            emoji: "✨",
            bgColor: "bg-[#FFF8E1]", // Golden yellow tone
            textColor: "text-[#B8860B]", // Dark goldenrod
        };
    } else if (count >= 50) {
        // Tier 2: 50-99 days - Green / Calm
        return {
            emoji: "🍀",
            bgColor: "bg-[#E8F5E9]", // Light green tone
            textColor: "text-[#2E7D32]", // Forest green
        };
    } else {
        // Tier 1: 1-49 days - Orange / Fire (current style)
        return {
            emoji: "🔥",
            bgColor: "bg-[#FFF3E8]", // Light orange
            textColor: "text-primary",
        };
    }
}

export function StreakBadge({ count, totalRecords, shouldShowStreak, petName, className }: StreakBadgeProps) {
    const { t } = useLanguage();

    const encouragementText = useMemo(() => {
        if (count > 0) {
            return getEncouragementText(count);
        }
        return "";
    }, [count]);

    const tierStyle = useMemo(() => getStreakTierStyle(count), [count]);

    // Determine display state
    const isActiveStreak = totalRecords > 0 && shouldShowStreak && count > 0;
    const isFirstTime = totalRecords === 0;
    const isStreakBroken = totalRecords > 0 && !shouldShowStreak;

    // Truncate pet name for display (max 12 chars with ellipsis)
    const displayPetName = petName && petName.length > 12
        ? petName.slice(0, 11) + "…"
        : petName;

    // Text for first-time users - localized
    const firstTimeText = displayPetName
        ? t("streakStartPetFirstMemory").replace("{petName}", displayPetName)
        : t("streakStartFirstMemory");

    // Text for returning users with broken streak - localized
    const returnText = displayPetName
        ? t("streakSavePetPhotoAgain").replace("{petName}", displayPetName)
        : t("streakSavePhotoAgain");

    return (
        <div className={cn("flex items-center justify-center pt-1 pb-2", className)}>
            <div
                className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors",
                    isActiveStreak
                        ? tierStyle.bgColor
                        : "bg-[hsl(30_30%_96%)]"  // Very light beige, same hue as card bg
                )}
            >
                {isActiveStreak ? (
                    // Active streak state - tiered visual style
                    <>
                        <span className={tierStyle.textColor}>{tierStyle.emoji}</span>
                        <span className={cn(tierStyle.textColor, "font-semibold")}>{count}</span>
                        <span className="text-muted-foreground font-normal">{t("streakDaysInARow")}</span>
                        <span className={cn(tierStyle.textColor, "font-medium ml-2")}>{encouragementText}!</span>
                    </>
                ) : isFirstTime ? (
                    // First-time user - never saved before
                    <>
                        <span className="text-sm">📸</span>
                        <span className="text-muted-foreground/70 font-medium">{firstTimeText}</span>
                    </>
                ) : (
                    // Returning user with broken streak (2+ days since last save)
                    <>
                        <span className="text-sm">📸</span>
                        <span className="text-muted-foreground/70 font-medium">{returnText}</span>
                    </>
                )}
            </div>
        </div>
    );
}
