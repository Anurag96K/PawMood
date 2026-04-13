import { createContext, useContext, useState, useCallback, ReactNode, useRef, useEffect } from "react";

interface OptimisticImageContextType {
  // Store a local image for an entry (before remote URL is available)
  setOptimisticImage: (entryId: string, localImageData: string) => void;
  // Get the optimistic image for an entry (returns null if not available or cleared)
  getOptimisticImage: (entryId: string) => string | null;
  // Clear an optimistic image (called when remote image is confirmed loaded)
  clearOptimisticImage: (entryId: string) => void;
  // Check if image is optimistic (local) vs confirmed (remote loaded)
  isOptimisticImage: (entryId: string) => boolean;
}

const OptimisticImageContext = createContext<OptimisticImageContextType | undefined>(undefined);

// Cache expiry time (5 minutes - should be long enough for any upload)
const CACHE_EXPIRY_MS = 5 * 60 * 1000;

interface CachedImage {
  data: string;
  timestamp: number;
}

export function OptimisticImageProvider({ children }: { children: ReactNode }) {
  // Use ref for immediate access, state for reactivity
  const cacheRef = useRef<Map<string, CachedImage>>(new Map());
  const [, forceUpdate] = useState(0);

  // Cleanup expired entries periodically
  useEffect(() => {
    const cleanup = () => {
      const now = Date.now();
      let hasChanges = false;
      cacheRef.current.forEach((value, key) => {
        if (now - value.timestamp > CACHE_EXPIRY_MS) {
          cacheRef.current.delete(key);
          hasChanges = true;
        }
      });
      if (hasChanges) {
        forceUpdate(n => n + 1);
      }
    };

    const interval = setInterval(cleanup, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const setOptimisticImage = useCallback((entryId: string, localImageData: string) => {
    console.log("[OptimisticImage] Caching local image for entry:", entryId.slice(0, 20));
    cacheRef.current.set(entryId, {
      data: localImageData,
      timestamp: Date.now(),
    });
    forceUpdate(n => n + 1);
  }, []);

  const getOptimisticImage = useCallback((entryId: string): string | null => {
    const cached = cacheRef.current.get(entryId);
    if (!cached) return null;
    
    // Check if expired
    if (Date.now() - cached.timestamp > CACHE_EXPIRY_MS) {
      cacheRef.current.delete(entryId);
      return null;
    }
    
    return cached.data;
  }, []);

  const clearOptimisticImage = useCallback((entryId: string) => {
    if (cacheRef.current.has(entryId)) {
      console.log("[OptimisticImage] Clearing cache for entry:", entryId.slice(0, 20));
      cacheRef.current.delete(entryId);
      forceUpdate(n => n + 1);
    }
  }, []);

  const isOptimisticImage = useCallback((entryId: string): boolean => {
    return cacheRef.current.has(entryId);
  }, []);

  return (
    <OptimisticImageContext.Provider value={{
      setOptimisticImage,
      getOptimisticImage,
      clearOptimisticImage,
      isOptimisticImage,
    }}>
      {children}
    </OptimisticImageContext.Provider>
  );
}

export function useOptimisticImage() {
  const context = useContext(OptimisticImageContext);
  if (!context) {
    throw new Error("useOptimisticImage must be used within OptimisticImageProvider");
  }
  return context;
}
