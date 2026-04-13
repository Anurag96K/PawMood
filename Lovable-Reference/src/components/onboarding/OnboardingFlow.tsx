import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingScreen } from "./LoadingScreen";
import { OnboardingCarousel } from "./OnboardingCarousel";
import { AuthEntry } from "./AuthEntry";
import { PetSetup, PetData } from "./PetSetup";
import { PersonalizationSummary } from "./PersonalizationSummary";
import { AccountCreation } from "./AccountCreation";
import { PrePlanLoading } from "./PrePlanLoading";
import { PlanSelection } from "./PlanSelection";
import { useAuth } from "@/hooks/useAuth";
import { usePet } from "@/hooks/usePet";

type OnboardingStep =
  | "loading"
  | "carousel"
  | "auth-entry"
  | "pet-setup"
  | "summary"
  | "account-creation"
  | "pre-plan-loading"
  | "plan-selection";

interface OnboardingFlowProps {
  onComplete: () => void;
  onSignIn: () => void;
}

// Transition configurations per step type
const getTransitionVariants = (step: OnboardingStep) => {
  const subtleEase: [number, number, number, number] = [0.25, 0.1, 0.25, 1];
  
  switch (step) {
    // Loading: No transition, just state-based internal animation
    case "loading":
      return {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.15 }
      };
    
    // Auth entry: Soft fade only (context break)
    case "auth-entry":
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.2, ease: "easeOut" as const }
      };
    
    // Account creation: Minimal fade (stable, focused)
    case "account-creation":
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.15, ease: "easeOut" as const }
      };
    
    // Pre-plan loading: No transition (state-based internal animation)
    case "pre-plan-loading":
      return {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.1 }
      };
    
    // Plan selection (paywall): Fade + subtle scale-in (modal emphasis)
    case "plan-selection":
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.15, ease: "easeOut" as const }
      };
    
    // Pet setup & Summary: Soft fade (card content transitions internally)
    case "pet-setup":
    case "summary":
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.15, ease: "easeOut" as const }
      };
    
    // Carousel: handled internally with its own slide transitions
    case "carousel":
    default:
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.2, ease: "easeOut" as const }
      };
  }
};

export function OnboardingFlow({ onComplete, onSignIn }: OnboardingFlowProps) {
  const { isAuthenticated } = useAuth();
  const { createPet } = usePet();
  const [step, setStep] = useState<OnboardingStep>("loading");
  const [petData, setPetData] = useState<PetData | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setStep("loading");
    setHasError(false);
  }, []);

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
    setStep("carousel");
  }, []);

  const handleCarouselComplete = useCallback(() => {
    setStep("auth-entry");
  }, []);

  const handleGetStarted = useCallback(() => {
    setStep("pet-setup");
  }, []);

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
      await createPet({
        name: petData.name,
        type: petData.type!,
        gender: petData.gender,
        birthday: petData.birthday,
        purposes: petData.purposes,
      });
    }
    setStep("plan-selection");
  }, [petData, createPet]);

  const handlePlanSelected = useCallback((plan: "monthly" | "yearly") => {
    console.log("Selected plan:", plan);
    onComplete();
  }, [onComplete]);

  const handleSkipPlan = useCallback(() => {
    onComplete();
  }, [onComplete]);

  const variants = getTransitionVariants(step);

  const renderStep = () => {
    switch (step) {
      case "loading":
        return <LoadingScreen onComplete={handleLoadingComplete} />;

      case "carousel":
        return <OnboardingCarousel onComplete={handleCarouselComplete} />;

      case "auth-entry":
        return (
          <AuthEntry 
            onGetStarted={handleGetStarted} 
            onSignIn={onSignIn} 
          />
        );

      case "pet-setup":
        return (
          <PetSetup 
            onComplete={handlePetSetupComplete} 
            onBack={() => setStep("auth-entry")}
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
            initial={variants.initial}
            animate={variants.animate}
            exit={variants.exit}
            transition={variants.transition}
            className="h-full"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
