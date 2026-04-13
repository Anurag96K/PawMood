import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "hasDismissedCalendarTapHint";

/**
 * Hook to manage the calendar tap hint visibility.
 * Once dismissed, the hint will NEVER appear again - persisted via localStorage.
 * This ensures consistent UI across refreshes, reloads, and setting changes.
 */
export function useCalendarHint() {
    // Initialize directly from localStorage (synchronous read on first render)
    const [hasDismissed, setHasDismissed] = useState<boolean>(() => {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored === "true";
        }
        return false;
    });

    // Sync with localStorage on mount to catch any external changes
    useEffect(() => {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored === "true" && !hasDismissed) {
                setHasDismissed(true);
            }
        }
    }, []);

    // Permanently dismiss hint (persists across app restarts, refreshes, setting changes)
    const dismissHint = useCallback(() => {
        if (!hasDismissed) {
            setHasDismissed(true);
            // Write to localStorage immediately to ensure persistence
            try {
                localStorage.setItem(STORAGE_KEY, "true");
            } catch (e) {
                console.error("Failed to persist calendar hint state:", e);
            }
        }
    }, [hasDismissed]);

    return {
        hasDismissedHint: hasDismissed,
        dismissHint,
    };
}
