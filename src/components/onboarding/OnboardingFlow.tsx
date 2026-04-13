
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { LoadingScreen } from "./LoadingScreen";
import { OnboardingCarousel } from "./OnboardingCarousel";
import { PetSetup, PetData } from "./PetSetup";
import { PersonalizationSummary } from "./PersonalizationSummary";
import { AccountCreation } from "./AccountCreation";
import { PrePlanLoading } from "./PrePlanLoading";
import { PlanSelection } from "./PlanSelection";
import { ExtraCredits } from "./ExtraCredits";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { usePet } from "@/hooks/usePet";

type OnboardingStep =
  | "loading"
  | "carousel"
  | "pet-setup"
  | "summary"
  | "account-creation"
  | "pre-plan-loading"
  | "plan-selection"
  | "extra-credits";

export type { OnboardingStep };

interface OnboardingFlowProps {
  onComplete: () => void;
  onCarouselComplete?: () => void;
  onSignIn: () => void;
  initialStep?: OnboardingStep;
}

export function OnboardingFlow({ onComplete, onCarouselComplete, onSignIn, initialStep }: OnboardingFlowProps) {
  const { isAuthenticated, signOut } = useAuth();
  const { createPet } = usePet();

  // Initialize step from storage or auth state
  const [step, setStep] = useState<OnboardingStep>(() => {
    if (initialStep) return initialStep;
    const savedStep = localStorage.getItem("onboarding_step") as OnboardingStep;
    if (savedStep && savedStep !== "loading") return savedStep;

    // Remove isAuthenticated check to force loading -> carousel flow for fresh starts
    return "loading";
  });

  const [petData, setPetData] = useState<PetData | null>(() => {
    const savedData = localStorage.getItem("onboarding_pet_data");
    return savedData ? JSON.parse(savedData) : null;
  });

  const [hasError, setHasError] = useState(false);

  // Persist state
  useEffect(() => {
    if (step !== "loading") {
      localStorage.setItem("onboarding_step", step);
    }
  }, [step]);

  useEffect(() => {
    if (petData) {
      localStorage.setItem("onboarding_pet_data", JSON.stringify(petData));
    }
  }, [petData]);

  // Clean up storage when done
  const clearOnboardingStorage = useCallback(() => {
    localStorage.removeItem("onboarding_step");
    localStorage.removeItem("onboarding_pet_data");
  }, []);

  // Error boundary effect
  useEffect(() => {
    const handleError = () => {
      setHasError(true);
      setStep("loading");
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleError);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleError);
    };
  }, []);

  const handleLoadingComplete = useCallback(() => {
    // Always show carousel for fresh onboarding flow as requested
    setStep("carousel");
  }, []);

  const handleCarouselComplete = useCallback(() => {
    if (onCarouselComplete) {
      onCarouselComplete();
    } else {
      setStep("pet-setup");
    }
  }, [onCarouselComplete]);

  const handlePetSetupComplete = useCallback((data: PetData) => {
    setPetData(data);
    setStep("summary");
  }, []);

  const handleEditPetData = useCallback(() => {
    setStep("pet-setup");
  }, []);

  const handleSummaryConfirm = useCallback(() => {
    if (isAuthenticated) {
      setStep("pre-plan-loading");
    } else {
      setStep("account-creation");
    }
  }, [isAuthenticated]);

  const handleAccountCreationComplete = useCallback(() => {
    setStep("pre-plan-loading");
  }, []);

  const handlePrePlanLoadingComplete = useCallback(async () => {
    if (petData) {
      const { data, error } = await createPet({
        name: petData.name,
        type: petData.type!,
        gender: petData.gender,
        birthday: petData.birthday,
        purposes: petData.purposes,
      });

      if (error) {
        console.error("Pet Creation Error:", error);
        toast.error("Correction: Save failed. " + error.message);
        setStep("summary");
        return;
      }

      if (data) {
        toast.success(`Success! Pet "${data.name}" saved`);
      } else {
        toast.error("Warning: Pet saved but no data returned.");
      }
    }
    setStep("plan-selection");
  }, [petData, createPet]);

  const handlePlanSelected = useCallback((plan: "monthly" | "yearly") => {
    console.log("Selected plan:", plan);
    setStep("extra-credits");
  }, []);

  const handleSkipPlan = useCallback(() => {
    setStep("extra-credits");
  }, []);

  const handleExtraCreditsPurchase = useCallback((packageId: string) => {
    console.log("Purchased package:", packageId);
    clearOnboardingStorage();
    onComplete();
  }, [onComplete, clearOnboardingStorage]);

  const handleSkipCredits = useCallback(() => {
    clearOnboardingStorage();
    onComplete();
  }, [onComplete, clearOnboardingStorage]);

  // Transition configurations per step type
  const getVariants = (currentStep: OnboardingStep) => {
    switch (currentStep) {
      case "loading":
        return {
          initial: { opacity: 1 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          transition: { duration: 0.15 }
        };
      case "pre-plan-loading":
        return {
          initial: { opacity: 1 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          transition: { duration: 0.1 }
        };
      default:
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          transition: { duration: 0.2, ease: "easeOut" as const }
        };
    }
  };

  const currentVariants = getVariants(step);

  const renderStep = () => {
    switch (step) {
      case "loading":
        return <LoadingScreen onComplete={handleLoadingComplete} />;

      case "carousel":
        return <OnboardingCarousel onComplete={handleCarouselComplete} />;

      case "pet-setup":
        return (
          <PetSetup
            onComplete={handlePetSetupComplete}
            onBack={async () => {
              if (isAuthenticated) {
                await signOut();
              } else {
                setStep("carousel");
              }
            }}
          />
        );

      case "summary":
        return petData ? (
          <PersonalizationSummary
            petData={petData}
            onConfirm={handleSummaryConfirm}
            onEdit={handleEditPetData}
          />
        ) : null;

      case "account-creation":
        return (
          <AccountCreation
            onComplete={handleAccountCreationComplete}
            onBack={() => setStep("summary")}
            onSignIn={onSignIn}
          />
        );

      case "pre-plan-loading":
        return (
          <PrePlanLoading onComplete={handlePrePlanLoadingComplete} />
        );

      case "plan-selection":
        return (
          <PlanSelection
            onSelectPlan={handlePlanSelected}
            onSkip={handleSkipPlan}
          />
        );

      case "extra-credits":
        return (
          <ExtraCredits
            onPurchase={handleExtraCreditsPurchase}
            onSkip={handleSkipCredits}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-screen bg-background overflow-hidden">
      <div className="w-full max-w-[375px] mx-auto h-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={currentVariants.initial}
            animate={currentVariants.animate}
            exit={currentVariants.exit}
            transition={currentVariants.transition}
            className="h-full"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
