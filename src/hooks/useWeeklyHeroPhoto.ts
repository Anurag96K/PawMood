import { useState, useEffect, useMemo } from "react";
import { startOfWeek, format } from "date-fns";
import { MoodEntry } from "./useMoodEntries";

const STORAGE_KEY = "weekly_hero_photos";
const MIN_DAYS_REQUIRED = 5;

interface WeeklyLockData {
    photoUrl: string;
    entryId: string;
    selectedAt: string;
    introBackground: string;
    outroBackground: string;
}

interface WeeklyHeroStore {
    [weekKey: string]: WeeklyLockData;
}

function scorePhoto(entry: MoodEntry): number {
    let score = 0;
    score += (entry.confidence || 0) * 2;

    const mood = entry.mood?.toLowerCase() || "";
    const brightMoods = ["playful", "happy", "joyful", "excited", "energetic", "curious"];
    const neutralMoods = ["content", "relaxed", "calm", "peaceful", "alert"];
    const darkMoods = ["tired", "sleepy", "anxious", "worried"];

    if (brightMoods.some(m => mood.includes(m))) {
        score += 30;
    } else if (neutralMoods.some(m => mood.includes(m))) {
        score += 20;
    } else if (darkMoods.some(m => mood.includes(m))) {
        score += 5;
    } else {
        score += 15;
    }

    score += Math.random() * 10;
    return score;
}

function getWeekKey(date: Date = new Date()): string {
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    return format(weekStart, "yyyy-MM-dd");
}

function generateOutroBackground(): string {
    const outroBackgrounds = [
        "linear-gradient(135deg, hsl(30 60% 94%) 0%, hsl(35 55% 91%) 100%)",
        "linear-gradient(135deg, hsl(45 50% 94%) 0%, hsl(40 45% 92%) 100%)",
        "linear-gradient(135deg, hsl(25 65% 93%) 0%, hsl(20 60% 90%) 100%)",
        "linear-gradient(135deg, hsl(35 55% 95%) 0%, hsl(30 50% 93%) 100%)",
        "linear-gradient(135deg, hsl(15 70% 94%) 0%, hsl(20 65% 91%) 100%)",
    ];
    return outroBackgrounds[Math.floor(Math.random() * outroBackgrounds.length)];
}

function generateIntroBackground(): string {
    const introBackgrounds = [
        "linear-gradient(135deg, hsl(10 80% 92%) 0%, hsl(20 75% 88%) 100%)",
        "linear-gradient(135deg, hsl(160 60% 92%) 0%, hsl(170 55% 88%) 100%)",
        "linear-gradient(135deg, hsl(200 70% 92%) 0%, hsl(210 65% 88%) 100%)",
        "linear-gradient(135deg, hsl(280 50% 92%) 0%, hsl(290 45% 88%) 100%)",
        "linear-gradient(135deg, hsl(40 85% 90%) 0%, hsl(50 80% 86%) 100%)",
    ];
    return introBackgrounds[Math.floor(Math.random() * introBackgrounds.length)];
}

function loadStore(): WeeklyHeroStore {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch {
        return {};
    }
}

function saveStore(store: WeeklyHeroStore): void {
    try {
        const sortedWeeks = Object.keys(store).sort().reverse();
        const cleanedStore: WeeklyHeroStore = {};
        sortedWeeks.slice(0, 8).forEach(key => {
            cleanedStore[key] = store[key];
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedStore));
    } catch { }
}

export function isWeeklyHeroPhotoLocked(weekKey?: string): boolean {
    const key = weekKey || getWeekKey();
    const store = loadStore();
    return !!store[key];
}

export function checkAndSelectHeroPhoto(entries: MoodEntry[]): boolean {
    const weekKey = getWeekKey();
    const store = loadStore();

    if (store[weekKey]) return false;

    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weeklyEntries = entries.filter(entry => {
        const entryDate = new Date(entry.analyzed_at);
        return entryDate >= weekStart;
    });

    const uniqueDays = new Set(
        weeklyEntries.map(e => format(new Date(e.analyzed_at), "yyyy-MM-dd"))
    );

    if (uniqueDays.size < MIN_DAYS_REQUIRED || weeklyEntries.length === 0) return false;

    const scoredEntries = weeklyEntries
        .filter(e => e.image_url)
        .map(entry => ({
            entry,
            score: scorePhoto(entry),
        }))
        .sort((a, b) => b.score - a.score);

    if (scoredEntries.length === 0) return false;

    const selected = scoredEntries[0].entry;
    const newStore = {
        ...store,
        [weekKey]: {
            photoUrl: selected.image_url,
            entryId: selected.id,
            selectedAt: new Date().toISOString(),
            introBackground: generateIntroBackground(),
            outroBackground: generateOutroBackground(),
        },
    };

    saveStore(newStore);
    return true;
}

export function useWeeklyHeroPhoto(
    entries: MoodEntry[],
    hasEnoughData: boolean
): {
    heroPhotoUrl: string | undefined;
    heroEntryId: string | undefined;
    isSelectionLocked: boolean;
    lockedIntroBackground: string | undefined;
    lockedOutroBackground: string | undefined;
    isImagePreloaded: boolean;
} {
    const [store, setStore] = useState<WeeklyHeroStore>(loadStore);
    const [isImagePreloaded, setIsImagePreloaded] = useState(false);
    const weekKey = useMemo(() => getWeekKey(), []);

    useEffect(() => {
        setStore(loadStore());
    }, [entries]);

    const weeklyEntries = useMemo(() => {
        const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
        return entries.filter(entry => new Date(entry.analyzed_at) >= weekStart);
    }, [entries]);

    const existingSelection = store[weekKey];

    const heroData = useMemo(() => {
        if (existingSelection) {
            const stillExists = entries.some(e => e.id === existingSelection.entryId);
            if (stillExists) {
                return {
                    heroPhotoUrl: existingSelection.photoUrl,
                    heroEntryId: existingSelection.entryId,
                    isSelectionLocked: true,
                    lockedIntroBackground: existingSelection.introBackground,
                    lockedOutroBackground: existingSelection.outroBackground,
                };
            } else {
                const newStore = { ...store };
                delete newStore[weekKey];
                saveStore(newStore);
            }
        }

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
                    lockedIntroBackground: undefined,
                    lockedOutroBackground: undefined,
                };
            }
        }

        return {
            heroPhotoUrl: undefined,
            heroEntryId: undefined,
            isSelectionLocked: false,
            lockedIntroBackground: undefined,
            lockedOutroBackground: undefined,
        };
    }, [existingSelection, entries, store, weekKey, weeklyEntries, hasEnoughData]);

    useEffect(() => {
        setIsImagePreloaded(false);
        if (!heroData.heroPhotoUrl) return;

        const img = new Image();
        img.onload = () => setIsImagePreloaded(true);
        img.onerror = () => setIsImagePreloaded(true);
        img.src = heroData.heroPhotoUrl;

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
