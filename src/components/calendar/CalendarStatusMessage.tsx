import { useMemo } from "react";
import { MoodEntry } from "@/hooks/useMoodEntries";
import { differenceInCalendarDays, isSameDay, subDays } from "date-fns";
import { cn } from "@/lib/utils";

interface CalendarStatusMessageProps {
    entries: MoodEntry[];
    petName?: string;
}

export function CalendarStatusMessage({ entries, petName = "your pet" }: CalendarStatusMessageProps) {
    const status = useMemo(() => {
        if (!entries || entries.length === 0) {
            return {
                type: "new_user" as const,
                message: `📷 Start ${petName}'s first memory`,
                emoji: "📷",
                bg: "bg-orange-50 text-orange-600 border-orange-100"
            };
        }

        // Sort entries by date descending just to be safe (though usually already sorted)
        const sortedEntries = [...entries].sort((a, b) =>
            new Date(b.analyzed_at).getTime() - new Date(a.analyzed_at).getTime()
        );

        const today = new Date();
        const latestEntryDate = new Date(sortedEntries[0].analyzed_at);

        // Check if latest entry is from today or yesterday to count as active streak
        // If latest entry is older than yesterday, streak is broken
        const daysSinceLastEntry = differenceInCalendarDays(today, latestEntryDate);

        // Broken streak condition: 2 or more days of inactivity (so gap > 1)
        // If gap is 0 (today) or 1 (yesterday), streak is effectively active/continuing.
        if (daysSinceLastEntry >= 2) {
            return {
                type: "broken" as const,
                message: `Save ${petName}'s photo again!`,
                emoji: "📷",
                bg: "bg-[#F3F4F6] text-[#4B5563] border-transparent",
                streak: 0
            };
        }

        // Calculate Streak
        let streak = 0;
        const entryDates = new Set(sortedEntries.map(e =>
            new Date(e.analyzed_at).toISOString().split('T')[0]
        ));

        // Start checking from TODAY if there's an entry today, or from yesterday
        const todayStr = today.toISOString().split('T')[0];
        const yesterday = subDays(today, 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        let checkDate = entryDates.has(todayStr) ? today : (entryDates.has(yesterdayStr) ? yesterday : null);

        if (checkDate) {
            streak = 1;
            while (true) {
                checkDate = subDays(checkDate, 1);
                const checkDateStr = checkDate.toISOString().split('T')[0];
                if (entryDates.has(checkDateStr)) {
                    streak++;
                } else {
                    break;
                }
            }
        }

        // If no active streak (didn't find entry today or yesterday), it's "broken" or "new"
        if (streak === 0) {
            return {
                type: "broken" as const,
                message: `Save ${petName}'s photo again!`,
                emoji: "📷",
                bg: "bg-[#F3F4F6] text-[#4B5563] border-transparent",
                streak: 0
            };
        }

        // Tier Logic
        let tier = {
            emoji: "🔥",
            bg: "bg-orange-50 text-orange-600 border-orange-100",
            exclamations: ["Nice!", "Great!", "Keep it up!", "On fire!", "Wow!"]
        };

        if (streak >= 100) {
            tier = {
                emoji: "✨",
                bg: "bg-yellow-50 text-yellow-600 border-yellow-100",
                exclamations: ["Amazing!", "Legendary!", "Unstoppable!", "Spectacular!"]
            };
        } else if (streak >= 50) {
            tier = {
                emoji: "🍀",
                bg: "bg-green-50 text-green-600 border-green-100",
                exclamations: ["Awesome!", "Superb!", "Fantastic!", "Wonderful!"]
            };
        }

        // Rotating exclamation based on day of month to be consistent but changing
        const dayOfMonth = today.getDate();
        const exclamation = tier.exclamations[dayOfMonth % tier.exclamations.length];

        return {
            type: "streak" as const,
            streak,
            message: `${streak} days in a row`,
            emoji: tier.emoji,
            bg: tier.bg,
            exclamation
        };

    }, [entries, petName]);

    return (
        <div className="flex justify-center mb-6">
            <div className={cn(
                "inline-flex items-center justify-center gap-2 px-6 py-2 rounded-full shadow-sm transition-all",
                status.bg
            )}>
                <span className="text-lg animate-bounce-gentle">
                    {status.emoji}
                </span>
                <span className="font-semibold text-sm">
                    <span className="font-bold text-[#F26322]">{status.streak}</span>
                    <span className="text-[#432C23]/80 ml-1">days in a row</span>
                </span>
                {status.type === "streak" && (
                    <span className="text-sm font-bold text-[#F26322] ml-1">
                        {status.exclamation}
                    </span>
                )}
            </div>
        </div>
    );
}
