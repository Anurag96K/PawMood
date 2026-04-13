import { useEffect, useState } from "react";
import { PawPrint } from "lucide-react";

interface LoadingScreenProps {
  onComplete: () => void;
  duration?: number;
}

export function LoadingScreen({ onComplete, duration = 2500 }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 200);
          return 100;
        }
        return prev + 2;
      });
    }, duration / 50);

    return () => clearInterval(interval);
  }, [duration, onComplete]);

  const pawColors = [
    "text-primary",
    "text-card",
    "text-foreground",
  ];

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50">
      {/* Animated Paw Prints */}
      <div className="flex gap-4 mb-8">
        {pawColors.map((color, index) => (
          <div
            key={index}
            className={`${color} animate-bounce`}
            style={{
              animationDelay: `${index * 150}ms`,
              animationDuration: "0.8s",
            }}
          >
            <PawPrint className="w-10 h-10" />
          </div>
        ))}
      </div>

      {/* Logo */}
      <div className="flex flex-col items-center gap-3 mb-8">
        <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center shadow-warm-glow">
          <PawPrint className="w-12 h-12 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold text-emphasis">PetMood</h1>
        <p className="text-muted-foreground text-sm">Understand your pet's emotions</p>
      </div>

      {/* Progress Bar */}
      <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
