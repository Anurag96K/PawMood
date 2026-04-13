import { startOfWeek, startOfMonth, startOfYear, format } from "date-fns";
import { useMemo, useState, useEffect } from "react";
import { MoodEntry } from "@/hooks/useMoodEntries";
import { ReportPeriod, ReportData, MIN_DATA_REQUIREMENTS } from "@/components/report/ReportTypes";

export interface ReportDataWithStatus extends ReportData {
    status: "loading" | "ready" | "insufficient";
}

export function useReportData(entries: MoodEntry[], period: ReportPeriod, isLoading: boolean = false): ReportDataWithStatus {
    return useMemo(() => {
        if (isLoading) {
            return {
                totalEntries: 0,
                distinctDays: 0,
                periodLabel: "",
                periodSubtext: "",
                dominantMood: { mood: "Loading", count: 0, emoji: "⏳" },
                moodPercentages: [],
                sortedMoods: [],
                periodImageUrls: [],
                hasEnoughData: false,
                minRequired: MIN_DATA_REQUIREMENTS[period],
                status: "loading" as const,
            };
        }

        const now = new Date();

        const convertedEntries = entries.map(entry => ({
            date: new Date(entry.analyzed_at),
            emoji: entry.mood_emoji,
            moodText: entry.mood,
            imageUrl: entry.image_url,
        }));

        let periodStart: Date;
        let periodLabel: string;
        let periodSubtext: string;

        switch (period) {
            case "weekly":
                periodStart = startOfWeek(now, { weekStartsOn: 1 });
                periodLabel = "This Week";
                periodSubtext = "Your pet's mood journey over the past 7 days";
                break;
            case "monthly":
                periodStart = startOfMonth(now);
                periodLabel = "This Month";
                periodSubtext = "A summary of your pet's emotional patterns this month";
                break;
            case "yearly":
                periodStart = startOfYear(now);
                periodLabel = "This Year";
                periodSubtext = "Your pet's mood story throughout the year";
                break;
        }

        const filteredEntries = convertedEntries.filter(e => e.date >= periodStart);

        const uniqueDays = new Set(
            filteredEntries.map(e => format(e.date, "yyyy-MM-dd"))
        );
        const distinctDaysCount = uniqueDays.size;

        const moodCounts: Record<string, { count: number; emoji: string; imageUrls: string[] }> = {};
        const periodImageUrls: string[] = [];

        filteredEntries.forEach(entry => {
            const mood = entry.moodText || "Unknown";
            if (!moodCounts[mood]) {
                moodCounts[mood] = { count: 0, emoji: entry.emoji, imageUrls: [] };
            }
            moodCounts[mood].count += 1;

            if (entry.imageUrl) {
                periodImageUrls.push(entry.imageUrl);
            }

            if (entry.imageUrl && moodCounts[mood].imageUrls.length < 6) {
                moodCounts[mood].imageUrls.push(entry.imageUrl);
            }
        });

        const sortedMoods = Object.entries(moodCounts)
            .sort(([, a], [, b]) => b.count - a.count)
            .map(([mood, data]) => ({ mood, ...data }));

        const dominantMood = sortedMoods[0] || { mood: "No data", count: 0, emoji: "📊" };

        const totalCount = filteredEntries.length;
        const moodPercentages = sortedMoods.map(m => ({
            ...m,
            percentage: totalCount > 0 ? Math.round((m.count / totalCount) * 100) : 0
        }));

        const minRequired = MIN_DATA_REQUIREMENTS[period];
        const hasEnoughData = distinctDaysCount >= minRequired;
        const status: "ready" | "insufficient" = hasEnoughData ? "ready" : "insufficient";

        return {
            totalEntries: totalCount,
            distinctDays: distinctDaysCount,
            periodLabel,
            periodSubtext,
            dominantMood,
            moodPercentages,
            sortedMoods,
            periodImageUrls,
            hasEnoughData,
            minRequired,
            status,
        };
    }, [entries, period, isLoading]);
}
