import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";

interface BadgeContextType {
  // Total unread count across all dates
  totalUnreadCount: number;
  // Track unread entry IDs
  unreadEntryIds: Set<string>;
  // Add an entry as unread
  addUnreadEntry: (entryId: string, date: Date) => void;
  // Mark a specific entry as read
  markEntryAsRead: (entryId: string) => void;
  // Get unread count for a specific date
  getUnreadCountForDate: (date: Date) => number;
  // Get unread entry IDs for a specific date
  getUnreadEntriesForDate: (date: Date) => string[];
  // Check if an entry is unread
  isEntryUnread: (entryId: string) => boolean;
  // Clear all badges
  clearAllBadges: () => void;

  // Legacy support
  newEntriesCount: number;
  addNewEntry: (date: Date, entryId?: string) => void;
  clearBadges: () => void;
  clearEntryBadge: (date: Date) => void;
  hasNewEntryForDate: (date: Date) => boolean;
  removeOptimisticEntry?: (entryId: string) => void;
}

interface UnreadEntry {
  entryId: string;
  dateKey: string; // YYYY-MM-DD format
}

const BadgeContext = createContext<BadgeContextType | undefined>(undefined);

const STORAGE_KEY = "unread_entries";

export function BadgeProvider({ children }: { children: ReactNode }) {
  const [unreadEntries, setUnreadEntries] = useState<UnreadEntry[]>(() => {
    // Load from localStorage on init
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to load unread entries from storage:", e);
    }
    return [];
  });

  // Persist to localStorage whenever unreadEntries changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(unreadEntries));
    } catch (e) {
      console.error("Failed to save unread entries to storage:", e);
    }
  }, [unreadEntries]);

  const formatDateKey = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const addUnreadEntry = useCallback((entryId: string, date: Date) => {
    const dateKey = formatDateKey(date);
    setUnreadEntries(prev => {
      // Avoid duplicates
      if (prev.some(e => e.entryId === entryId)) {
        return prev;
      }
      return [...prev, { entryId, dateKey }];
    });
  }, []);

  const markEntryAsRead = useCallback((entryId: string) => {
    setUnreadEntries(prev => prev.filter(e => e.entryId !== entryId));
  }, []);

  const getUnreadCountForDate = useCallback((date: Date): number => {
    const dateKey = formatDateKey(date);
    return unreadEntries.filter(e => e.dateKey === dateKey).length;
  }, [unreadEntries]);

  const getUnreadEntriesForDate = useCallback((date: Date): string[] => {
    const dateKey = formatDateKey(date);
    return unreadEntries.filter(e => e.dateKey === dateKey).map(e => e.entryId);
  }, [unreadEntries]);

  const isEntryUnread = useCallback((entryId: string): boolean => {
    return unreadEntries.some(e => e.entryId === entryId);
  }, [unreadEntries]);

  const clearAllBadges = useCallback(() => {
    setUnreadEntries([]);
  }, []);

  // Legacy support functions
  const addNewEntry = useCallback((date: Date, entryId?: string) => {
    if (entryId) {
      addUnreadEntry(entryId, date);
    }
  }, [addUnreadEntry]);

  const clearBadges = useCallback(() => {
    clearAllBadges();
  }, [clearAllBadges]);

  const clearEntryBadge = useCallback((date: Date) => {
    const dateKey = formatDateKey(date);
    setUnreadEntries(prev => prev.filter(e => e.dateKey !== dateKey));
  }, []);

  const hasNewEntryForDate = useCallback((date: Date): boolean => {
    return getUnreadCountForDate(date) > 0;
  }, [getUnreadCountForDate]);

  const unreadEntryIds = new Set(unreadEntries.map(e => e.entryId));
  const totalUnreadCount = unreadEntries.length;

  return (
    <BadgeContext.Provider value={{
      totalUnreadCount,
      unreadEntryIds,
      addUnreadEntry,
      markEntryAsRead,
      getUnreadCountForDate,
      getUnreadEntriesForDate,
      isEntryUnread,
      clearAllBadges,
      // Legacy
      newEntriesCount: totalUnreadCount,
      addNewEntry,
      clearBadges,
      clearEntryBadge,
      hasNewEntryForDate,
      removeOptimisticEntry: markEntryAsRead, // Use markEntryAsRead for now
    }}>
      {children}
    </BadgeContext.Provider>
  );
}

export function useBadge() {
  const context = useContext(BadgeContext);
  if (!context) {
    throw new Error("useBadge must be used within a BadgeProvider");
  }
  return context;
}
