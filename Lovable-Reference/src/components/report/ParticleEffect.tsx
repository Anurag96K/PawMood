import { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  shape: "star" | "heart" | "confetti" | "sparkle";
  rotation: number;
  rotationSpeed: number;
}

interface ParticleEffectProps {
  isActive: boolean;
  reduced?: boolean;
  // Optional custom color palette for themed confetti
  colorPalette?: string[];
}

// Default vibrant colors
const DEFAULT_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--secondary))",
  "hsl(var(--destructive))",
  "hsl(var(--ring))",
];

// Soft pastel birthday colors (pink, peach, lavender) with increased transparency
const BIRTHDAY_COLORS = [
  "hsl(340 55% 75% / 0.7)",   // soft pink
  "hsl(340 50% 80% / 0.65)",  // lighter pink
  "hsl(25 55% 78% / 0.7)",    // peach
  "hsl(25 50% 82% / 0.65)",   // lighter peach
  "hsl(270 45% 78% / 0.7)",   // lavender
  "hsl(270 40% 82% / 0.65)",  // lighter lavender
];

const SHAPES: Particle["shape"][] = ["star", "heart", "confetti", "sparkle"];

// SVG shapes for particles
const ShapeRenderer = ({ shape, color, size }: { shape: Particle["shape"]; color: string; size: number }) => {
  switch (shape) {
    case "star":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
          <path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7.4-6.3-4.6-6.3 4.6 2.3-7.4-6-4.6h7.6z" />
        </svg>
      );
    case "heart":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      );
    case "confetti":
      return (
        <div
          style={{
            width: size * 0.4,
            height: size,
            backgroundColor: color,
            borderRadius: size * 0.15,
          }}
        />
      );
    case "sparkle":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
          <path d="M12 0l1.5 8.5L22 12l-8.5 1.5L12 22l-1.5-8.5L2 12l8.5-1.5z" />
        </svg>
      );
    default:
      return null;
  }
};

export function ParticleEffect({ isActive, reduced = false, colorPalette }: ParticleEffectProps) {
  // Use custom palette if provided, otherwise default
  const COLORS = colorPalette || DEFAULT_COLORS;
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!isActive) {
      setParticles([]);
      return;
    }

    const count = reduced ? 15 : 35;
    const newParticles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      // Create burst from center-ish area
      const centerX = 50 + (Math.random() - 0.5) * 30;
      const centerY = 35 + (Math.random() - 0.5) * 20;
      
      newParticles.push({
        id: i,
        x: centerX,
        y: centerY,
        size: Math.random() * 16 + 12, // Larger particles: 12-28px
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        delay: Math.random() * 0.3,
        duration: Math.random() * 1.2 + 1.5,
        shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 720, // Random rotation direction
      });
    }

    setParticles(newParticles);

    // Clear particles after animation
    const timeout = setTimeout(() => {
      setParticles([]);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [isActive, reduced]);

  if (!isActive || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-visible z-[9999]">
      {particles.map((particle) => {
        // Firework-like burst trajectory (no calc() multiplication for better browser support)
        const spreadX = (Math.random() - 0.5) * 80;
        const spreadY = -Math.random() * 70 - 35;
        const fall = 30 + Math.random() * 45;

        const tx1 = spreadX * 0.45;
        const ty1 = spreadY * 0.7;
        const ty3 = spreadY + fall;

        const r1 = particle.rotation + particle.rotationSpeed * 0.35;
        const r2 = particle.rotation + particle.rotationSpeed * 0.7;
        const r3 = particle.rotation + particle.rotationSpeed;

        return (
          <div
            key={particle.id}
            className="absolute will-change-transform"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              opacity: 1,
              animation: `confetti-burst ${particle.duration}s ease-out forwards`,
              animationDelay: `${particle.delay}s`,
              ["--tx1" as string]: `${tx1}vw`,
              ["--ty1" as string]: `${ty1}vh`,
              ["--tx2" as string]: `${spreadX}vw`,
              ["--ty2" as string]: `${spreadY}vh`,
              ["--ty3" as string]: `${ty3}vh`,
              ["--r1" as string]: `${r1}deg`,
              ["--r2" as string]: `${r2}deg`,
              ["--r3" as string]: `${r3}deg`,
            }}
          >
            <ShapeRenderer shape={particle.shape} color={particle.color} size={particle.size} />
          </div>
        );
      })}

      <style>{`
        @keyframes confetti-burst {
          0% {
            opacity: 0;
            transform: translate3d(0, 0, 0) scale(0) rotate(0deg);
          }
          15% {
            opacity: 1;
            transform: translate3d(var(--tx1), var(--ty1), 0) scale(1.15) rotate(var(--r1));
          }
          40% {
            opacity: 1;
            transform: translate3d(var(--tx2), var(--ty2), 0) scale(1) rotate(var(--r2));
          }
          100% {
            opacity: 0;
            transform: translate3d(var(--tx2), var(--ty3), 0) scale(0.65) rotate(var(--r3));
          }
        }
      `}</style>
    </div>
  );
}
