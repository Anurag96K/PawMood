import { useState, useMemo, useRef } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BirthdayPicker } from "./BirthdayPicker";
import { PET_NAME_MAX } from "@/lib/petConstants";

export interface PetData {
  type: "dog" | "cat" | "other" | null;
  name: string;
  gender: "male" | "female" | null;
  birthday: Date | null;
  purposes: string[];
}

interface PetSetupProps {
  onComplete: (data: PetData) => void;
  onBack: () => void;
}

const petTypes = [
  { id: "dog", label: "Dog", emoji: "🐶" },
  { id: "cat", label: "Cat", emoji: "🐱" },
  { id: "other", label: "Other", emoji: "❓" },
] as const;

const genderOptions = [
  { id: "male", label: "Male", emoji: "♂️" },
  { id: "female", label: "Female", emoji: "♀️" },
] as const;

const purposeOptions = [
  { id: "mood", label: "Pet mood analysis", emoji: "😊" },
  { id: "memory", label: "Memory tracking", emoji: "📅" },
  { id: "sharing", label: "Daily sharing", emoji: "📱" },
  { id: "other", label: "Other", emoji: "✨" },
];

const nameFeedbackMessages = [
  (name: string) => `"${name}" sounds adorable! 🥰`,
  (name: string) => `${name} is such a cute name! 💕`,
  (name: string) => `Aww, ${name}! Love it! ✨`,
  (name: string) => `${name} suits them perfectly! 🌟`,
  (name: string) => `Hello, ${name}! So sweet! 🐾`,
];

// Fade-only for initial entry (no slide)
const fadeVariants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: (direction: number) => ({
    x: direction < 0 ? 40 : -40,
    opacity: 0,
  }),
};

// Subtle card-only transitions (background stays fixed)
const cardVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 40 : -40,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 40 : -40,
    opacity: 0,
  }),
};

const cardTransition = {
  duration: 0.18,
  ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
};

export function PetSetup({ onComplete, onBack }: PetSetupProps) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showNameLimitHint, setShowNameLimitHint] = useState(false);
  const hasNavigated = useRef(false); // Track if user has navigated from step 1
  const [petData, setPetData] = useState<PetData>({
    type: null,
    name: "",
    gender: null,
    birthday: null,
    purposes: [],
  });

  const feedbackMessageFn = useMemo(
    () => nameFeedbackMessages[Math.floor(Math.random() * nameFeedbackMessages.length)],
    []
  );

  const totalSteps = 5;

  // For initial Step 1 entry: use fade only. For all other transitions: use slide.
  const isInitialStep1 = step === 1 && !hasNavigated.current;
  const activeVariants = isInitialStep1 ? fadeVariants : cardVariants;

  const canProceed = () => {
    switch (step) {
      case 1: return petData.type !== null;
      case 2: return petData.name.trim().length > 0;
      case 3: return petData.gender !== null;
      case 4: return true;
      case 5: return petData.purposes.length > 0;
      default: return false;
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      hasNavigated.current = true; // Mark that user has navigated
      setDirection(1);
      setStep(step + 1);
    } else {
      setIsCompleting(true);
      setTimeout(() => {
        onComplete(petData);
      }, 300);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      hasNavigated.current = true; // Mark that user has navigated
      setDirection(-1);
      setStep(step - 1);
    } else {
      onBack();
    }
  };

  const togglePurpose = (purposeId: string) => {
    setPetData((prev) => ({
      ...prev,
      purposes: prev.purposes.includes(purposeId)
        ? prev.purposes.filter((p) => p !== purposeId)
        : [...prev.purposes, purposeId],
    }));
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-emphasis text-center">
              What kind of pet do you have?
            </h2>
            <p className="text-muted-foreground text-center text-sm">
              Select your pet type so we can personalize your experience
            </p>
            <div className="grid grid-cols-3 gap-3 pt-4">
              {petTypes.map(({ id, label, emoji }) => (
                <button
                  key={id}
                  onClick={() => setPetData((prev) => ({ ...prev, type: id }))}
                  className={`flex flex-col items-center gap-2 p-6 rounded-2xl border-2 transition-all ${
                    petData.type === id
                      ? "border-primary bg-primary/10 shadow-warm"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <span className="text-4xl">{emoji}</span>
                  <span className={`font-medium ${petData.type === id ? "text-primary" : "text-foreground"}`}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-emphasis text-center">
              What's your pet's name?
            </h2>
            <div className="pt-4 space-y-2">
              <Input
                placeholder="Enter name..."
                value={petData.name}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length > PET_NAME_MAX) {
                    setPetData((prev) => ({ ...prev, name: value.slice(0, PET_NAME_MAX) }));
                    setShowNameLimitHint(true);
                    setTimeout(() => setShowNameLimitHint(false), 2000);
                  } else {
                    setPetData((prev) => ({ ...prev, name: value }));
                    setShowNameLimitHint(false);
                  }
                }}
                maxLength={PET_NAME_MAX}
                className="text-center text-lg h-14"
                autoFocus
              />
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {petData.name.length}/{PET_NAME_MAX}
                </span>
                {showNameLimitHint && (
                  <span className="text-xs text-destructive animate-fade-in">
                    Pet name must be {PET_NAME_MAX} characters or less
                  </span>
                )}
              </div>
            </div>
            {petData.name && !showNameLimitHint && (
              <p className="text-center text-primary font-medium animate-fade-in-up text-sm whitespace-nowrap overflow-hidden text-ellipsis px-2">
                {feedbackMessageFn(petData.name)}
              </p>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-emphasis text-center">
              Is {petData.name || "your pet"} a boy or girl?
            </h2>
            <div className="grid grid-cols-2 gap-4 pt-4">
              {genderOptions.map(({ id, label, emoji }) => (
                <button
                  key={id}
                  onClick={() => setPetData((prev) => ({ ...prev, gender: id }))}
                  className={`flex flex-col items-center gap-2 p-8 rounded-2xl border-2 transition-all ${
                    petData.gender === id
                      ? "border-primary bg-primary/10 shadow-warm"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <span className="text-4xl">{emoji}</span>
                  <span className={`font-medium ${petData.gender === id ? "text-primary" : "text-foreground"}`}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-emphasis text-center">
              When is {petData.name}'s birthday?
            </h2>
            <div className="pt-4">
              <BirthdayPicker
                value={petData.birthday}
                onChange={(date) => setPetData((prev) => ({ ...prev, birthday: date }))}
              />
            </div>
            <p className="text-xs text-foreground text-center font-semibold whitespace-nowrap">
              Don't know the exact date? You can skip this for now.
            </p>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-emphasis text-center">
              What brings you here?
            </h2>
            <p className="text-muted-foreground text-center text-sm">
              Select all that apply
            </p>
            <div className="space-y-3 pt-4">
              {purposeOptions.map(({ id, label, emoji }) => (
                <button
                  key={id}
                  onClick={() => togglePurpose(id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                    petData.purposes.includes(id)
                      ? "border-primary bg-primary/10 shadow-warm"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <span className="text-2xl">{emoji}</span>
                  <span className={`font-medium flex-1 text-left ${
                    petData.purposes.includes(id) ? "text-primary" : "text-foreground"
                  }`}>
                    {label}
                  </span>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    petData.purposes.includes(id)
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/40"
                  }`}>
                    {petData.purposes.includes(id) && (
                      <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Progress Bar - Fixed, with proper overflow handling */}
      <div className="px-4 pt-4 pb-2">
        <Progress 
          value={isCompleting ? 100 : ((step - 1) / totalSteps) * 100} 
          className="h-2 bg-muted rounded-full overflow-hidden"
        />
      </div>

      {/* Content - Only this card area transitions */}
      <div className="flex-1 px-6 py-4 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={activeVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={cardTransition}
            className="h-full overflow-y-auto"
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation - Fixed */}
      <div className="px-6 pb-8 pt-4 flex gap-3">
        <Button variant="outline" className="flex-1" onClick={handleBack}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <Button className="flex-1" onClick={handleNext} disabled={!canProceed()}>
          {step === totalSteps ? "Continue" : "Next"}
          {step < totalSteps && <ChevronRight className="w-4 h-4 ml-1" />}
        </Button>
      </div>
    </div>
  );
}
