/**
 * Utility to reset all app data for testing purposes.
 * This clears localStorage keys used by the app (excluding auth).
 * 
 * Call this from browser console: window.resetAppData()
 */

const KEYS_TO_CLEAR = [
  "hasViewedCalendarMemory",
  "primary_photos", 
  "unread_entries",
  "petmood-calendar-decorations",
  // Don't clear: petmood_language (user preference)
  // Don't clear: auth tokens (handled by Supabase)
];

export function resetAppData() {
  console.log("🔄 Resetting app data...");
  
  KEYS_TO_CLEAR.forEach(key => {
    const hadValue = localStorage.getItem(key) !== null;
    localStorage.removeItem(key);
    if (hadValue) {
      console.log(`  ✓ Cleared: ${key}`);
    }
  });
  
  console.log("✅ App data reset complete. Refresh the page to see changes.");
  return true;
}

// Expose to window for console access
if (typeof window !== "undefined") {
  (window as any).resetAppData = resetAppData;
}
