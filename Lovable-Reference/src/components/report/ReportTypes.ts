// Report type definitions

export type ReportPeriod = "weekly" | "monthly" | "yearly";

export interface MoodEntry {
  date: Date;
  emoji: string;
  moodText?: string;
}

export interface MoodCount {
  mood: string;
  count: number;
  emoji: string;
  percentage: number;
  /** Image URLs of entries contributing to this mood (for visual thumbnails) */
  imageUrls: string[];
}

export interface ReportData {
  totalEntries: number;
  distinctDays: number;
  periodLabel: string;
  periodSubtext: string;
  dominantMood: { mood: string; count: number; emoji: string };
  moodPercentages: MoodCount[];
  sortedMoods: { mood: string; count: number; emoji: string }[];
  /** All image URLs in the selected period (used for animations like FallingPhotos) */
  periodImageUrls: string[];
  hasEnoughData: boolean;
  minRequired: number;
}

export interface ReportScene {
  id: string;
  type: "intro" | "stat" | "dominant" | "breakdown" | "insight" | "outro";
  duration: number; // seconds
}

// Minimum DISTINCT DAYS required per period (based on 5/7 ≈ 71% consistency rule)
export const MIN_DATA_REQUIREMENTS: Record<ReportPeriod, number> = {
  weekly: 5,    // 5 out of 7 days
  monthly: 21,  // ~71% of ~30 days
  yearly: 260,  // ~71% of 365 days
};

// Period configurations
export const PERIOD_CONFIG: Record<ReportPeriod, {
  label: string;
  ctaText: (petName: string) => string;
}> = {
  weekly: {
    label: "This Week",
    ctaText: (petName) => `Tap to view ${petName}'s mood analysis from the past week!`,
  },
  monthly: {
    label: "This Month",
    ctaText: (petName) => `Tap to view ${petName}'s mood analysis from this month!`,
  },
  yearly: {
    label: "This Year",
    ctaText: (petName) => `Tap to view ${petName}'s mood journey this year!`,
  },
};
