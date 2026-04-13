import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "primary_photos";

type PrimaryPhotoMap = Record<string, string>; // dateKey -> entryId

/**
 * Hook to manage which photo is the "primary" (representative) for each calendar day.
 * Persists to localStorage so it survives app restarts.
 */
export function usePrimaryPhoto() {
    const [primaryMap, setPrimaryMap] = useState<PrimaryPhotoMap>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : {};
        } catch {
            return {};
        }
    });

    // Persist to localStorage whenever the map changes
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(primaryMap));
        } catch {
            // Ignore storage errors
        }
    }, [primaryMap]);

    /**
     * Set the primary photo for a given date.
     * @param dateKey YYYY-MM-DD format
     * @param entryId The entry ID to set as primary
     */
    const setPrimaryPhoto = useCallback((dateKey: string, entryId: string) => {
        setPrimaryMap((prev) => ({
            ...prev,
            [dateKey]: entryId,
        }));
    }, []);

    /**
     * Get the primary photo ID for a given date, or undefined if none set.
     */
    const getPrimaryPhoto = useCallback(
        (dateKey: string): string | undefined => {
            return primaryMap[dateKey];
        },
        [primaryMap]
    );

    /**
     * Remove the primary photo setting for a given date (revert to default).
     */
    const clearPrimaryPhoto = useCallback((dateKey: string) => {
        setPrimaryMap((prev) => {
            const next = { ...prev };
            delete next[dateKey];
            return next;
        });
    }, []);

    return {
        setPrimaryPhoto,
        getPrimaryPhoto,
        clearPrimaryPhoto,
    };
}
