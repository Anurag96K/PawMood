import { useMemo } from "react";
import { MoodEntry as MoodEntryRaw } from "./useMoodEntries";
import { ReportPeriod, ReportData, MIN_DATA_REQUIREMENTS, MoodEntry } from "@/components/report/ReportTypes";
import { startOfWeek, startOfMonth, startOfYear, format } from "date-fns";

export interface ReportDataWithStatus extends ReportData {
  /** 
   * Status of data computation:
   * - "loading": Data is still being computed (should not happen with useMemo, but for safety)
   * - "ready": Threshold met, report can be shown
   * - "insufficient": Not enough data for this period
   */
  status: "loading" | "ready" | "insufficient";
}

export function useReportData(entries: MoodEntryRaw[], period: ReportPeriod, isLoading: boolean = false): ReportDataWithStatus {
  return useMemo(() => {
    // If entries are still loading, return loading status
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
    
    // Convert raw entries to report format (include image URL for thumbnails)
    const convertedEntries = entries.map(entry => ({
      date: new Date(entry.analyzed_at),
      emoji: entry.mood_emoji,
      moodText: entry.mood,
      imageUrl: entry.image_url,
    }));

    // Get period start date
    let periodStart: Date;
    let periodLabel: string;
    let periodSubtext: string;

    switch (period) {
      case "weekly":
        // Monday as start of week
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

    // Filter entries within period
    const filteredEntries = convertedEntries.filter(e => e.date >= periodStart);

    // Count DISTINCT days (multiple analyses on same day count as 1)
    const uniqueDays = new Set(
      filteredEntries.map(e => format(e.date, "yyyy-MM-dd"))
    );
    const distinctDaysCount = uniqueDays.size;

    // Calculate mood distribution with image URLs for thumbnails
    const moodCounts: Record<string, { count: number; emoji: string; imageUrls: string[] }> = {};
    const periodImageUrls: string[] = [];

    filteredEntries.forEach(entry => {
      const mood = entry.moodText || "Unknown";
      if (!moodCounts[mood]) {
        moodCounts[mood] = { count: 0, emoji: entry.emoji, imageUrls: [] };
      }
      moodCounts[mood].count += 1;

      // Collect all period images (used for falling animation)
      if (entry.imageUrl) {
        periodImageUrls.push(entry.imageUrl);
      }

      // Collect per-mood image URLs (limit to first 6 for performance)
      if (entry.imageUrl && moodCounts[mood].imageUrls.length < 6) {
        moodCounts[mood].imageUrls.push(entry.imageUrl);
      }
    });

    // Sort moods by count
    const sortedMoods = Object.entries(moodCounts)
      .sort(([, a], [, b]) => b.count - a.count)
      .map(([mood, data]) => ({ mood, ...data }));

    // Find dominant mood
    const dominantMood = sortedMoods[0] || { mood: "No data", count: 0, emoji: "📊" };

    // Calculate percentages
    const totalCount = filteredEntries.length;
    const moodPercentages = sortedMoods.map(m => ({
      ...m,
      percentage: totalCount > 0 ? Math.round((m.count / totalCount) * 100) : 0
    }));

    const minRequired = MIN_DATA_REQUIREMENTS[period];
    const hasEnoughData = distinctDaysCount >= minRequired;

    // Determine status based on data availability
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
