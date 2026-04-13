
import { useState, useEffect, useRef } from "react";
import { BottomNavigation } from "@/components/BottomNavigation";
import { CameraScreen } from "@/components/screens/CameraScreen";
import { CalendarScreen } from "@/components/screens/CalendarScreen";
import { ProfileScreen } from "@/components/screens/ProfileScreen";
import { LandingScreen } from "@/components/screens/LandingScreen";
import { ReportScreen } from "@/components/report";
import { AuthDrawer } from "@/components/auth/AuthDrawer";
import { OnboardingFlow } from "@/components/onboarding";
import { ExtraCredits } from "@/components/onboarding/ExtraCredits";
import { ExtraCreditsPopup } from "@/components/common/ExtraCreditsPopup";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import { BadgeProvider, useBadge } from "@/contexts/BadgeContext";
import { CalendarDecorationProvider } from "@/contexts/CalendarDecorationContext";
import { useAuth } from "@/hooks/useAuth";
import { usePremium } from "@/hooks/usePremium";
import { usePet } from "@/hooks/usePet";
import { useProfile } from "@/hooks/useProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { App as CapacitorApp } from "@capacitor/app";
import { StatusBar, Style } from "@capacitor/status-bar";
import { RevenueCatService } from "@/lib/revenueCat";
import { Loader2, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { PendingDeletionScreen } from "@/components/PendingDeletionScreen";
import { AuthPage } from "@/components/screens/AuthPage"; // Added back for compatibility if needed, though we use Drawer now
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SharedElementProvider } from "@/contexts/SharedElementContext";
import { OptimisticImageProvider } from "@/contexts/OptimisticImageContext";
import { ExtraCreditsProvider } from "@/contexts/ExtraCreditsContext";
import { SelectedDateProvider } from "@/contexts/SelectedDateContext";

type TabId = "camera" | "calendar" | "profile";
type PlanType = "free" | "pro-monthly" | "pro-yearly";
type ViewState = "loading" | "landing" | "onboarding" | "auth" | "app";

function AppContent() {
  const {
    isAuthenticated,
    loading: authLoading,
    signOut
  } = useAuth();
  const { isPremium: isPremiumFromDb, isLoading: premiumLoading, planInterval } = usePremium();
  const { profile, updateProfile, loading: profileLoading } = useProfile(); // Get profile access
  const { hasPet, loading: petLoading } = usePet();
  const { clearBadges } = useBadge();

  // State
  const [viewState, setViewState] = useState<ViewState>("loading");
  const [activeTab, setActiveTab] = useState<TabId>("camera");
  const [showAuthDrawer, setShowAuthDrawer] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [showBirthdayModal, setShowBirthdayModal] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // App state
  // Removed local analysisCount state in favor of profile.credits
  const [currentPlan, setCurrentPlan] = useState<PlanType>("free");
  const [scrollToPlan, setScrollToPlan] = useState(false);
  const [scrollToExtraCredits, setScrollToExtraCredits] = useState(false);
  const [isFirstPaidMonth, setIsFirstPaidMonth] = useState(false);
  const [showExtraCredits, setShowExtraCredits] = useState(false);
  const [showExtraCreditsPopup, setShowExtraCreditsPopup] = useState(false);
  const [hasPurchasedPlan, setHasPurchasedPlan] = useState(false);
  const [showReportScreen, setShowReportScreen] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [scheduledChangeDate, setScheduledChangeDate] = useState<string | null>(() => localStorage.getItem("scheduled_change_date"));

  const { t } = useLanguage();
  const { offerings, purchase, isPro: isProNew, isReturningUser, planInterval: subPlanInterval, latestPurchaseDate } = useSubscription();

  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => {
    return localStorage.getItem("hasCompletedOnboarding") === "true";
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Combine Premium Status (DB + RevenueCat)
  const isPremium = isPremiumFromDb || isProNew;
  // Sync local plan state if premium detected
  useEffect(() => {
    if (isPremium) {
      if (planInterval === "monthly") {
        setCurrentPlan("pro-monthly");
      } else if (planInterval === "yearly") {
        setCurrentPlan("pro-yearly");
      } else {
        setCurrentPlan("pro-yearly"); // Default for other premium detections
      }
    } else {
      setCurrentPlan("free");
    }
  }, [isPremium, planInterval]);

  // Rigorous credit synchronization logic
  useEffect(() => {
    // Only attempt sync if we have all necessary data
    if (isProNew && latestPurchaseDate && profile && !profileLoading && subPlanInterval) {
      const syncKey = `petmood_last_sync_${profile.user_id}`;
      const planKey = `petmood_last_plan_${profile.user_id}`;
      const lastSyncDate = localStorage.getItem(syncKey);
      const lastSyncPlan = localStorage.getItem(planKey);

      const targetCredits = subPlanInterval === "yearly" ? 70 : 50;
      
      // Sync trigger: New purchase date (renewal/purchase) OR different plan (upgrade/downgrade)
      // Note: We check latestPurchaseDate to ensure we only grant credits after payment confirmation.
      if (latestPurchaseDate !== lastSyncDate || subPlanInterval !== lastSyncPlan) {
        console.log(`[Sync] Rigorous credit sync triggered. Interval: ${subPlanInterval}, Date: ${latestPurchaseDate}`);
        
        updateProfile({ credits: targetCredits })
          .then(() => {
            localStorage.setItem(syncKey, latestPurchaseDate);
            localStorage.setItem(planKey, subPlanInterval);
            console.log(`[Sync] Successfully refilled to ${targetCredits} credits.`);
            toast.success("Subscription credits updated!");
          })
          .catch((err) => {
            console.error("[Sync] Failed to sync credits with Supabase:", err);
          });
      }
    }
  }, [isProNew, latestPurchaseDate, subPlanInterval, profile, profileLoading, updateProfile]);

  const isBasic = false;

  // Initialize Global App Features on Mount
  useEffect(() => {
    // Set status bar color to match app (Beige/Primary)
    try {
      StatusBar.setBackgroundColor({ color: '#FCF8F4' }).catch(e => console.warn("StatusBar color failed:", e));
      StatusBar.setStyle({ style: Style.Light }).catch(e => console.warn("StatusBar style failed:", e));
    } catch (e) {
      console.warn("StatusBar not available:", e);
    }
  }, []);

  // Back Button Handling
  const lastBackPressRef = useRef<number>(0);

  useEffect(() => {
    let backListener: any = null;

    const setupListener = async () => {
      backListener = await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        console.log("[Index] Back button pressed. canGoBack:", canGoBack);

        // Priority 1: Full-screen report
        if (showReportScreen) {
          setShowReportScreen(false);
          return;
        }

        // Priority 2: High-level UI overrides (Paywall, Auth)
        if (showPaywall) {
          setShowPaywall(false);
          return;
        }

        if (showAuthDrawer) {
          setShowAuthDrawer(false);
          return;
        }

        if (isSettingsOpen) {
          setIsSettingsOpen(false);
          return;
        }

        // Priority 3: Nested history (Settings -> Profile -> App)
        // Check if there's actual browser history we should use
        if (canGoBack) {
          window.history.back();
        } else {
          // Priority 4: Tab-based navigation fallback
          // If we are deep in the app but at the root of a tab, go to Camera instead of exiting
          if (viewState === "app" && activeTab !== "camera") {
            setActiveTab("camera");
          } else {
            // Only exit if we are at the very root of the app experience
            const now = Date.now();
            if (now - lastBackPressRef.current < 2000) {
              console.log("[Index] Double back press confirmed, exiting app.");
              CapacitorApp.exitApp();
            } else {
              lastBackPressRef.current = now;
                toast(t("pressAgainToExit"));
            }
          }
        }
      });
    };

    setupListener();

    return () => {
      if (backListener) {
        console.log("[Index] Cleaning up back button listener");
        backListener.remove();
      }
    };
  }, [showPaywall, isPremium, showAuthDrawer, viewState, activeTab, showReportScreen, isSettingsOpen]);

  // Determine view state
  useEffect(() => {
    const hasHashTokens = window.location.hash.includes('access_token') || window.location.hash.includes('error');
    const hasQueryTokens = window.location.search.includes('access_token') ||
      window.location.search.includes('code') ||
      window.location.search.includes('error');

    console.log("[Index] Current ViewState:", viewState);
    console.log("[Index] Auth State:", { isAuthenticated, authLoading });
    console.log("[Index] URL Status:", { hasHashTokens, hasQueryTokens });

    if (hasHashTokens || hasQueryTokens) {
      console.log("[Index] Tokens/Code detected in URL, waiting for auth to process...");

      // Safety timeout: if we are stuck on loading with tokens for more than 5 seconds
      // and auth has finished loading but we aren't authenticated, move to landing.
      const timer = setTimeout(() => {
        if (!isAuthenticated && !authLoading && viewState === "loading") {
          console.warn("[Index] Auth timeout: tokens present but no session after 5s. Redirecting to landing.");
          setViewState("landing");
        }
      }, 5000);
      return () => clearTimeout(timer);
    }

    // If we are already in the app and auth is loading (re-checking), don't show full screen loader
    if (authLoading && viewState !== "app" && viewState !== "onboarding") {
      setViewState("loading");
      return;
    }

    if (isAuthenticated) {
      if (petLoading && viewState !== "app" && viewState !== "onboarding") {
        setViewState("loading");
      } else if (hasPet) {
        // Sync local storage for returning users
        if (!hasCompletedOnboarding) {
          localStorage.setItem("hasCompletedOnboarding", "true");
          localStorage.setItem("hasCompletedCarousel", "true");
          setHasCompletedOnboarding(true);
        }
        setViewState("app");
        setShowAuthDrawer(false);
      } else {
        // Authenticated but no pet - show onboarding (which will skip to pet setup)
        if (viewState !== "onboarding") {
          setViewState("onboarding");
          setShowAuthDrawer(false);
        }
      }
      // CRITICAL: Ensure we don't fall through to landing if authenticated
      return;
    }

    // Not authenticated
    if (!authLoading && !isAuthenticated) {
      // If we see tokens in the URL, stay on loading (the timeout above will catch failures)
      if (hasHashTokens || hasQueryTokens) {
        setViewState("loading");
        return;
      }

      // If we are already in onboarding, don't revert to landing
      if (viewState === "onboarding") {
        return;
      }

      // If user exited WITHOUT sign-in, show landing
      if (!hasCompletedOnboarding) {
        setViewState("landing");
      } else {
        setViewState("landing");
      }
    }
  }, [authLoading, isAuthenticated, petLoading, hasPet, hasCompletedOnboarding, viewState]);

  // Enforce Paywall for Free Users (Mandatory)
  // Enforce Paywall for Free Users (Mandatory) - REMOVED
  /*
  useEffect(() => {
    // Wait for all checks to finish before forcing paywall
    if (premiumLoading || isCheckingRevenueCat) return;

    if (viewState === "app" && !isPremium) {
      setShowPaywall(true);
    }
  }, [viewState, isPremium, premiumLoading, isCheckingRevenueCat]);
  */

  // Premium State Logic
  useEffect(() => {
    if (isPremiumFromDb && !hasPurchasedPlan) {
      setHasPurchasedPlan(true);
      setCurrentPlan("pro-yearly");
    }
  }, [isPremiumFromDb, hasPurchasedPlan]);

  // Handlers
  const handleLandingGetStarted = () => {
    setViewState("onboarding");
  };

  const handleLandingSignIn = () => {
    setAuthMode("signin");
    setShowAuthDrawer(true);
  };

  const handleOnboardingComplete = () => {
    // This now only triggers AFTER account creation/plan selection
    onCompleteFlow();
  };

  const onCompleteFlow = () => {
    localStorage.setItem("hasCompletedOnboarding", "true");
    setHasCompletedOnboarding(true);
    setViewState("app");
  };

  const handleCarouselComplete = () => {
    localStorage.setItem("hasCompletedCarousel", "true");
    setViewState("landing");
  };

  const handleSelectPlan = async (plan: PlanType) => {
    if (plan === "free") {
      setShowPaywall(false);
      return;
    }

    if (scheduledChangeDate) {
      toast(t("planScheduledChange").replace("{{date}}", scheduledChangeDate) + " " + t("downgradeEffectAfterEnd"), {
        duration: 5000
      });
      return;
    }

    // Determine package to buy
    const pkg = plan === "pro-monthly" ? offerings.monthly : offerings.yearly;

    if (pkg) {
      // Mocked date for demonstration in toasts as requested
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const dateStr = futureDate.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });

    const success = await purchase(pkg);
    if (success) {
      // In a real flow, RevenueCat handle the entitlements
      // The credit sync useEffect will pick up the change and refill Supabase
      
      const isUpgrade = (currentPlan === "free") || (currentPlan === "pro-monthly" && plan === "pro-yearly");

      if (isUpgrade) {
        toast.success(t("planChangedUpgrade").replace("{{date}}", new Date().toLocaleDateString("en-US")));
      } else {
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 1);
        const dateStr = futureDate.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
        toast.info(t("planChangedDowngrade").replace("{{date}}", dateStr));
        setScheduledChangeDate(dateStr);
        localStorage.setItem("scheduled_change_date", dateStr);
      }

      // Handle onboarding success toast specifically
      if (viewState === "onboarding") {
        toast(t("onboardingSuccess"), {
          icon: "🎉",
          position: "bottom-center"
        });
      }

      setCurrentPlan(plan);
      setHasPurchasedPlan(true);
      setShowPaywall(false);
    }
    } else {
      // Fallback for web / testing if no package found
      // toast.error("No package found. Are you on a device?");
      // For testing purposes, we might want to simulate success if on Web?
      // But user said "no free plan", so we should be strict.
      // However, if we are debugging on web, this blocks us.
      // Let's keep the old logic ONLY if on web/no-package.
      console.warn("No package found, strictly skipping for dev/web check or failed load.");
    }
  };

  const handlePurchaseExtraCredits = async (packageId: string) => {
    const packageInfo = {
      "10": 10,
      "20": 20,
      "30": 30
    }[packageId as "10" | "20" | "30"] || 0;

    if (packageInfo > 0 && profile) {
      try {
        await updateProfile({ credits: profile.credits + packageInfo });
        toast.success(`Successfully added ${packageInfo} credits!`);
        setShowExtraCredits(false);
        setShowExtraCreditsPopup(false);
      } catch (err) {
        toast.error("Failed to add credits. Please try again.");
      }
    }
  };

  const handleCloseExtraCreditsPopup = () => {
    setShowExtraCreditsPopup(false);
    // Mark as dismissed for current billing period (using a simple timestamp check for now)
    // In a real app, this might be synced with the billing cycle end date.
    const now = new Date();
    localStorage.setItem("extra_credits_popup_dismissed_month", now.getMonth().toString());
    localStorage.setItem("extra_credits_popup_dismissed_year", now.getFullYear().toString());
  };



  const handleSignOut = async () => {
    await signOut();
    setShowAuthDrawer(false);
    setShowPaywall(false); // Close paywall on signout
    setScheduledChangeDate(null);
    localStorage.removeItem("scheduled_change_date");
  };

  const handleNavigateToProfile = (openPlanSection = false, openExtraCredits = false) => {
    setActiveTab("profile");
    if (openPlanSection) {
      // Small timeout to ensure tab switch happens first
      setTimeout(() => setScrollToPlan(true), 100);
    }
    if (openExtraCredits) {
      setTimeout(() => setScrollToExtraCredits(true), 100);
    }
  };

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    // Reset scroll when switching to profile
    if (tab === "profile" && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  };

  const handleOpenPaywall = () => {
    setShowPaywall(true);
  };

  const handleClosePaywall = () => {
    setShowPaywall(false);
  };

  // Determine main component to render
  let content;
  if (viewState === "loading") {
    content = (
      <div className="h-screen bg-background flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  } else if (viewState === "onboarding") {
    content = (
      <OnboardingFlow
        onComplete={handleOnboardingComplete}
        onCarouselComplete={handleCarouselComplete}
        onSignIn={handleLandingSignIn}
        initialStep={localStorage.getItem("hasCompletedCarousel") === "true" ? "pet-setup" : "loading"}
      />
    );
  } else if (viewState === "landing") {
    content = (
      <LandingScreen
        onGetStarted={handleLandingGetStarted}
        onSignIn={handleLandingSignIn}
      />
    );
  } else {
    // App View
    content = (
      <div className="h-screen flex justify-center overflow-hidden">
        <div className="app-container relative h-full">
          <div
            ref={scrollContainerRef}
            className={cn(
              "h-full overscroll-y-contain",
              activeTab === "profile" ? "overflow-y-auto" : "overflow-hidden"
            )}>
            {activeTab === "camera" && (
              <CameraScreen
                onNavigateToCalendar={() => handleTabChange("calendar")}
                onNavigateToProfile={handleNavigateToProfile}
                analysisCount={profile?.credits ?? 0}
                setAnalysisCount={(newCount) => {
                  if (typeof newCount === 'function') {
                    // unexpected
                  } else {
                    updateProfile({ credits: newCount });
                  }
                }}
                isFreeUser={currentPlan === "free"}
                onOpenExtraCredits={() => setShowExtraCredits(true)}
                onOpenExtraCreditsPopup={() => setShowExtraCreditsPopup(true)}
                isFirstPaidMonth={isFirstPaidMonth}
                currentPlan={currentPlan}
                isReturningUser={isReturningUser || false}
                hasActiveSubscription={isPremium}
              />
            )}
            {activeTab === "calendar" && (
              <CalendarScreen
                isPremium={isPremium}
                isBasic={isBasic}
                onNavigateToCamera={() => handleTabChange("camera")}
                onNavigateToProfile={handleNavigateToProfile}
                analysisCount={profile?.credits ?? 0}
                onOpenReport={() => setShowReportScreen(true)}
                onUpgrade={() => handleNavigateToProfile(true)}
              />
            )}
            {activeTab === "profile" && (
              <ProfileScreen
                analysisCount={profile?.credits ?? 0}
                isPremium={isPremium}
                currentPlan={planInterval === "yearly" ? "pro-yearly" : planInterval === "monthly" ? "pro-monthly" : "free"}
                onSelectPlan={handleSelectPlan}
                scrollToPlan={scrollToPlan}
                onScrollComplete={() => {
                  setScrollToPlan(false);
                  setScrollToExtraCredits(false);
                }}
                onSignOut={handleSignOut}
                isFirstPaidMonth={isFirstPaidMonth}
                scrollToExtraCredits={scrollToExtraCredits}
              />
            )}
          </div>

          <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
        </div>
      </div>
    );
  }

  // Full-screen report view (hides bottom nav)
  // Full-screen report view handled as overlay now

  return (
    <>
      {content}

      {/* ProPaywall Removed */}
      {/* <ProPaywall
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        onSubscribe={handleSelectPlan}
        isFirstPurchase={!hasPurchasedPlan}
        allowClose={true}
        onSignOut={handleSignOut}
        isReturningUser={isReturningUser || false}
      /> */}

      <AuthDrawer
        isOpen={showAuthDrawer}
        onClose={() => setShowAuthDrawer(false)}
        mode={authMode}
      />

      <Drawer open={showExtraCredits} onOpenChange={setShowExtraCredits}>
        <DrawerContent className="h-[85vh] p-0 overflow-hidden">
          <ExtraCredits
            onPurchase={handlePurchaseExtraCredits}
            onSkip={() => setShowExtraCredits(false)}
          />
        </DrawerContent>
      </Drawer>
      <AnimatePresence>
        {showExtraCreditsPopup && (
          <ExtraCreditsPopup
            onClose={handleCloseExtraCreditsPopup}
            onPurchase={handlePurchaseExtraCredits}
          />
        )}
      </AnimatePresence>

      {/* Report Screen Overlay - Keeps BottomNav mounted in background */}
      <AnimatePresence>
        {showReportScreen && (
          <div className="fixed inset-0 z-[100] bg-background flex justify-center overflow-hidden">
            <div className="app-container relative h-full">
              <ReportScreen
                onClose={() => setShowReportScreen(false)}
                onNavigateToCamera={() => {
                  setShowReportScreen(false);
                  setActiveTab("camera");
                }}
              />
            </div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAuthenticated && profile?.deletion_requested_at && (
          <PendingDeletionScreen
            deletionRequestedAt={profile.deletion_requested_at}
            onCancelled={() => {
              // Reload profile to reflect deletion_requested_at: null
              updateProfile({}); // Dummy update to trigger refetch via mutation or handle with query invalidation
              // Better: use queryClient directly or trust the supabase update in PendingDeletionScreen
              // In PendingDeletionScreen it updates supabase directly. 
              // ProfileContext Query should refetch.
            }}
            onSignOut={handleSignOut}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default AppContent;
