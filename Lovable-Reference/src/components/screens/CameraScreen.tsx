import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Camera, X, Zap, FlipHorizontal, ImagePlus, Check, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMoodEntries, AnalysisResult, ValidationResult } from "@/hooks/useMoodEntries";
import { useBadge } from "@/contexts/BadgeContext";
import { useOptimisticImage } from "@/contexts/OptimisticImageContext";
import { toast } from "sonner";
import { AnalysisCard } from "@/components/calendar/AnalysisCard";
import { cn } from "@/lib/utils";
import { PremiumLockOverlay } from "@/components/PremiumLockOverlay";
import { ContentCard, ContentCardCorners } from "@/components/ui/content-card";
import { AnalyzeLockedModule } from "./AnalyzeLockedModule";
import { HomeMainView } from "./HomeMainView";
import { checkAndSelectHeroPhoto } from "@/hooks/useWeeklyHeroPhoto";
import { useExtraCredits } from "@/contexts/ExtraCreditsContext";
import { AnimatePresence, motion } from "framer-motion";
import { ExtraCreditsModal } from "@/components/ExtraCreditsModal";

interface CameraScreenProps {
  onNavigateToCalendar: () => void;
  onNavigateToProfile: (scrollToPlan?: boolean) => void;
  analysisCount: number;
  setAnalysisCount: (count: number) => void;
  isFreeUser: boolean;
  onOpenPaywall?: () => void;
  isFirstPaidMonth?: boolean;
  currentPlan?: "free" | "pro-monthly" | "pro-yearly";
  /** Whether user has an active monthly/yearly subscription */
  hasActiveSubscription?: boolean;
  /** Whether user has ever subscribed (for lock screen copy differentiation) */
  isReturningUser?: boolean;
}

// Pending save queue for retry logic
interface PendingSave {
  imageData: string;
  result: AnalysisResult;
  timestamp: number;
  retries: number;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;
const CAMERA_STATE_KEY = "camera_screen_state";

interface PersistedCameraState {
  capturedImage: string | null;
  result: AnalysisResult | null;
  isAnalyzing: boolean;
  saveStatus: "idle" | "saving" | "saved" | "error";
  savedEntryId: string | null;
}

function loadCameraState(): PersistedCameraState | null {
  try {
    const stored = sessionStorage.getItem(CAMERA_STATE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load camera state:", e);
  }
  return null;
}

function saveCameraState(state: PersistedCameraState) {
  try {
    sessionStorage.setItem(CAMERA_STATE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save camera state:", e);
  }
}

function clearCameraState() {
  try {
    sessionStorage.removeItem(CAMERA_STATE_KEY);
  } catch (e) {
    console.error("Failed to clear camera state:", e);
  }
}

export function CameraScreen({
  onNavigateToCalendar,
  onNavigateToProfile,
  analysisCount,
  setAnalysisCount,
  isFreeUser,
  onOpenPaywall,
  isFirstPaidMonth = false,
  currentPlan = "free",
  hasActiveSubscription = false,
  isReturningUser = false
}: CameraScreenProps) {
  const { t } = useLanguage();
  const { entries, uploadImage, validateImage, analyzeMood, createEntry } = useMoodEntries();
  const { addUnreadEntry, removeOptimisticEntry } = useBadge();
  const { setOptimisticImage, clearOptimisticImage } = useOptimisticImage();
  const { extraCredits } = useExtraCredits();
  const planType = isFreeUser ? "free" : "other";

  /**
   * SINGLE SOURCE OF TRUTH for Home screen lock state
   * 
   * GATING LOGIC:
   * - Lock if NO active subscription (regardless of credits/extra credits)
   * - Active subscription = the only condition to unlock
   * - Extra/purchased credits can remain stored, but cannot unlock without subscription
   */
  const isHomeLocked = useMemo(() => {
    // For new users on free tier, lock when credits are 0
    if (isFreeUser && !isReturningUser) {
      return analysisCount <= 0;
    }
    // For returning users or anyone who had a subscription, require active subscription
    return !hasActiveSubscription;
  }, [analysisCount, hasActiveSubscription, isFreeUser, isReturningUser]);
  
  // Load persisted state on mount
  const persistedState = loadCameraState();
  
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(persistedState?.capturedImage || null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(persistedState?.isAnalyzing || false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">(persistedState?.saveStatus || "idle");
  const [result, setResult] = useState<AnalysisResult | null>(persistedState?.result || null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [savedEntryId, setSavedEntryId] = useState<string | null>(persistedState?.savedEntryId || null);
  const [showCreditBreakdown, setShowCreditBreakdown] = useState(false);
  const [showExtraCreditsModal, setShowExtraCreditsModal] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasAutoStarted = useRef(false);
  const pendingSavesRef = useRef<PendingSave[]>([]);
  const isSavingRef = useRef(false);

  // Optimistic entry ref for rollback
  const optimisticEntryRef = useRef<{ id: string; date: Date } | null>(null);

  // Persist camera state when relevant values change
  useEffect(() => {
    saveCameraState({
      capturedImage,
      result,
      isAnalyzing,
      saveStatus,
      savedEntryId,
    });
  }, [capturedImage, result, isAnalyzing, saveStatus, savedEntryId]);

  /**
   * Recovery guard: if we restored a captured image from sessionStorage but have no result
   * (common after refresh/background), the render can fall into a state where nothing is shown.
   *
   * Fix: automatically resume analysis when credits exist; otherwise reset back to Home/Lock UI.
   */
  useEffect(() => {
    const isOrphanedCapture =
      !!capturedImage &&
      !result &&
      !isAnalyzing &&
      !validationError &&
      !analysisError;

    if (!isOrphanedCapture) return;

    if (analysisCount > 0) {
      startAnalysis(capturedImage);
      return;
    }

    // No credits -> go back to initial state instead of rendering blank
    resetCamera();
  }, [capturedImage, result, isAnalyzing, validationError, analysisError, analysisCount]);

  // Close credit breakdown when clicking outside
  useEffect(() => {
    if (!showCreditBreakdown) return;
    
    const handleClickOutside = () => setShowCreditBreakdown(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showCreditBreakdown]);

  // Show extra credits popup for PAYING users when plan credits deplete
  // Rules:
  // 1. Only for paying users (not free tier)
  // 2. Show when plan credits hit 0 (after an analysis depletes them)
  // 3. If dismissed, don't show again for that billing period
  // 4. Also show if extra credits hit 0 (once per depletion event)
  const prevPlanCreditsRef = useRef<number | null>(null);
  const prevExtraCreditsRef = useRef<number | null>(null);
  
  useEffect(() => {
    // Skip for free users - they never purchased a plan
    if (isFreeUser) return;
    
    // Skip if analyzing or capturing
    if (capturedImage || isAnalyzing) return;
    
    const isYearly = currentPlan === "pro-yearly";
    const planCredits = isYearly ? 70 : 50;
    const currentPlanCredits = planCredits; // In real app, this would be actual remaining plan credits
    
    // Check if user dismissed this billing period
    const dismissKey = `extra_credits_dismissed_${currentPlan}`;
    const isDismissed = localStorage.getItem(dismissKey) === "true";
    
    if (isDismissed) return;
    
    // Detect plan credits hitting 0 (transition from >0 to 0)
    // For now, show when analysisCount hits 0 for paying users (plan credits depleted)
    const planCreditsJustDepleted = 
      prevPlanCreditsRef.current !== null && 
      prevPlanCreditsRef.current > 0 && 
      analysisCount <= 0;
    
    // Detect extra credits hitting 0
    const extraCreditsJustDepleted = 
      prevExtraCreditsRef.current !== null && 
      prevExtraCreditsRef.current > 0 && 
      extraCredits <= 0 &&
      analysisCount <= 0; // Only if plan credits also 0
    
    // Track previous values
    prevPlanCreditsRef.current = analysisCount;
    prevExtraCreditsRef.current = extraCredits;
    
    // Show popup on depletion events
    if (planCreditsJustDepleted || extraCreditsJustDepleted) {
      setShowExtraCreditsModal(true);
    }
  }, [currentPlan, isFreeUser, extraCredits, analysisCount, capturedImage, isAnalyzing]);
  
  // Handle modal close - track dismissal for billing period
  const handleExtraCreditsClose = useCallback(() => {
    const dismissKey = `extra_credits_dismissed_${currentPlan}`;
    localStorage.setItem(dismissKey, "true");
    setShowExtraCreditsModal(false);
  }, [currentPlan]);

  // Process pending saves queue
  const processPendingSaves = useCallback(async () => {
    if (isSavingRef.current || pendingSavesRef.current.length === 0) return;
    
    isSavingRef.current = true;
    const pending = pendingSavesRef.current[0];
    
    try {
      let imageUrl = pending.imageData;
      const isLocalImage = pending.imageData.startsWith("data:");
      
      if (isLocalImage) {
        imageUrl = await uploadImage(pending.imageData);
      }
      const newEntry = await createEntry(imageUrl, pending.result);
      
      console.log("[processPendingSaves] Save success:", {
        entryId: newEntry.id,
        analyzedAt: newEntry.analyzed_at,
        localDate: new Date(newEntry.analyzed_at).toLocaleDateString(),
      });
      
      // Cache the local image for the real entry ID so calendar can show it immediately
      if (isLocalImage) {
        setOptimisticImage(newEntry.id, pending.imageData);
        console.log("[processPendingSaves] Cached local image for entry:", newEntry.id);
      }
      
      // Success - remove from queue
      pendingSavesRef.current.shift();
      
      // Remove optimistic entry and add real one
      if (optimisticEntryRef.current) {
        removeOptimisticEntry(optimisticEntryRef.current.id);
        // Also clear the optimistic entry's cached image
        clearOptimisticImage(optimisticEntryRef.current.id);
        optimisticEntryRef.current = null;
      }
      addUnreadEntry(newEntry.id, new Date(newEntry.analyzed_at));
      
      // Check if this save triggered the 5/5 day threshold for weekly hero photo
      // This runs IMMEDIATELY after save - before user opens Mood Report
      const allEntriesIncludingNew = [...entries, newEntry];
      const heroSelected = checkAndSelectHeroPhoto(allEntriesIncludingNew);
      if (heroSelected) {
        console.log("[processPendingSaves] Weekly hero photo locked after this save!");
      }
      
      // Background save succeeded - no toast needed (already shown optimistically)
      // Just update the saved entry ID
      setSavedEntryId(newEntry.id);
    } catch (error) {
      console.error("[processPendingSaves] Error:", error);
      pending.retries++;
      
      if (pending.retries >= MAX_RETRIES) {
        // Max retries reached - remove from queue but notify user
        pendingSavesRef.current.shift();
        
        // Rollback optimistic badge and clear cached image
        if (optimisticEntryRef.current) {
          removeOptimisticEntry(optimisticEntryRef.current.id);
          clearOptimisticImage(optimisticEntryRef.current.id);
          optimisticEntryRef.current = null;
        }
        
        setSaveStatus("error");
        toast.error("Couldn't save. Tap to retry", {
          id: "save-toast",
          action: {
            label: "Retry",
            onClick: () => {
              if (capturedImage && result) {
                // Show success immediately again (optimistic retry)
                setSaveStatus("saved");
                toast.success("Saved to calendar", { 
                  id: "save-toast", 
                  duration: 1500,
                  icon: <Check className="w-4 h-4 text-green-500" />,
                });
                pendingSavesRef.current.push({
                  imageData: capturedImage,
                  result: result,
                  timestamp: Date.now(),
                  retries: 0,
                });
                processPendingSaves();
              }
            }
          }
        });
      } else {
        // Retry after delay
        setTimeout(() => {
          isSavingRef.current = false;
          processPendingSaves();
        }, RETRY_DELAY);
        return;
      }
    }
    
    isSavingRef.current = false;
    
    // Process next item if any
    if (pendingSavesRef.current.length > 0) {
      processPendingSaves();
    }
  }, [uploadImage, createEntry, addUnreadEntry, removeOptimisticEntry, setOptimisticImage, clearOptimisticImage, capturedImage, result]);

  // Auto-save when analysis result is ready - show SUCCESS immediately (optimistic)
  useEffect(() => {
    if (result && capturedImage && !savedEntryId && !validationError && saveStatus === "idle") {
      // IMMEDIATELY show SUCCESS toast - no loading state
      setSaveStatus("saved");
      
      // Show success toast right away (optimistic)
      toast.success("Saved to calendar", { 
        id: "save-toast", 
        duration: 1500,
        icon: <Check className="w-4 h-4 text-green-500" />,
      });
      
      // Optimistic badge update - instant
      const optimisticId = `optimistic-${Date.now()}`;
      const now = new Date();
      optimisticEntryRef.current = { id: optimisticId, date: now };
      addUnreadEntry(optimisticId, now);
      
      // Cache local image for optimistic entry so calendar can show it immediately
      if (capturedImage.startsWith("data:")) {
        setOptimisticImage(optimisticId, capturedImage);
        console.log("[AutoSave] Cached local image for optimistic entry:", optimisticId);
      }
      
      console.log("[AutoSave] Optimistic save shown:", {
        optimisticId,
        localDate: now.toLocaleDateString(),
        mood: result.mood,
      });
      
      // Queue the actual save (happens silently in background)
      pendingSavesRef.current.push({
        imageData: capturedImage,
        result: result,
        timestamp: Date.now(),
        retries: 0,
      });
      
      // Start processing in background
      processPendingSaves();
    }
  }, [result, capturedImage, savedEntryId, validationError, saveStatus, processPendingSaves, addUnreadEntry, setOptimisticImage]);

  // Clean up camera stream on unmount (no auto-start — user taps "Take Photo")
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = useCallback(async () => {
    console.log("startCamera called, analysisCount:", analysisCount);
    setPermissionDenied(false);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.log("Camera API not available - staying on home view");
        // Don't set cameraActive - stay on HomeMainView so buttons remain visible
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false
      });
      console.log("Camera stream obtained:", stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
        setPermissionDenied(false);
        console.log("Camera activated successfully");
      }
    } catch (error: any) {
      console.log("Camera access denied or not available", error);
      if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
        setPermissionDenied(true);
        setCameraActive(false);
      } else {
        // For other errors (e.g., no camera device), stay on home view
        // Don't set cameraActive to avoid showing blank viewfinder
        console.log("Camera not available - staying on home view");
      }
    }
  }, [facingMode, analysisCount]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const toggleCamera = () => {
    setFacingMode(prev => prev === "environment" ? "user" : "environment");
  };

  useEffect(() => {
    if (cameraActive && !capturedImage) {
      stopCamera();
      startCamera();
    }
  }, [facingMode]);

  const capturePhoto = () => {
    console.log("[CameraScreen] Capturing photo...");
    
    if (videoRef.current && canvasRef.current && streamRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      console.log("[CameraScreen] Canvas dimensions:", canvas.width, "x", canvas.height);
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL("image/jpeg", 0.8);
        console.log("[CameraScreen] Captured image size:", Math.round(imageData.length / 1024) + "KB");
        setCapturedImage(imageData);
        stopCamera();
        startAnalysis(imageData);
      } else {
        console.error("[CameraScreen] Failed to get canvas context");
        setAnalysisError("Failed to capture photo. Please try again.");
      }
    } else {
      // Mock capture when no camera available
      console.log("[CameraScreen] Using mock capture (no camera stream)");
      const mockImageUrl = "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop";
      setCapturedImage(mockImageUrl);
      stopCamera();
      startMockAnalysis();
    }
  };

  const startMockAnalysis = () => {
    if (analysisCount <= 0) return;
    setIsAnalyzing(true);
    setResult(null);
    setSavedEntryId(null);

    setTimeout(() => {
      setResult({
        mood: "Happy",
        mood_emoji: "😊",
        mood_description: "Your pet appears to be in a happy and content state, with relaxed body language.",
        confidence: 87,
        care_tip: "Keep up the great care! Your pet seems very happy and healthy."
      });
      setIsAnalyzing(false);
      setAnalysisCount(analysisCount - 1);
    }, 2500);
  };

  const startAnalysis = async (imageData: string) => {
    console.log("[CameraScreen] Starting analysis, credits:", analysisCount);
    
    if (analysisCount <= 0) {
      console.warn("[CameraScreen] No credits remaining");
      return;
    }
    
    // Show analyzing screen immediately
    setIsAnalyzing(true);
    setValidationError(null);
    setAnalysisError(null);
    setResult(null);
    setSavedEntryId(null);
    setSaveStatus("idle");
    
    try {
      console.log("[CameraScreen] Running parallel validation and analysis...");
      
      // Run validation and analysis in PARALLEL for performance
      const [validation, analysisResult] = await Promise.all([
        validateImage(imageData),
        analyzeMood(imageData),
      ]);
      
      console.log("[CameraScreen] Parallel calls complete:", {
        validationValid: validation.valid,
        analysisResult: analysisResult?.mood,
      });
      
      // Check validation result first
      if (!validation.valid) {
        // Validation failed - stop and show error (no credits consumed)
        console.warn("[CameraScreen] Validation failed:", validation.error_message);
        setIsAnalyzing(false);
        setValidationError(validation.error_message || "This photo isn't suitable for analysis. Please try again.");
        return;
      }
      
      // Validation passed - use the analysis result
      console.log("[CameraScreen] Analysis successful:", analysisResult);
      setResult(analysisResult);
      setAnalysisCount(analysisCount - 1);
    } catch (error) {
      console.error("[CameraScreen] Analysis error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to analyze mood";
      setAnalysisError(errorMessage);
      // Don't set a fallback result - let user retry
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRetryAnalysis = () => {
    if (capturedImage) {
      console.log("[CameraScreen] Retrying analysis...");
      setAnalysisError(null);
      startAnalysis(capturedImage);
    }
  };

  const resetCamera = () => {
    console.log("[CameraScreen] Resetting camera state");
    setCapturedImage(null);
    setResult(null);
    setValidationError(null);
    setAnalysisError(null);
    setIsAnalyzing(false);
    setShowUpgradePrompt(false);
    setSavedEntryId(null);
    setSaveStatus("idle");
    // Clear persisted state when resetting
    clearCameraState();
  };

  const handleUploadFromGallery = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("[CameraScreen] File selected:", { 
        name: file.name, 
        size: Math.round(file.size / 1024) + "KB", 
        type: file.type 
      });
      
      // Validate file size (max 10MB for initial selection, will be compressed)
      if (file.size > 10 * 1024 * 1024) {
        console.warn("[CameraScreen] File too large:", file.size);
        setAnalysisError("Image is too large. Please select a smaller image (max 10MB).");
        setCapturedImage(null);
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith("image/")) {
        console.warn("[CameraScreen] Invalid file type:", file.type);
        setAnalysisError("Please select an image file.");
        setCapturedImage(null);
        return;
      }
      
      const reader = new FileReader();
      reader.onerror = () => {
        console.error("[CameraScreen] FileReader error");
        setAnalysisError("Failed to read the image file. Please try again.");
      };
      reader.onloadend = () => {
        const imageData = reader.result as string;
        console.log("[CameraScreen] Image loaded, size:", Math.round(imageData.length / 1024) + "KB");
        setCapturedImage(imageData);
        stopCamera();
        startAnalysis(imageData);
      };
      reader.readAsDataURL(file);
    }
    // Reset the input so the same file can be selected again
    e.target.value = "";
  };

  // Close the analysis card - save is already done automatically
  const handleCloseAnalysisCard = () => {
    // Save already happened automatically, just reset
    resetCamera();
  };

  const remainingFree = Math.max(0, analysisCount);
  
  // Get credits display text with inline breakdown
  // Format: free → monthly/yearly → extra (order matches consumption priority)
  // Calculate total credits for pill display
  const getTotalCredits = () => {
    const isYearly = currentPlan === "pro-yearly";
    const planCredits = isFreeUser ? 0 : (isYearly ? 70 : 50);
    const freeCredits = isFreeUser ? remainingFree : (isFirstPaidMonth ? 3 : 0);
    const total = freeCredits + planCredits + extraCredits;
    return total;
  };

  // Breakdown for info popover (e.g., "Free 3 · Yearly 70 · Extra 40")
  const getCreditsBreakdown = () => {
    // If total credits is 0, show localized "0 credits remaining"
    const total = getTotalCredits();
    if (total === 0) {
      return t("zeroCreditsRemaining");
    }
    
    const isYearly = currentPlan === "pro-yearly";
    const planLabel = isYearly ? "Yearly" : "Monthly";
    const planCredits = isYearly ? 70 : 50;
    
    const parts: string[] = [];
    
    // Free credits
    if (isFreeUser) {
      if (remainingFree > 0) parts.push(`Free ${remainingFree}`);
    } else if (isFirstPaidMonth) {
      parts.push("Free 3");
    }
    
    // Plan credits (only for paid users)
    if (!isFreeUser) {
      parts.push(`${planLabel} ${planCredits}`);
    }
    
    // Extra credits
    if (extraCredits > 0) {
      parts.push(`Extra ${extraCredits}`);
    }
    
    return parts.join(" · ") || t("zeroCreditsRemaining");
  };
  return (
    <div className="flex flex-col relative z-10">
      <canvas ref={canvasRef} className="hidden" />
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

      {/* Header */}
      <header className="px-5 pt-10 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">PetMood</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{t("appSubtitle")}</p>
          </div>
          {/* Credit pill with absolute-positioned info breakdown */}
          <div className="relative">
            {/* Top pill (info breakdown) - absolute positioned to avoid layout shift */}
            <AnimatePresence>
              {showCreditBreakdown && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 px-3 py-1.5 rounded-[16px] text-[11px] font-bold tracking-tight whitespace-nowrap"
                  style={{
                    bottom: 'calc(100% + 6px)',
                    background: 'linear-gradient(135deg, rgba(255, 140, 80, 0.22) 0%, rgba(255, 120, 60, 0.16) 100%)',
                    border: '1px solid rgba(255, 106, 0, 0.65)',
                    boxShadow: '0 2px 10px rgba(255, 106, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
                    color: '#FF6A00',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {getCreditsBreakdown()}
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Credit pill (main display) */}
            <div 
              onClick={() => onNavigateToProfile(true)}
              className={cn(
                "flex items-center gap-2 pl-4 pr-2 py-2 rounded-[20px] transition-all hover:shadow-md cursor-pointer",
                !showCreditBreakdown && "active:scale-[0.97]"
              )}
              style={{
                background: 'linear-gradient(135deg, rgba(255, 140, 80, 0.22) 0%, rgba(255, 120, 60, 0.16) 100%)',
                boxShadow: '0 2px 10px rgba(255, 106, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
              }}
            >
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" style={{ color: '#FF6A00' }} fill="#FF6A00" />
                <span 
                  className="text-xs font-bold"
                  style={{ color: '#FF6A00' }}
                >
                  {getTotalCredits()}
                </span>
              </div>
              {/* Info button with pointer-events isolation to prevent parent :active */}
              <div 
                className="relative"
                onPointerDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setShowCreditBreakdown(!showCreditBreakdown);
                  }}
                  className="w-5 h-5 rounded-full flex items-center justify-center text-muted-foreground/50 hover:text-muted-foreground/70 transition-colors active:scale-100"
                  style={{ touchAction: 'manipulation' }}
                  aria-label="Credit info"
                >
                  <Info className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-24">
        {/* Permission denied state */}
        {permissionDenied && !capturedImage ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[55vh] px-2">
            <div className="relative w-full">
              <ContentCard className="mb-6">
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  <div className="text-5xl mb-4">📷</div>
                  <h2 className="text-lg font-bold text-foreground mb-2">Camera Access Needed</h2>
                  <p className="text-muted-foreground text-sm leading-relaxed max-w-[220px] mb-4">
                    Camera access is needed to take photos. Please enable it in Settings.
                  </p>
                  <Button 
                    onClick={startCamera}
                    size="sm"
                    variant="outline"
                    className="mt-2"
                  >
                    Try Again
                  </Button>
                </div>
                <ContentCardCorners />
              </ContentCard>
            </div>
            <div className="w-full px-2">
              <Button 
                onClick={handleUploadFromGallery} 
                variant="outline" 
                size="lg" 
                className="w-full"
              >
                <ImagePlus className="w-4 h-4" />
                {t("selectFromGallery")}
              </Button>
            </div>
          </div>
        ) : !capturedImage && !cameraActive ? (
          // Initial state - show locked or unlocked view based on subscription status
          isHomeLocked ? (
            <AnalyzeLockedModule
              onUnlock={() => onNavigateToProfile(true)}
              isReturningUser={isReturningUser}
            />
          ) : (
            <HomeMainView
              onStartCamera={startCamera}
              onUploadFromGallery={handleUploadFromGallery}
              hasCredits={analysisCount > 0}
              onBuyExtraCredits={() => onNavigateToProfile(true)}
            />
          )
        ) : cameraActive && !capturedImage ? (
          // Camera viewfinder
          <div className="flex flex-col items-center justify-center h-full min-h-[65vh] px-2">
            <ContentCard className="mb-6 bg-foreground/10">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

              {/* Camera overlay corners */}
              <ContentCardCorners className="border-background/60" />

              {/* Flip camera button */}
              <button 
                onClick={toggleCamera} 
                className="absolute top-4 right-4 w-10 h-10 bg-background/70 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-plush z-10"
              >
                <FlipHorizontal className="w-4 h-4 text-foreground" />
              </button>

              {/* Cancel button */}
              <button 
                onClick={() => { stopCamera(); resetCamera(); }} 
                className="absolute top-4 left-4 w-10 h-10 bg-background/70 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-plush z-10"
              >
                <X className="w-4 h-4 text-foreground" />
              </button>
            </ContentCard>

            {/* Capture button */}
            <button 
              onClick={capturePhoto} 
              className="w-18 h-18 rounded-full bg-card border-4 border-primary flex items-center justify-center shadow-warm-glow active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 rounded-full bg-primary" />
            </button>
          </div>
        ) : (
          // Full-screen Analysis Card using reusable component
          <>
            {/* Validation Error overlay */}
            {validationError && !isAnalyzing && (
              <div className="fixed inset-x-2 top-2 bottom-24 z-50 rounded-3xl bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center border-2 border-destructive/40 p-6">
                <div className="text-center max-w-xs">
                  <div className="text-5xl mb-4">📷</div>
                  <h2 className="text-lg font-bold text-foreground mb-3">Let's try again!</h2>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                    {validationError}
                  </p>
                  <div className="space-y-3 w-full">
                    <Button 
                      onClick={() => {
                        resetCamera();
                        startCamera();
                      }} 
                      size="lg" 
                      className="w-full shadow-warm-glow"
                    >
                      <Camera className="w-4 h-4" />
                      Take Another Photo
                    </Button>
                    <Button 
                      onClick={() => {
                        resetCamera();
                        handleUploadFromGallery();
                      }} 
                      variant="outline" 
                      size="lg" 
                      className="w-full"
                    >
                      <ImagePlus className="w-4 h-4" />
                      Choose from Gallery
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Analysis Error overlay with retry */}
            {analysisError && !isAnalyzing && !validationError && (
              <div className="fixed inset-x-2 top-2 bottom-24 z-50 rounded-3xl bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center border-2 border-amber-400/40 p-6">
                <div className="text-center max-w-xs">
                  <div className="text-5xl mb-4">⚠️</div>
                  <h2 className="text-lg font-bold text-foreground mb-3">Something went wrong</h2>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                    {analysisError}
                  </p>
                  <div className="space-y-3 w-full">
                    <Button 
                      onClick={handleRetryAnalysis} 
                      size="lg" 
                      className="w-full shadow-warm-glow"
                    >
                      Try Again
                    </Button>
                    <Button 
                      onClick={() => {
                        resetCamera();
                        startCamera();
                      }} 
                      variant="outline" 
                      size="lg" 
                      className="w-full"
                    >
                      <Camera className="w-4 h-4" />
                      Take New Photo
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Analyzing overlay */}
            {isAnalyzing && (
              <div className="fixed inset-x-2 top-2 bottom-24 z-50 rounded-3xl bg-white/90 backdrop-blur-sm flex items-center justify-center border-2 border-primary/40">
                <div className="text-center">
                  <div className="text-4xl mb-3 animate-bounce-gentle">🐾</div>
                  <p className="text-foreground font-bold text-sm">{t("analyzing")}</p>
                  <p className="text-muted-foreground text-xs">{t("analyzingSubtext")}</p>
                </div>
              </div>
            )}
            
            {result && !showUpgradePrompt && capturedImage && !validationError && !analysisError && (
              <AnalysisCard
                data={{
                  imageUrl: capturedImage,
                  mood: result.mood,
                  moodEmoji: result.mood_emoji,
                  moodDescription: result.mood_description,
                  confidence: result.confidence,
                  careTip: result.care_tip,
                }}
                onClose={handleCloseAnalysisCard}
                isClosing={isSaving}
                title="Analysis Card"
                date={new Date().toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
                showReplaceButton={false}
                onDelete={() => {
                  // Delete without saving - just reset camera
                  resetCamera();
                  toast.success("Analysis deleted");
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Extra Credits Popup - shown when paying user's credits deplete */}
      <ExtraCreditsModal
        isOpen={showExtraCreditsModal}
        onClose={handleExtraCreditsClose}
        onNavigateToPlans={() => onNavigateToProfile(true)}
        isFreeUser={isFreeUser}
      />
    </div>
  );
}
