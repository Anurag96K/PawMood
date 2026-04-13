import { useState } from "react";
import { Dog, Cat, HelpCircle, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BirthdayPicker } from "./BirthdayPicker";

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
  { id: "dog", label: "Dog", icon: Dog },
  { id: "cat", label: "Cat", icon: Cat },
  { id: "other", label: "Other", icon: HelpCircle },
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

export function PetSetup({ onComplete, onBack }: PetSetupProps) {
  const [step, setStep] = useState(1);
  const [feedbackIndex] = useState(() => Math.floor(Math.random() * nameFeedbackMessages.length));
  const [petData, setPetData] = useState<PetData>({
    type: null,
    name: "",
    gender: null,
    birthday: null,
    purposes: [],
  });

  const totalSteps = 5;

  const canProceed = () => {
    switch (step) {
      case 1: return petData.type !== null;
      case 2: return petData.name.trim().length > 0;
      case 3: return petData.gender !== null;
      case 4: return true; // Birthday is optional
      case 5: return petData.purposes.length > 0;
      default: return false;
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onComplete(petData);
    }
  };

  const handleBack = () => {
    if (step > 1) {
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

  const renderStep = () => {
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
              {petTypes.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setPetData((prev) => ({ ...prev, type: id }))}
                  className={`flex flex-col items-center gap-2 p-6 rounded-2xl border-2 transition-all ${petData.type === id
                    ? "border-primary bg-primary/10 shadow-warm"
                    : "border-border bg-card hover:border-primary/50"
                    }`}
                >
                  <Icon className={`w-10 h-10 ${petData.type === id ? "text-primary" : "text-muted-foreground"}`} />
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
            <p className="text-muted-foreground text-center text-sm">
              We'll use this to personalize your experience
            </p>
            <div className="pt-4 space-y-2">
              <Input
                placeholder="Enter name..."
                value={petData.name}
                onChange={(e) => setPetData((prev) => ({ ...prev, name: e.target.value.slice(0, 12) }))}
                className="text-center text-lg h-14 border-2 focus-visible:ring-primary/20"
                autoFocus
                maxLength={12}
              />
              <p className="text-center text-[10px] font-bold text-muted-foreground/60 tracking-wider">
                {petData.name.length}/12
              </p>
            </div>
            {petData.name && (
              <p className="text-center text-primary font-medium animate-fade-in-up text-sm">
                {nameFeedbackMessages[feedbackIndex](petData.name)}
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
            <p className="text-muted-foreground text-center text-sm">
              This helps us personalize descriptions
            </p>
            <div className="grid grid-cols-2 gap-4 pt-4">
              {genderOptions.map(({ id, label, emoji }) => (
                <button
                  key={id}
                  onClick={() => setPetData((prev) => ({ ...prev, gender: id }))}
                  className={`flex flex-col items-center gap-2 p-8 rounded-2xl border-2 transition-all ${petData.gender === id
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
            <p className="text-muted-foreground text-center text-sm">
              This helps create calendar events and memories
            </p>
            <div className="pt-4">
              <BirthdayPicker
                value={petData.birthday}
                onChange={(date) => setPetData((prev) => ({ ...prev, birthday: date }))}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
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
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${petData.purposes.includes(id)
                    ? "border-primary bg-primary/10 shadow-warm"
                    : "border-border bg-card hover:border-primary/50"
                    }`}
                >
                  <span className="text-2xl">{emoji}</span>
                  <span className={`font-medium flex-1 text-left ${petData.purposes.includes(id) ? "text-primary" : "text-foreground"
                    }`}>
                    {label}
                  </span>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${petData.purposes.includes(id)
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
      {/* Progress Bar */}
      <div className="p-4">
        <div className="flex gap-2">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div
              key={index}
              className={`h-1.5 flex-1 rounded-full transition-colors ${index < step ? "bg-primary" : "bg-muted"
                }`}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Step {step} of {totalSteps}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-4 overflow-y-auto">
        {renderStep()}
      </div>

      <div className="px-6 pb-10 pt-4 flex gap-3">
        <Button
          variant="outline"
          className="flex-1 h-[58px] rounded-[22px] border-2 font-black text-base active:scale-[0.97] transition-all"
          onClick={handleBack}
        >
          <ChevronLeft className="w-5 h-5 mr-1 stroke-[2.5px]" />
          Back
        </Button>
        <Button
          className="flex-1 h-[58px] rounded-[22px] font-black text-base shadow-warm active:scale-[0.97] transition-all bg-primary hover:bg-primary/90 text-white"
          onClick={handleNext}
          disabled={!canProceed()}
        >
          {step === totalSteps ? "Continue" : "Next"}
          {step < totalSteps && <ChevronRight className="w-5 h-5 ml-1 stroke-[2.5px]" />}
        </Button>
      </div>
    </div>
  );
}
