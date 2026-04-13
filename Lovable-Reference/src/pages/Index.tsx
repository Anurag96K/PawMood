import { useState, useEffect } from "react";
import { BottomNavigation } from "@/components/BottomNavigation";
import { CameraScreen } from "@/components/screens/CameraScreen";
import { CalendarScreen } from "@/components/screens/CalendarScreen";
import { ProfileScreen } from "@/components/screens/ProfileScreen";
import { ReportScreen } from "@/components/report";
import { AuthPage } from "@/components/screens/AuthPage";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PendingDeletionBanner } from "@/components/PendingDeletionBanner";

import { OnboardingFlow } from "@/components/onboarding";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { BadgeProvider, useBadge } from "@/contexts/BadgeContext";
import { CalendarDecorationProvider } from "@/contexts/CalendarDecorationContext";
import { SelectedDateProvider } from "@/contexts/SelectedDateContext";
import { OptimisticImageProvider } from "@/contexts/OptimisticImageContext";
import { SharedElementProvider } from "@/contexts/SharedElementContext";
import { ExtraCreditsProvider } from "@/contexts/ExtraCreditsContext";
import { useAuth } from "@/hooks/useAuth";
import { usePremium } from "@/hooks/usePremium";
import { usePet } from "@/hooks/usePet";
import { useSubscriptionHistory } from "@/hooks/useSubscriptionHistory";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

type TabId = "camera" | "calendar" | "profile";
type PlanType = "free" | "pro-monthly" | "pro-yearly";
type ViewState = "loading" | "onboarding" | "auth" | "app";

// Navigation state persistence keys
const NAV_STATE_KEY = "app_nav_state";
const VIEW_STATE_KEY = "app_view_state";

interface NavState {
  activeTab: TabId;
  showReportScreen: boolean;
}

// Load persisted navigation state
// IMPORTANT: Never persist showReportScreen=true to prevent infinite loops on refresh
function loadNavState(): NavState {
  try {
    const stored = localStorage.getItem(NAV_STATE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        activeTab: parsed.activeTab || "camera",
        // NEVER restore showReportScreen to true - always start fresh
        showReportScreen: false,
      };
    }
  } catch (e) {
    console.error("Failed to load nav state:", e);
  }
  return { activeTab: "camera", showReportScreen: false };
}

// Save navigation state - but NEVER persist showReportScreen=true
function saveNavState(state: NavState) {
  try {
    // Always save showReportScreen as false to prevent loops on refresh
    localStorage.setItem(NAV_STATE_KEY, JSON.stringify({
      ...state,
      showReportScreen: false,
    }));
  } catch (e) {
    console.error("Failed to save nav state:", e);
  }
}

// Load persisted view state (for surviving background/resume)
function loadViewState(): ViewState | null {
  try {
    const stored = sessionStorage.getItem(VIEW_STATE_KEY);
    if (stored) {
      return stored as ViewState;
    }
  } catch (e) {
    console.error("Failed to load view state:", e);
  }
  return null;
}

// Save view state
function saveViewState(state: ViewState) {
  try {
    sessionStorage.setItem(VIEW_STATE_KEY, state);
  } catch (e) {
    console.error("Failed to save view state:", e);
  }
}

function AppContent() {
  const {
    isAuthenticated,
    loading: authLoading,
    signOut
  } = useAuth();
  const { isPremium: isPremiumFromDb, isLoading: premiumLoading } = usePremium();
  const { hasPet, loading: petLoading } = usePet();
  const { clearBadges } = useBadge();
  const { hasEverSubscribed, markAsSubscribed } = useSubscriptionHistory();
  
  // Load persisted navigation state
  const initialNavState = loadNavState();
  const persistedViewState = loadViewState();
  
  // Track if this is the initial mount
  const [isInitialMount, setIsInitialMount] = useState(true);
  
  // If we have a persisted "app" view state, start with that to prevent flicker
  const [viewState, setViewState] = useState<ViewState>(
    persistedViewState === "app" ? "app" : "loading"
  );
  const [activeTab, setActiveTab] = useState<TabId>(initialNavState.activeTab);
  const [analysisCount, setAnalysisCount] = useState(0);
  const [currentPlan, setCurrentPlan] = useState<PlanType>("free");
  const [scrollToPlan, setScrollToPlan] = useState(false);
  const [isFirstPaidMonth, setIsFirstPaidMonth] = useState(false);
  
  const [hasPurchasedPlan, setHasPurchasedPlan] = useState(false);
  // Always start fresh - onboarding state is session-based only
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [showReportScreen, setShowReportScreen] = useState(initialNavState.showReportScreen);
  const [pendingDeletionAt, setPendingDeletionAt] = useState<string | null>(null);
  const [deletionChecked, setDeletionChecked] = useState(false);

  // Check for pending deletion when authenticated
  useEffect(() => {
    if (!isAuthenticated || authLoading) {
      setPendingDeletionAt(null);
      setDeletionChecked(false);
      return;
    }

    const checkDeletion = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from("profiles")
          .select("deletion_requested_at")
          .eq("user_id", user.id)
          .maybeSingle();

        setPendingDeletionAt((data as any)?.deletion_requested_at ?? null);
      } catch (err) {
        console.error("Error checking deletion status:", err);
      } finally {
        setDeletionChecked(true);
      }
    };

    checkDeletion();
  }, [isAuthenticated, authLoading]);
  // Persist navigation state when it changes
  useEffect(() => {
    saveNavState({ activeTab, showReportScreen });
  }, [activeTab, showReportScreen]);
  
  // Persist view state when it changes to "app"
  useEffect(() => {
    if (viewState === "app") {
      saveViewState("app");
    }
  }, [viewState]);
  
  // Use database premium status OR local purchase state
  const isPremium = isPremiumFromDb || currentPlan !== "free";
  const isBasic = false;

  // Determine view state based on auth and onboarding status
  // Only run full logic on initial mount or when auth actually changes
  useEffect(() => {
    // If we already have a persisted "app" state and user is authenticated, skip loading
    if (persistedViewState === "app" && isAuthenticated && !authLoading) {
      // Verify pet status without showing loading
      if (!petLoading && hasPet) {
        setViewState("app");
        setIsInitialMount(false);
        return;
      }
    }
    
    // Only show loading state on initial mount
    if (authLoading && isInitialMount) {
      setViewState("loading");
      return;
    }

    // If not authenticated, user must either onboard or sign in
    if (!isAuthenticated) {
      setViewState(hasCompletedOnboarding ? "auth" : "onboarding");
      setIsInitialMount(false);
      return;
    }

    // Authenticated users continue normal setup gating
    if (petLoading && isInitialMount) {
      setViewState("loading");
    } else if (!hasPet) {
      setViewState("onboarding");
      setIsInitialMount(false);
    } else {
      setViewState("app");
      setIsInitialMount(false);
    }
  }, [authLoading, isAuthenticated, petLoading, hasPet, hasCompletedOnboarding, isInitialMount, persistedViewState]);

  // Set premium state from database
  useEffect(() => {
    if (isPremiumFromDb && !hasPurchasedPlan) {
      setHasPurchasedPlan(true);
      setCurrentPlan("pro-yearly");
      setAnalysisCount(70);
    }
  }, [isPremiumFromDb, hasPurchasedPlan]);

  const handleOnboardingComplete = () => {
    // Session-only flag; after onboarding, require auth to access saved data
    setHasCompletedOnboarding(true);
    setViewState(isAuthenticated ? "app" : "auth");
  };

  const handleGoToSignIn = () => {
    setViewState("auth");
  };

  const handleSelectPlan = (plan: PlanType) => {
    const wasFree = currentPlan === "free";
    setCurrentPlan(plan);
    setHasPurchasedPlan(true);
    
    // Mark user as having subscribed (for lock screen copy differentiation)
    if (plan !== "free") {
      markAsSubscribed();
    }
    
    if (wasFree && !hasPurchasedPlan) {
      if (plan === "pro-monthly") {
        setAnalysisCount(53);
      } else if (plan === "pro-yearly") {
        setAnalysisCount(73);
      }
      setIsFirstPaidMonth(true);
    } else {
      if (plan === "pro-monthly") {
        setAnalysisCount(50);
      } else if (plan === "pro-yearly") {
        setAnalysisCount(70);
      }
      setIsFirstPaidMonth(false);
    }
  };

  const handleNavigateToProfile = (shouldScrollToPlan?: boolean) => {
    setScrollToPlan(!!shouldScrollToPlan);
    setActiveTab("profile");
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
  };

  // Loading state
  if (viewState === "loading") {
    return (
      <div className="h-screen bg-background flex justify-center">
        <div className="w-full max-w-[375px]">
          <div className="h-screen overflow-y-auto flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Onboarding flow for new users
  if (viewState === "onboarding") {
    return (
      <OnboardingFlow 
        onComplete={handleOnboardingComplete}
        onSignIn={handleGoToSignIn}
      />
    );
  }

  // Auth page for returning users
  if (viewState === "auth") {
    return (
      <div className="h-screen bg-background flex justify-center">
        <div className="w-full max-w-[375px] bg-secondary">
          <div className="h-screen overflow-y-auto">
            <AuthPage onAuthenticated={() => setViewState("app")} />
          </div>
        </div>
      </div>
    );
  }

  // Show pending deletion screen if account is marked for deletion
  if (pendingDeletionAt && deletionChecked) {
    return (
      <div className="h-screen bg-background flex justify-center">
        <div className="w-full max-w-[375px]">
          <PendingDeletionBanner
            deletionRequestedAt={pendingDeletionAt}
            onCancelled={() => setPendingDeletionAt(null)}
          />
        </div>
      </div>
    );
  }

  const renderScreen = () => {
    switch (activeTab) {
      case "camera":
        return (
          <CameraScreen 
            onNavigateToCalendar={() => handleTabChange("calendar")} 
            onNavigateToProfile={handleNavigateToProfile} 
            analysisCount={analysisCount} 
            setAnalysisCount={setAnalysisCount} 
            isFreeUser={currentPlan === "free"}
            onOpenPaywall={() => handleNavigateToProfile(true)}
            isFirstPaidMonth={isFirstPaidMonth}
            currentPlan={currentPlan}
            hasActiveSubscription={currentPlan !== "free"}
            isReturningUser={hasEverSubscribed || false}
          />
        );
      case "calendar":
        return (
          <CalendarScreen 
            isPremium={isPremium} 
            isBasic={isBasic} 
            onUpgrade={() => handleNavigateToProfile(true)} 
            onNavigateToCamera={() => handleTabChange("camera")} 
            onNavigateToProfile={handleNavigateToProfile}
            analysisCount={analysisCount}
            onOpenReport={() => setShowReportScreen(true)}
            hasActiveSubscription={currentPlan !== "free"}
            isReturningUser={hasEverSubscribed || false}
          />
        );
      case "profile":
        return (
          <ProfileScreen 
            analysisCount={analysisCount} 
            isPremium={isPremium} 
            currentPlan={currentPlan} 
            onSelectPlan={handleSelectPlan} 
            scrollToPlan={scrollToPlan} 
            onScrollComplete={() => setScrollToPlan(false)} 
            onSignOut={handleSignOut} 
            isFirstPaidMonth={isFirstPaidMonth}
          />
        );
      default:
        return null;
    }
  };

  // Full-screen report view (hides bottom nav)
  if (showReportScreen) {
    return (
      <div className="h-screen bg-background flex justify-center overflow-hidden">
        <div className="w-full max-w-[375px] relative h-full">
          <ReportScreen 
            onClose={() => setShowReportScreen(false)} 
            onNavigateToCamera={() => {
              setShowReportScreen(false);
              setActiveTab("camera");
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex justify-center overflow-hidden">
      <div className="w-full max-w-[375px] relative overflow-hidden">
        <div className="h-full overflow-y-auto overscroll-y-contain">
          {renderScreen()}
        </div>
        
        <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    </div>
  );
}

const Index = () => (
  <ErrorBoundary>
    <LanguageProvider>
      <BadgeProvider>
        <ExtraCreditsProvider>
          <CalendarDecorationProvider>
            <SelectedDateProvider>
              <OptimisticImageProvider>
                <SharedElementProvider>
                  <AppContent />
                </SharedElementProvider>
              </OptimisticImageProvider>
            </SelectedDateProvider>
          </CalendarDecorationProvider>
        </ExtraCreditsProvider>
      </BadgeProvider>
    </LanguageProvider>
  </ErrorBoundary>
);

export default Index;
