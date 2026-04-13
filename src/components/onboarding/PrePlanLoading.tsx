import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface PrePlanLoadingProps {
  onComplete: () => void;
}

export function PrePlanLoading({ onComplete }: PrePlanLoadingProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 3000; // 3 seconds
    const interval = 30; // Update every 30ms
    const increment = (100 / duration) * interval;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 200);
          return 100;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-8 animate-pulse">
          <Sparkles className="w-10 h-10 text-primary" />
        </div>

        {/* Text */}
        <h2 className="text-xl font-bold text-emphasis text-center mb-8">
          Creating your personalized plan…
        </h2>

        {/* Progress Bar */}
        <div className="w-full max-w-xs">
          <Progress value={progress} className="h-2" />
        </div>
      </div>
    </div>
  );
}
