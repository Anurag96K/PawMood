import { useMemo } from "react";
import { MoodEntry } from "./useMoodEntries";

/**
 * Calculate consecutive days streak from mood entries
 * With delayed reset: 1 day grace period before resetting
 */
export function useStreak(entries: MoodEntry[]) {
    const result = useMemo(() => {
        const totalRecords = entries.length;

        if (totalRecords === 0) {
            return { streakCount: 0, totalRecords: 0, shouldShowStreak: false };
        }

        // Get unique dates with entries (normalized to start of day)
        const datesWithEntries = new Set<string>();
        entries.forEach((entry) => {
            const date = new Date(entry.analyzed_at);
            const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
            datesWithEntries.add(dateKey);
        });

        // Sort dates descending (most recent first)
        const sortedDates = Array.from(datesWithEntries).sort((a, b) => b.localeCompare(a));

        if (sortedDates.length === 0) {
            return { streakCount: 0, totalRecords, shouldShowStreak: false };
        }

        // Get today's date key
        const today = new Date();
        const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

        // Get last record date
        const lastRecordDateKey = sortedDates[0];
        const lastRecordDate = new Date(lastRecordDateKey + "T00:00:00");
        const todayDate = new Date(todayKey + "T00:00:00");

        // Calculate days since last record
        const daysDiff = Math.floor((todayDate.getTime() - lastRecordDate.getTime()) / (1000 * 60 * 60 * 24));

        // If 2 or more days have passed, streak is broken - show empty state
        if (daysDiff >= 2) {
            return { streakCount: 0, totalRecords, shouldShowStreak: false };
        }

        // Calculate streak counting backward from last record date
        let streak = 1;
        let currentDate = new Date(lastRecordDate);

        // Count consecutive days backward
        for (let i = 1; i < sortedDates.length; i++) {
            // Move to previous day
            currentDate.setDate(currentDate.getDate() - 1);
            const expectedDateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;

            if (datesWithEntries.has(expectedDateKey)) {
                streak++;
            } else {
                // Streak broken
                break;
            }
        }

        return { streakCount: streak, totalRecords, shouldShowStreak: true };
    }, [entries]);

    return result;
}
