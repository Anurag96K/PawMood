import { useState, useEffect, useMemo } from "react";
import { startOfWeek, format } from "date-fns";
import { MoodEntry } from "./useMoodEntries";

const STORAGE_KEY = "weekly_hero_photos";
const MIN_DAYS_REQUIRED = 5;

// Weekly locked visuals for screens 1 and 5
interface WeeklyLockData {
  photoUrl: string;
  entryId: string;
  selectedAt: string; // ISO timestamp when selection was made
  // Screen 5 (outro) locked background
  outroBackground: string;
}

interface WeeklyHeroStore {
  [weekKey: string]: WeeklyLockData;
}

/**
 * Scores a photo based on quality indicators from analysis.
 * Higher score = better candidate for hero photo.
 * 
 * Priority:
 * 1. Confidence score (higher = clearer pet face visible)
 * 2. Not too dark (inferred from mood - anxious/tired/sleepy often darker photos)
 * 3. Random tiebreaker for equal candidates
 */
function scorePhoto(entry: MoodEntry): number {
  let score = 0;
  
  // Confidence is a good proxy for face visibility (0-100 scale typically)
  score += (entry.confidence || 0) * 2;
  
  // Mood-based brightness inference
  // Positive/active moods tend to have better lighting
  const mood = entry.mood?.toLowerCase() || "";
  const brightMoods = ["playful", "happy", "joyful", "excited", "energetic", "curious"];
  const neutralMoods = ["content", "relaxed", "calm", "peaceful", "alert"];
  const darkMoods = ["tired", "sleepy", "anxious", "worried"];
  
  if (brightMoods.some(m => mood.includes(m))) {
    score += 30;
  } else if (neutralMoods.some(m => mood.includes(m))) {
    score += 20;
  } else if (darkMoods.some(m => mood.includes(m))) {
    score += 5; // Lower score for typically darker photos
  } else {
    score += 15; // Default
  }
  
  // Add small random factor for variety among equal candidates (0-10)
  score += Math.random() * 10;
  
  return score;
}

/**
 * Get the week key for a given date (Monday-based weeks)
 */
function getWeekKey(date: Date = new Date()): string {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday
  return format(weekStart, "yyyy-MM-dd");
}

/**
 * Generate a stable outro background for this week
 */
function generateOutroBackground(): string {
  const outroBackgrounds = [
    "linear-gradient(135deg, hsl(30 60% 94%) 0%, hsl(35 55% 91%) 100%)", // Warm peach
    "linear-gradient(135deg, hsl(45 50% 94%) 0%, hsl(40 45% 92%) 100%)", // Soft cream
    "linear-gradient(135deg, hsl(25 65% 93%) 0%, hsl(20 60% 90%) 100%)", // Light coral
    "linear-gradient(135deg, hsl(35 55% 95%) 0%, hsl(30 50% 93%) 100%)", // Gentle beige
    "linear-gradient(135deg, hsl(15 70% 94%) 0%, hsl(20 65% 91%) 100%)", // Soft apricot
  ];
  
  // Random selection at lock time
  const index = Math.floor(Math.random() * outroBackgrounds.length);
  return outroBackgrounds[index];
}

/**
 * Load stored weekly hero photos from localStorage
 */
function loadStore(): WeeklyHeroStore {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Save weekly hero photos to localStorage
 */
function saveStore(store: WeeklyHeroStore): void {
  try {
    // Clean up old weeks (keep only last 8 weeks to prevent bloat)
    const sortedWeeks = Object.keys(store).sort().reverse();
    const cleanedStore: WeeklyHeroStore = {};
    sortedWeeks.slice(0, 8).forEach(key => {
      cleanedStore[key] = store[key];
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedStore));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Check if selection is already locked for this week
 */
export function isWeeklyHeroPhotoLocked(weekKey?: string): boolean {
  const key = weekKey || getWeekKey();
  const store = loadStore();
  return !!store[key];
}

/**
 * Get the current weekly locked data if one exists
 */
export function getLockedWeeklyData(weekKey?: string): WeeklyLockData | null {
  const key = weekKey || getWeekKey();
  const store = loadStore();
  return store[key] || null;
}

/**
 * Get the current weekly hero photo if one is locked (legacy helper)
 */
export function getLockedHeroPhoto(weekKey?: string): { photoUrl: string; entryId: string } | null {
  const data = getLockedWeeklyData(weekKey);
  if (data) {
    return { photoUrl: data.photoUrl, entryId: data.entryId };
  }
  return null;
}

/**
 * IMPERATIVE: Check threshold and select hero photo if just reached.
 * Call this immediately after a new entry is saved.
 * 
 * Returns true if a new selection was made, false if already locked or not enough data.
 */
export function checkAndSelectHeroPhoto(entries: MoodEntry[]): boolean {
  const weekKey = getWeekKey();
  const store = loadStore();
  
  // Already have selection for this week - don't change it
  if (store[weekKey]) {
    console.log("[checkAndSelectHeroPhoto] Already locked for week", weekKey);
    return false;
  }
  
  // Filter entries to current week
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weeklyEntries = entries.filter(entry => {
    const entryDate = new Date(entry.analyzed_at);
    return entryDate >= weekStart;
  });
  
  // Count distinct days
  const uniqueDays = new Set(
    weeklyEntries.map(e => format(new Date(e.analyzed_at), "yyyy-MM-dd"))
  );
  const distinctDaysCount = uniqueDays.size;
  
  // Not enough days yet
  if (distinctDaysCount < MIN_DAYS_REQUIRED) {
    console.log("[checkAndSelectHeroPhoto] Not enough days yet:", distinctDaysCount, "/", MIN_DAYS_REQUIRED);
    return false;
  }
  
  // No photos to choose from
  if (weeklyEntries.length === 0) {
    return false;
  }
  
  // THRESHOLD JUST REACHED! Select best photo from all available
  console.log("[checkAndSelectHeroPhoto] Threshold reached! Selecting hero photo from", weeklyEntries.length, "candidates");
  
  // Score all photos and pick the best one
  const scoredEntries = weeklyEntries
    .filter(e => e.image_url) // Must have image
    .map(entry => ({
      entry,
      score: scorePhoto(entry),
    }))
    .sort((a, b) => b.score - a.score); // Highest score first
  
  if (scoredEntries.length === 0) {
    console.log("[checkAndSelectHeroPhoto] No valid photos found");
    return false;
  }
  
  const selected = scoredEntries[0].entry;
  console.log("[checkAndSelectHeroPhoto] Selected photo:", {
    entryId: selected.id,
    mood: selected.mood,
    confidence: selected.confidence,
    score: scoredEntries[0].score,
  });
  
  // Lock this selection with all visual data for screens 1 and 5
  const newStore: WeeklyHeroStore = {
    ...store,
    [weekKey]: {
      photoUrl: selected.image_url,
      entryId: selected.id,
      selectedAt: new Date().toISOString(),
      outroBackground: generateOutroBackground(),
    },
  };
  
  saveStore(newStore);
  return true;
}

/**
 * Hook to READ the weekly hero photo and locked visuals (does not trigger selection).
 * Selection should be triggered via checkAndSelectHeroPhoto() when entries change.
 */
export function useWeeklyHeroPhoto(
  entries: MoodEntry[],
  hasEnoughData: boolean
): {
  heroPhotoUrl: string | undefined;
  heroEntryId: string | undefined;
  isSelectionLocked: boolean;
  lockedOutroBackground: string | undefined;
  isImagePreloaded: boolean;
} {
  const [store, setStore] = useState<WeeklyHeroStore>(loadStore);
  const [isImagePreloaded, setIsImagePreloaded] = useState(false);
  
  const weekKey = useMemo(() => getWeekKey(), []);
  
  // Sync store from localStorage on mount and when entries change
  // (in case selection was made elsewhere)
  useEffect(() => {
    const refreshedStore = loadStore();
    setStore(refreshedStore);
  }, [entries]);
  
  // Filter entries to current week (for fallback only)
  const weeklyEntries = useMemo(() => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    return entries.filter(entry => {
      const entryDate = new Date(entry.analyzed_at);
      return entryDate >= weekStart;
    });
  }, [entries]);
  
  // Check if we have a locked selection for this week
  const existingSelection = store[weekKey];
  
  // Determine the hero photo URL (locked or fallback)
  const heroData = useMemo(() => {
    // If we have a locked selection, use it
    if (existingSelection) {
      // Validate the photo still exists in entries (in case it was deleted)
      const stillExists = entries.some(e => e.id === existingSelection.entryId);
      
      if (stillExists) {
        return {
          heroPhotoUrl: existingSelection.photoUrl,
          heroEntryId: existingSelection.entryId,
          isSelectionLocked: true,
          lockedOutroBackground: existingSelection.outroBackground,
        };
      } else {
        // Photo was deleted - clear selection so it can be re-selected
        console.log("[useWeeklyHeroPhoto] Locked photo was deleted, clearing selection");
        const newStore = { ...store };
        delete newStore[weekKey];
        saveStore(newStore);
      }
    }
    
    // Fallback: if no locked selection yet but we have data, show best candidate
    // (Selection should have been triggered by checkAndSelectHeroPhoto, but just in case)
    if (weeklyEntries.length > 0 && hasEnoughData) {
      const scoredEntries = weeklyEntries
        .filter(e => e.image_url)
        .map(entry => ({
          entry,
          score: scorePhoto(entry),
        }))
        .sort((a, b) => b.score - a.score);
      
      if (scoredEntries.length > 0) {
        return {
          heroPhotoUrl: scoredEntries[0].entry.image_url,
          heroEntryId: scoredEntries[0].entry.id,
          isSelectionLocked: false,
          lockedOutroBackground: undefined,
        };
      }
    }
    
    return {
      heroPhotoUrl: undefined,
      heroEntryId: undefined,
      isSelectionLocked: false,
      lockedOutroBackground: undefined,
    };
  }, [existingSelection, entries, store, weekKey, weeklyEntries, hasEnoughData]);
  
  // Preload the hero image
  useEffect(() => {
    setIsImagePreloaded(false);
    
    if (!heroData.heroPhotoUrl) {
      return;
    }
    
    const img = new Image();
    img.onload = () => {
      setIsImagePreloaded(true);
    };
    img.onerror = () => {
      // Even on error, mark as "preloaded" so we don't block the UI
      setIsImagePreloaded(true);
    };
    img.src = heroData.heroPhotoUrl;
    
    // Cleanup
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [heroData.heroPhotoUrl]);
  
  return {
    ...heroData,
    isImagePreloaded,
  };
}

/**
 * Utility to manually clear the hero photo selection for a week.
 * Useful for testing or if user wants to re-select.
 */
export function clearWeeklyHeroPhoto(weekKey?: string): void {
  const key = weekKey || getWeekKey();
  const store = loadStore();
  delete store[key];
  saveStore(store);
}
