
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Camera, X, Zap, FlipHorizontal, ImagePlus, Check, Info, RefreshCw, PawPrint, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMoodEntries, AnalysisResult, ValidationResult } from "@/hooks/useMoodEntries";
import { useBadge } from "@/contexts/BadgeContext";
import { useOptimisticImage } from "@/contexts/OptimisticImageContext";
import { toast } from "sonner";
import { AnalysisCard } from "@/components/calendar/AnalysisCard";
import { cn } from "@/lib/utils";
import {
  useCalendarDecoration,
  calendarCardBackgroundConfigs,
  themeConfigs
} from "@/contexts/CalendarDecorationContext";
import { UnifiedLockOverlay } from "@/components/UnifiedLockScreen";
import { ContentCard, ContentCardCorners } from "@/components/ui/content-card";
import { AnalyzeLockedModule } from "./AnalyzeLockedModule";
import { NoCreditsModal } from "@/components/NoCreditsModal";
import { HomeMainView } from "./HomeMainView";
import { checkAndSelectHeroPhoto } from "@/hooks/useWeeklyHeroPhoto";
import { useExtraCredits } from "@/contexts/ExtraCreditsContext";
import { AnimatePresence, motion } from "framer-motion";
import { ExtraCreditsModal } from "../ExtraCreditsModal";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

interface CameraScreenProps {
  onNavigateToCalendar: () => void;
  onNavigateToProfile: (openPlanSection?: boolean, openExtraCredits?: boolean) => void;
  analysisCount: number;
  setAnalysisCount: (count: number) => void;
  isFreeUser: boolean;
  onOpenPaywall?: () => void;
  onOpenExtraCredits?: () => void;
  onOpenExtraCreditsPopup?: () => void;
  isFirstPaidMonth?: boolean;
  currentPlan?: "free" | "pro-monthly" | "pro-yearly";
  /** Whether user has an active monthly/yearly subscription */
  hasActiveSubscription?: boolean;
  /** Whether user has ever subscribed (for lock screen copy differentiation) */
  isReturningUser?: boolean;
  onNavigateToExtraCredits?: () => void;
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
  isReturningUser = false,
  onNavigateToExtraCredits
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
    return !hasActiveSubscription;
  }, [hasActiveSubscription]);

  const persistedState = useMemo(() => {
    const loaded = loadCameraState();
    return loaded || {
      capturedImage: null,
      result: null,
      isAnalyzing: false,
      saveStatus: "idle",
      savedEntryId: null,
    };
  }, []);

  const [cameraActive, setCameraActive] = useState(hasActiveSubscription);
  const [capturedImage, setCapturedImage] = useState<string | null>(persistedState.capturedImage);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(persistedState.isAnalyzing);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">(persistedState.saveStatus as any);
  const [result, setResult] = useState<AnalysisResult | null>(persistedState.result);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [savedEntryId, setSavedEntryId] = useState<string | null>(persistedState.savedEntryId);
  const [showCreditBreakdown, setShowCreditBreakdown] = useState(false);
  const [showNoCreditsModal, setShowNoCreditsModal] = useState(false);
  const [showExtraCreditsModal, setShowExtraCreditsModal] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasAutoStarted = useRef(false);
  const pendingSavesRef = useRef<PendingSave[]>([]);
  const isSavingRef = useRef(false);

  console.log("[CameraScreen] states:", { cameraActive, capturedImage, isAnalyzing, hasActiveSubscription, analysisCount });

  // Optimistic entry ref for rollback
  const optimisticEntryRef = useRef<{ id: string; date: Date } | null>(null);

  // --- Function Definitions ---

  const stopCamera = useCallback(() => {
    setIsVideoPlaying(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    // Ensure any stale stream is stopped first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setIsVideoPlaying(false);
    setPermissionDenied(false);

    // Switch to camera view IMMEDIATELY so video element renders
    setCameraActive(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.log("Camera API not available");
        return;
      }

      // Small delay to allow hardware to release the previous stream (Crucial for some devices)
      await new Promise(resolve => setTimeout(resolve, 150));

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      console.log("Camera stream obtained:", stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Explicitly call play() to ensure onPlaying fires reliably across browsers
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error("Auto-play failed:", error);
          });
        }

        videoRef.current.onloadedmetadata = () => setIsVideoPlaying(true);
        streamRef.current = stream;
        setPermissionDenied(false);
        console.log("Camera activated successfully");
      }
    } catch (error: any) {
      console.log("Camera access denied or not available", error);
      if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
        setPermissionDenied(true);
        setCameraActive(false);
      } else {
        setCameraActive(true);
      }
    }
  }, [facingMode]);

  const flipCamera = useCallback(() => {
    setFacingMode(prev => prev === "environment" ? "user" : "environment");
    setIsVideoPlaying(false);
  }, []);

  const resetCamera = useCallback(() => {
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
  }, []);

  const startMockAnalysis = useCallback(() => {
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
  }, [analysisCount, setAnalysisCount]);

  const startAnalysis = useCallback(async (imageData: string) => {
    console.log("[CameraScreen] Starting analysis, credits:", analysisCount);

    if (isAnalyzing) {
      console.warn("[CameraScreen] Analysis already in progress");
      return;
    }

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
      console.log("[CameraScreen] Running single analysis call (Validation + Analysis)...");
      const startTime = Date.now();

      // OPTIMIZATION: Run ONLY analyzeMood. 
      // It now handles "is it a pet?" validation internally to save resources (prevent 546 error).
      const analysisResult = await analyzeMood(imageData);

      const endTime = Date.now();
      console.log(`[CameraScreen] Analysis complete in ${(endTime - startTime) / 1000}s:`, analysisResult);

      // Check for "not_a_pet" error from analysis
      if ((analysisResult as any)?.error === "not_a_pet") {
        console.warn("[CameraScreen] Analyzed as not a pet");
        setIsAnalyzing(false);
        setValidationError("invalid image kindly upload your pets photo");
        return;
      }

      // Success - use the analysis result
      setResult(analysisResult);
      // Only deduct credit on SUCCESSFUL analysis of a valid pet
      setAnalysisCount(analysisCount - 1);

    } catch (error) {
      console.error("[CameraScreen] Analysis error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to analyze mood";

      // Handle known 546 error gracefully
      if (errorMessage.includes("546") || errorMessage.includes("WORKER_LIMIT")) {
        setAnalysisError("Server is busy (High Load). Please try again in a moment.");
      } else {
        setAnalysisError(errorMessage);
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, [analysisCount, isAnalyzing, analyzeMood, setAnalysisCount]);

  const handleRetryAnalysis = useCallback(() => {
    // User requested "Try Again" -> Go back to camera to verify a new image
    // This prevents retrying a failed image and hammering the server
    console.log("[CameraScreen] Retrying -> Resetting to camera view");
    resetCamera();
  }, [resetCamera]);

  const capturePhoto = useCallback(() => {
    console.log("[CameraScreen] Capturing photo...");

    if (videoRef.current && canvasRef.current && streamRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Calculate scaled dimensions (512px is ideal for LLaVA/ViT models)
      const MAX_DIMENSION = 512;
      let width = video.videoWidth || 640;
      let height = video.videoHeight || 480;

      if (width > height) {
        if (width > MAX_DIMENSION) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        }
      } else {
        if (height > MAX_DIMENSION) {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      canvas.width = width;
      canvas.height = height;

      console.log("[CameraScreen] Canvas dimensions (scaled):", canvas.width, "x", canvas.height);

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, width, height);
        const imageData = canvas.toDataURL("image/jpeg", 0.7);
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
  }, [stopCamera, startAnalysis, startMockAnalysis]);

  const handleUploadFromGallery = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("[CameraScreen] File selected:", {
        name: file.name,
        size: Math.round(file.size / 1024) + "KB",
        type: file.type
      });

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
        const rawImageData = reader.result as string;

        // Resize logic using an off-screen image and canvas
        const img = new Image();
        img.onload = () => {
          const MAX_DIMENSION = 512;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_DIMENSION) {
              height = Math.round((height * MAX_DIMENSION) / width);
              width = MAX_DIMENSION;
            }
          } else {
            if (height > MAX_DIMENSION) {
              width = Math.round((width * MAX_DIMENSION) / height);
              height = MAX_DIMENSION;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");

          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const resizedData = canvas.toDataURL("image/jpeg", 0.7);
            console.log("[CameraScreen] Resized upload:", Math.round(rawImageData.length / 1024) + "KB -> " + Math.round(resizedData.length / 1024) + "KB");
            setCapturedImage(resizedData);
            stopCamera();
            startAnalysis(resizedData);
          } else {
            // Fallback if canvas fails
            setCapturedImage(rawImageData);
            stopCamera();
            startAnalysis(rawImageData);
          }
        };
        img.onerror = () => {
          console.error("[CameraScreen] Failed to load image for resizing");
          setAnalysisError("Failed to process image. Please try another one.");
        };
        img.src = rawImageData;
      };
      reader.readAsDataURL(file);
    }
    // Reset the input
    e.target.value = "";
  }, [stopCamera, startAnalysis]);

  const handleCloseAnalysisCard = useCallback(() => {
    resetCamera();
  }, [resetCamera]);

  const getTotalCredits = useCallback(() => {
    const remainingFree = Math.max(0, analysisCount);
    const isYearly = currentPlan === "pro-yearly";
    const planCredits = isFreeUser ? 0 : (isYearly ? 70 : 50);
    const freeCredits = isFreeUser ? remainingFree : (isFirstPaidMonth ? 3 : 0);
    const total = freeCredits + planCredits + extraCredits;
    return total;
  }, [analysisCount, currentPlan, isFreeUser, isFirstPaidMonth, extraCredits]);

  const getCreditsBreakdown = useCallback(() => {
    const total = getTotalCredits();
    if (total === 0) {
      return t("zeroCreditsRemaining");
    }

    const remainingFree = Math.max(0, analysisCount);
    const isYearly = currentPlan === "pro-yearly";
    const planCredits = isYearly ? 70 : 50;

    const parts: string[] = [];

    if (isFreeUser) {
      if (remainingFree > 0) parts.push(`Free ${remainingFree}`);
    } else if (isFirstPaidMonth) {
      parts.push("Free 3");
    }

    if (!isFreeUser) {
      parts.push(`${isYearly ? "Yearly" : "Monthly"} ${planCredits}`);
    }

    if (extraCredits > 0) {
      parts.push(`Extra ${extraCredits}`);
    }

    return parts.join(" · ");
  }, [getTotalCredits, analysisCount, currentPlan, isFreeUser, isFirstPaidMonth, extraCredits, t]);

  // --- useEffect Hooks ---

  // Auto-start camera on mount if user is a subscriber
  useEffect(() => {
    if (hasActiveSubscription && !cameraActive && !capturedImage && !isAnalyzing) {
      console.log("[CameraScreen] Auto-starting camera for subscriber");
      startCamera();
    }
  }, [hasActiveSubscription, cameraActive, capturedImage, isAnalyzing, startCamera]);

  // Sync camera with facingMode changes
  useEffect(() => {
    if (cameraActive && !capturedImage) {
      stopCamera();
      startCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

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

  const { settings } = useCalendarDecoration();

  /**
   * Recovery guard: if we restored a captured image from sessionStorage but have no result
   * (common after refresh/background), the render can fall into a state where nothing is shown.
   *
   * Fix: automatically resume analysis when credits exist; otherwise reset back to Home/Lock UI.
   */
  useEffect(() => {
    if (capturedImage && !isAnalyzing && !result && !validationError && !analysisError) {
      console.log("[CameraScreen] Auto-starting analysis for captured image...");
      startAnalysis(capturedImage);
    }
  }, [capturedImage, result, isAnalyzing, validationError, analysisError, startAnalysis]);

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

  // No-op for now


  return (
    <div className="flex flex-col h-full relative z-10 overscroll-none">
      <canvas ref={canvasRef} className="hidden" />
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

      {/* Header */}
      <header className="px-5 pt-10 pb-4 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Pawmood</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{t("appSubtitle")}</p>
          </div>
          {/* Credit pill with absolute-positioned info breakdown */}
          <div className="relative flex flex-col items-end w-[96px]">
            {/* Breakdown pill - absolute positioned below to avoid layout shift */}
            <AnimatePresence>
              {showCreditBreakdown && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 px-3 py-1.5 rounded-[16px] text-[11px] font-bold tracking-tight whitespace-nowrap z-50 overflow-hidden"
                  style={{
                    top: 'calc(100% + 6px)',
                    background: 'linear-gradient(135deg, rgba(255, 140, 80, 0.22) 0%, rgba(255, 120, 60, 0.16) 100%)',
                    border: '1px solid rgba(255, 106, 0, 0.65)',
                    boxShadow: '0 2px 10px rgba(255, 106, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
                    color: '#FF6A00',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="relative z-10">{getCreditsBreakdown()}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div
              onClick={() => onNavigateToProfile(true)}
              className={cn(
                "flex items-center justify-between pl-4 pr-2 py-2 rounded-[20px] hover:shadow-md cursor-pointer h-9 w-full"
              )}
              style={{
                background: 'linear-gradient(135deg, rgba(255, 140, 80, 0.22) 0%, rgba(255, 120, 60, 0.16) 100%)',
                boxShadow: '0 2px 10px rgba(255, 106, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
              }}
            >
              <div className="flex items-center gap-1.5 flex-1 select-none">
                <Zap className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#FF6A00' }} fill="#FF6A00" />
                <span className="text-xs font-bold leading-none" style={{ color: '#FF6A00' }}>
                  {getTotalCredits()}
                </span>
              </div>

              {/* Info button wrapper - completely static parent relative to this slot */}
              <div
                className="flex items-center justify-center w-5 h-5 ml-1"
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
                  className="w-full h-full rounded-full flex items-center justify-center text-muted-foreground/50 hover:text-muted-foreground/70 transition-colors active:opacity-60"
                  style={{ touchAction: 'manipulation' }}
                  aria-label="Credit info"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area - Balanced between Header and Bottom Nav */}
      <div className="flex-1 flex flex-col justify-between px-5 pb-20 overflow-y-auto">
        <div className={cn(
          "flex-1 flex flex-col items-center",
          (!cameraActive || capturedImage) ? "justify-center" : "justify-start pt-4"
        )}>
          {/* Permission denied state */}
          {permissionDenied && !capturedImage ? (
            <div className="w-full">
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
          ) : !capturedImage && !cameraActive ? (
            // Initial state - show locked or unlocked view based on subscription status
            isHomeLocked ? (
              <AnalyzeLockedModule
                onUnlock={onOpenPaywall || (() => { })}
                isReturningUser={isReturningUser}
              />
            ) : (
              <HomeMainView
                onStartCamera={startCamera}
                onUploadFromGallery={handleUploadFromGallery}
                hasCredits={analysisCount > 0}
              />
            )
          ) : cameraActive && !capturedImage ? (
            // Camera viewfinder
            <div className="w-full">
              <ContentCard
                className="mb-6 bg-white overflow-hidden min-h-[400px] border-none"
                style={{
                  boxShadow: themeConfigs[settings.theme]?.shadow || themeConfigs.beige.shadow
                }}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  onPlaying={() => setIsVideoPlaying(true)}
                  className={cn(
                    "w-full h-full object-cover transition-all duration-300 ease-in-out",
                    isVideoPlaying ? "blur-0 opacity-100" : "blur-3xl opacity-0",
                    facingMode === "user" && "scale-x-[-1]"
                  )}
                />

                {/* Black loading overlay - hides the browser play icon */}
                <AnimatePresence>
                  {!isVideoPlaying && (
                    <motion.div
                      initial={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="absolute inset-0 bg-white z-10 flex flex-col items-center justify-center"
                    >
                      {/* Optional: Add a subtle loading indicator or logo if desired */}
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 rounded-full border-4 border-black/10 border-t-primary/40 animate-spin" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Camera overlay corners */}
                <ContentCardCorners className="z-20" />

                {/* Flip camera button */}
                <button
                  onClick={flipCamera}
                  className="absolute top-4 right-4 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg z-30 active:scale-95 transition-transform border border-white/10"
                >
                  <RefreshCw className="w-5 h-5 text-white" />
                </button>

                {/* Cancel button removed as requested */}
              </ContentCard>

              {/* Camera Controls */}
              <div className="mt-4 px-1 flex flex-col gap-3 w-full">
                <Button
                  onClick={() => {
                    Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
                    capturePhoto();
                  }}
                  size="lg"
                  className="w-full shadow-warm-glow"
                >
                  <Camera className="w-5 h-5" />
                  Take Photo
                </Button>

                <Button
                  onClick={() => {
                    handleUploadFromGallery();
                  }}
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  <ImagePlus className="w-5 h-5" />
                  Select From Gallery
                </Button>
              </div>
            </div>
          ) : (
            // Full-screen Analysis Card using reusable component
            <>
              {/* Validation Error overlay (No pet detected) */}
              {validationError && !isAnalyzing && (
                <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-6 sm:p-10">
                  <div className="w-full max-w-[340px] flex flex-col items-center">
                    {/* Camera Icon - matching reference image */}
                    <div className="mb-8 p-6 bg-slate-100 rounded-xl opacity-80">
                      <Camera className="w-16 h-16 text-slate-500" strokeWidth={1} />
                    </div>

                    <h2 className="text-2xl font-bold text-[#4B3621] mb-4">Let's try again!</h2>

                    <p className="text-[#8E8E8E] text-[15px] leading-relaxed text-center mb-10">
                      No pet detected. Please upload a pet photo
                    </p>

                    <div className="space-y-4 w-full">
                      <Button
                        onClick={(e) => {
                          const target = e.currentTarget;
                          resetCamera();
                          // Stop camera to return to home screen as requested
                          setCameraActive(false);
                          stopCamera();
                          setTimeout(() => target.blur(), 700);
                        }}
                        onPointerUp={(e) => {
                          const target = e.currentTarget;
                          setTimeout(() => target.blur(), 700);
                        }}
                        size="lg"
                        className="w-full shadow-warm-glow focus:ring-0 focus-visible:ring-0 focus:outline-none"
                      >
                        <Camera className="w-5 h-5" />
                        Take Another Photo
                      </Button>

                      <Button
                        onClick={(e) => {
                          const target = e.currentTarget;
                          resetCamera();
                          handleUploadFromGallery();
                          setTimeout(() => target.blur(), 700);
                        }}
                        onPointerDown={(e) => {
                          const target = e.currentTarget;
                          setTimeout(() => target.blur(), 700);
                        }}
                        onPointerUp={(e) => {
                          const target = e.currentTarget;
                          setTimeout(() => target.blur(), 700);
                        }}
                        onPointerLeave={(e) => {
                          const target = e.currentTarget;
                          setTimeout(() => target.blur(), 700);
                        }}
                        variant="secondary"
                        size="lg"
                        className="w-full active:scale-95 transition-all duration-200 focus:ring-0 focus-visible:ring-0 focus:outline-none"
                      >
                        <ImagePlus className="w-5 h-5" />
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
                        className="w-full shadow-warm-glow hover:shadow-warm transition-all duration-300"
                      >
                        Try Again
                      </Button>
                      <Button
                        onClick={() => {
                          resetCamera();
                          startCamera();
                        }}
                        onPointerDown={(e) => e.currentTarget.blur()}
                        onPointerUp={(e) => e.currentTarget.blur()}
                        onPointerLeave={(e) => e.currentTarget.blur()}
                        variant="secondary"
                        size="lg"
                        className="w-full transition-all duration-300 active:scale-95 focus:ring-0 focus-visible:ring-0 focus:outline-none"
                      >
                        <Camera className="w-4 h-4" />
                        Take New Photo
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Show refined analysis loading state matching reference */}
              {isAnalyzing && (
                <div className="fixed inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-6">
                  <div className="flex flex-col items-center">
                    {/* Refined three-paw walking animation with better spacing and arc path */}
                    <div className="relative h-32 w-64">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{
                            opacity: [0, 1, 0],
                            scale: [0.9, 1, 0.9],
                          }}
                          transition={{
                            duration: 2.1,
                            repeat: Infinity,
                            delay: i * 0.7,
                            ease: "easeInOut",
                          }}
                          className="absolute"
                          style={{
                            position: "absolute",
                            left: i === 0 ? "30%" : i === 1 ? "45%" : "60%",
                            bottom: i === 1 ? "60%" : "20%",
                            transform: `rotate(${i === 1 ? 0 : i === 0 ? -15 : 15}deg)`,
                          }}
                        >
                          <PawPrint className="w-10 h-10 text-[#4F3D56]" fill="#4F3D56" />
                        </motion.div>
                      ))}
                    </div>

                    <h2 className="text-xl font-bold text-[#4B3621] mb-2">Analyzing mood...</h2>
                    <p className="text-[#8E8E8E] text-[15px]">This won't take long</p>
                  </div>
                </div>
              )}

              <AnimatePresence>
                {result && capturedImage && !validationError && !analysisError && (
                  <AnalysisCard
                    key="analysis-card"
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
              </AnimatePresence>
            </>
          )}
        </div>


      </div>

      {/* Extra Credits Modal (Logic handled internally) */}
      <ExtraCreditsModal
        isOpen={showExtraCreditsModal}
        onClose={() => setShowExtraCreditsModal(false)}
      />
      <NoCreditsModal
        isOpen={showNoCreditsModal}
        onClose={() => setShowNoCreditsModal(false)}
        onBuyCredits={() => {
          setShowNoCreditsModal(false);
          // Navigate to Profile -> Extra Credits
          onNavigateToProfile(false, true);
        }}
      />
    </div>
  );
}

// Reusable locked feature overlay component
export function LockedFeatureOverlay({
  onNavigateToProfile
}: {
  onNavigateToProfile: () => void
}) {
  const { t } = useLanguage();

  return (
    <div
      className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center cursor-pointer z-10"
      onClick={onNavigateToProfile}
    >
      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-2">
        <Lock className="w-6 h-6 text-primary" />
      </div>
      <p className="text-sm font-semibold text-foreground">{t("lockedFeature")}</p>
      <p className="text-[10px] text-muted-foreground">{t("unlockWithPro")}</p>
    </div>
  );
}
