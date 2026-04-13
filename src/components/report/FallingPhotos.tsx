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

        useEffect(() => {
            if (!active || effectiveCount === 0) {
                setItems([]);
                return;
            }

            const generateRandomSpawns = () => {
                const spawns: FallingPhoto[] = [];
                const minDistancePercent = 16;
                const minDelayGap = 150;
                const baseDurationMs = 2400;

                const zoneWeights = [
                    { start: 10, end: 25, weight: Math.random() * 0.8 + 0.2 },
                    { start: 25, end: 45, weight: Math.random() * 0.8 + 0.2 },
                    { start: 40, end: 60, weight: Math.random() * 0.5 + 0.1 },
                    { start: 55, end: 75, weight: Math.random() * 0.8 + 0.2 },
                    { start: 70, end: 90, weight: Math.random() * 0.8 + 0.2 },
                ];

                const totalWeight = zoneWeights.reduce((sum, z) => sum + z.weight, 0);
                zoneWeights.forEach(z => z.weight /= totalWeight);

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
                    const durationMs = baseDurationMs + Math.floor(Math.random() * 300) - 150;

                    let delayMs: number;
                    if (i === 0) {
                        delayMs = Math.floor(Math.random() * 200);
                    } else {
                        const prevDelay = spawns[i - 1]?.delayMs ?? 0;
                        const gap = 50 + Math.floor(Math.random() * Math.random() * 300);
                        delayMs = prevDelay + gap;
                    }

                    const maxStartDelay = 2200;
                    if (delayMs > maxStartDelay) {
                        delayMs = maxStartDelay - Math.floor(Math.random() * 400);
                    }

                    const zone = pickZone();
                    let xPercent = zone.start + Math.random() * (zone.end - zone.start);

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
                        const newZone = pickZone();
                        xPercent = newZone.start + Math.random() * (newZone.end - newZone.start);
                        attempts++;
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

        useEffect(() => {
            if (!active || debugForce || imageUrls.length === 0) return;
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
                <style>{`
        @keyframes falling-photos-drop {
          0% { transform: translateX(-50%) translateY(0); }
          100% { transform: translateX(-50%) translateY(calc(100vh + 200px)); }
        }
      `}</style>
                {items.map((p) => (
                    <div
                        key={`${p.id}-${runId ?? 0}`}
                        className="absolute top-[-100px] rounded-full overflow-hidden shadow-lg bg-muted"
                        style={{
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
                        } as CSSProperties}
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
                ))}
            </div>
        );
    });
