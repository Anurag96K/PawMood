import { useEffect, useMemo, useState, forwardRef, type CSSProperties } from "react";

interface FallingPhoto {
  id: number;
  imageUrl: string;
  xPercent: number;
  sizePx: number;
  durationMs: number;
  delayMs: number;
}

interface FallingPhotosProps {
  imageUrls: string[];
  /** number shown in UI (must match circle count) */
  count: number;
  /** whether the screen is currently visible */
  active: boolean;
  /** change this value to force a rerun while mounted */
  runId?: number;
}

const PLACEHOLDER_SRC = "/placeholder.svg";

export const FallingPhotos = forwardRef<HTMLDivElement, FallingPhotosProps>(
  function FallingPhotos({ imageUrls, count, active, runId }, ref) {
  const debugForce = useMemo(() => {
    try {
      return (
        typeof window !== "undefined" &&
        (window.localStorage.getItem("__debug_falling_photos") === "1" ||
          new URLSearchParams(window.location.search).get("debugFalling") === "1")
      );
    } catch {
      return false;
    }
  }, []);

  const effectiveCount = Math.max(0, debugForce ? 7 : count);

  // Prefer unique URLs, then repeat only if needed.
  // If data is not ready yet, we still render circles using placeholder.
  const sourceUrls = useMemo(() => {
    const urls = (debugForce ? [PLACEHOLDER_SRC] : imageUrls).filter(Boolean);
    if (urls.length === 0) return [PLACEHOLDER_SRC];

    const unique: string[] = [];
    const seen = new Set<string>();
    for (const u of urls) {
      if (!seen.has(u)) {
        unique.push(u);
        seen.add(u);
      }
    }

    return unique.length > 0 ? unique : [PLACEHOLDER_SRC];
  }, [imageUrls, debugForce]);

  const [items, setItems] = useState<FallingPhoto[]>([]);

  // Start / restart when screen becomes active or when runId changes.
  useEffect(() => {
    if (!active || effectiveCount === 0) {
      setItems([]);
      return;
    }

    // Generate random spawn pattern with collision avoidance
    const generateRandomSpawns = () => {
      const spawns: FallingPhoto[] = [];
      const minDistancePercent = 16; // Minimum horizontal distance between photos
      const minDelayGap = 150; // Minimum time gap to avoid vertical overlap
      
      // Faster fall duration to complete within story duration
      const baseDurationMs = 2400;
      
      // Pre-generate weighted zones for more irregular distribution
      // Safe margins: photos are ~54-68px wide, so keep xPercent in 12-88% range
      // to prevent clipping against viewport edges (approx 45px margin on 375px screen)
      const zoneWeights = [
        { start: 12, end: 28, weight: Math.random() * 0.8 + 0.2 },  // Far left (safe)
        { start: 24, end: 44, weight: Math.random() * 0.8 + 0.2 },  // Left-center
        { start: 40, end: 60, weight: Math.random() * 0.5 + 0.1 },  // Center (lower weight)
        { start: 56, end: 76, weight: Math.random() * 0.8 + 0.2 },  // Right-center
        { start: 72, end: 88, weight: Math.random() * 0.8 + 0.2 },  // Far right (safe)
      ];
      
      // Normalize weights
      const totalWeight = zoneWeights.reduce((sum, z) => sum + z.weight, 0);
      zoneWeights.forEach(z => z.weight /= totalWeight);
      
      // Pick a zone based on weighted random
      const pickZone = () => {
        const r = Math.random();
        let cumulative = 0;
        for (const zone of zoneWeights) {
          cumulative += zone.weight;
          if (r <= cumulative) return zone;
        }
        return zoneWeights[zoneWeights.length - 1];
      };
      
      for (let i = 0; i < effectiveCount; i++) {
        const url = sourceUrls[i % sourceUrls.length] ?? PLACEHOLDER_SRC;
        
        // Slight variation in fall duration for more natural feel
        const durationMs = baseDurationMs + Math.floor(Math.random() * 300) - 150;
        
        // More irregular spawn delays
        let delayMs: number;
        if (i === 0) {
          // First photo starts between 0-200ms
          delayMs = Math.floor(Math.random() * 200);
        } else {
          const prevDelay = spawns[i - 1]?.delayMs ?? 0;
          // Highly variable gaps: 50-350ms
          const gap = 50 + Math.floor(Math.random() * Math.random() * 300);
          delayMs = prevDelay + gap;
        }
        
        // Cap max delay so animation finishes before scene advances
        // Scene duration is 5000ms, photos take ~2400ms to fall
        // Last photo should start by ~2200ms to finish by ~4600ms
        const maxStartDelay = 2200;
        if (delayMs > maxStartDelay) {
          delayMs = maxStartDelay - Math.floor(Math.random() * 400);
        }
        
        // Pick x-position from weighted zones
        const zone = pickZone();
        let xPercent = zone.start + Math.random() * (zone.end - zone.start);
        
        // Collision avoidance
        let attempts = 0;
        const maxAttempts = 8;
        
        while (attempts < maxAttempts) {
          let hasCollision = false;
          
          for (const existing of spawns) {
            const timeDiff = Math.abs(delayMs - existing.delayMs);
            const wouldOverlapInTime = timeDiff < durationMs * 0.5;
            
            if (wouldOverlapInTime) {
              const xDiff = Math.abs(xPercent - existing.xPercent);
              if (xDiff < minDistancePercent) {
                hasCollision = true;
                break;
              }
            }
          }
          
          if (!hasCollision) break;
          
          // Try a different zone
          const newZone = pickZone();
          xPercent = newZone.start + Math.random() * (newZone.end - newZone.start);
          attempts++;
          
          // If stuck, nudge the delay
          if (attempts === maxAttempts) {
            delayMs = Math.min(delayMs + minDelayGap, maxStartDelay);
          }
        }
        
        spawns.push({
          id: i,
          imageUrl: url,
          xPercent,
          sizePx: 54 + Math.random() * 14,
          durationMs,
          delayMs,
        });
      }
      
      return spawns;
    };

    setItems(generateRandomSpawns());
  }, [active, effectiveCount, runId, sourceUrls]);

  // If real URLs arrive after first paint, swap them in without hiding circles.
  useEffect(() => {
    if (!active) return;
    if (debugForce) return;
    if (imageUrls.length === 0) return;

    const unique: string[] = [];
    const seen = new Set<string>();
    for (const u of imageUrls) {
      if (!seen.has(u)) {
        unique.push(u);
        seen.add(u);
      }
    }
    if (unique.length === 0) return;

    setItems((prev) =>
      prev.map((p, idx) => ({
        ...p,
        imageUrl: unique[idx % unique.length] ?? p.imageUrl,
      }))
    );
  }, [active, debugForce, imageUrls]);

  if (!active || effectiveCount === 0) return null;

  return (
    <div ref={ref} className="fixed inset-0 pointer-events-none overflow-hidden z-[1]">
      {/* Calm, straight vertical fall — no rotation, full opacity */}
      <style>{`
        @keyframes falling-photos-drop {
          0% {
            transform: translateX(-50%) translateY(0);
          }
          100% {
            transform: translateX(-50%) translateY(calc(100vh + 200px));
          }
        }
      `}</style>

      {items.map((p) => {
        const style = {
          left: `${p.xPercent}%`,
          width: `${p.sizePx}px`,
          height: `${p.sizePx}px`,
          animationName: "falling-photos-drop",
          animationDuration: `${p.durationMs}ms`,
          animationTimingFunction: "linear",
          animationDelay: `${p.delayMs}ms`,
          animationFillMode: "forwards",
          willChange: "transform",
          opacity: 1,
        } as CSSProperties;

        return (
          <div
            key={`${p.id}-${runId ?? 0}`}
            className="absolute top-[-100px] rounded-full overflow-hidden shadow-lg bg-muted"
            style={style}
          >
            <img
              src={p.imageUrl}
              alt=""
              className="w-full h-full object-cover"
              draggable={false}
              onError={(e) => {
                const img = e.currentTarget;
                if (img.getAttribute("data-fallback") === "1") return;
                img.src = PLACEHOLDER_SRC;
                img.setAttribute("data-fallback", "1");
              }}
            />
          </div>
        );
      })}
    </div>
  );
});
