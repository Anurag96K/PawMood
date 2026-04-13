import { useState, useCallback, useRef } from "react";
import { Camera, Calendar, Share2, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface OnboardingCarouselProps {
  onComplete: () => void;
}

const slides = [
  {
    id: 1,
    icon: Camera,
    title: "Take & Analyze",
    description: "Take a photo of your pet and discover their current mood and emotions!",
    color: "bg-primary",
    animation: "📸 → 🐕 → 😊",
  },
  {
    id: 2,
    icon: Calendar,
    title: "Calendar Memories",
    description: "Save your pet's moments in a calendar and keep precious memories forever.",
    color: "bg-secondary",
    animation: "📅 → 🐾 → 💝",
  },
  {
    id: 3,
    icon: Share2,
    title: "Share to Social",
    description: "Share analyzed photos to your stories and connect with more people through reactions and love.",
    color: "bg-accent",
    animation: "📱 → ❤️ → 🌟",
  },
];

// Subtle horizontal slide for intro carousel only
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 60 : -60,
    opacity: 0,
  }),
};

const slideTransition = {
  duration: 0.25,
  ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
};

export function OnboardingCarousel({ onComplete }: OnboardingCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const hasNavigated = useRef(false); // Track if user has navigated away from Step 1

  const nextSlide = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      hasNavigated.current = true; // Mark that user has navigated
      setDirection(1);
      setCurrentSlide((prev) => prev + 1);
    } else {
      onComplete();
    }
  }, [currentSlide, onComplete]);

  const prevSlide = useCallback(() => {
    if (currentSlide > 0) {
      hasNavigated.current = true; // Mark that user has navigated
      setDirection(-1);
      setCurrentSlide((prev) => prev - 1);
    }
  }, [currentSlide]);

  const goToSlide = (index: number) => {
    hasNavigated.current = true; // Mark that user has navigated
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  };

  // For initial Step 1 entry: use fade only. For all other transitions: use slide.
  const isInitialStep1 = currentSlide === 0 && !hasNavigated.current;
  
  const getVariants = () => {
    if (isInitialStep1) {
      // Soft fade for initial Step 1 appearance
      return {
        enter: { opacity: 0 },
        center: { opacity: 1 },
        exit: (dir: number) => ({ x: dir < 0 ? 60 : -60, opacity: 0 }),
      };
    }
    // Normal slide for all other transitions
    return slideVariants;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    setTouchStart(null);
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  return (
    <div 
      className="h-full flex flex-col bg-background"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Spacer for consistent layout */}
      <div className="h-14" />

      {/* Slide Content - Only this area animates */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pb-8 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={getVariants()}
            initial="enter"
            animate="center"
            exit="exit"
            transition={slideTransition}
            className="flex flex-col items-center"
          >
            {/* Demo Animation Area */}
            <div className={`w-48 h-48 rounded-3xl ${slide.color} flex items-center justify-center mb-8 shadow-warm-lg`}>
              <div className="text-center">
                <Icon className="w-16 h-16 text-primary-foreground mx-auto mb-2" />
                <p className="text-2xl">{slide.animation}</p>
              </div>
            </div>

            {/* Text Content */}
            <h2 className="text-2xl font-bold text-emphasis text-center mb-3">
              {slide.title}
            </h2>
            <p className="text-muted-foreground text-center leading-relaxed max-w-xs">
              {slide.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation - Fixed, no animation */}
      <div className="px-8 pb-8">
        {/* Dots */}
        <div className="flex justify-center gap-2 mb-6">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2.5 rounded-full transition-all duration-200 ${
                index === currentSlide
                  ? "bg-primary w-6"
                  : "bg-muted-foreground/30 w-2.5"
              }`}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          {currentSlide > 0 && (
            <Button variant="outline" className="flex-1" onClick={prevSlide}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          )}
          <Button className="flex-1" onClick={nextSlide}>
            {currentSlide === slides.length - 1 ? "Get Started" : "Next"}
            {currentSlide < slides.length - 1 && <ChevronRight className="w-4 h-4 ml-1" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
