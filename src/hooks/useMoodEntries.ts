import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface MoodEntry {
  id: string;
  user_id: string;
  image_url: string;
  mood: string;
  mood_emoji: string;
  mood_description: string | null;
  confidence: number;
  care_tip: string | null;
  memo: string | null;
  analyzed_at: string;
  created_at: string;
  updated_at: string;
}

export interface AnalysisResult {
  mood: string;
  mood_emoji: string;
  mood_description: string;
  confidence: number;
  care_tip: string;
}

export interface ValidationResult {
  valid: boolean;
  error_code?: "no_animal" | "no_face" | "too_small" | "low_quality";
  error_message?: string;
}

export function useMoodEntries() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load entries from localStorage on mount (for instant display)
  useEffect(() => {
    try {
      const cached = localStorage.getItem("mood_entries_cache");
      if (cached) {
        setEntries(JSON.parse(cached));
        setLoading(false); // Show cached content immediately
      }
    } catch (e) {
      console.error("Error loading cached entries:", e);
    }
  }, []);

  // Fetch all mood entries for the user
  const fetchEntries = useCallback(async () => {
    if (!user) {
      if (!localStorage.getItem("mood_entries_cache")) {
        setEntries([]);
      }
      setLoading(false);
      return;
    }

    try {
      // Don't set loading=true if we already have data (background refresh)
      if (entries.length === 0) {
        setLoading(true);
      }

      const { data, error: fetchError } = await supabase
        .from("mood_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("analyzed_at", { ascending: false });

      if (fetchError) {
        console.error("Supabase error fetching mood entries:", fetchError);
        setError(`Failed to load entries: ${fetchError.message}`);
        return;
      }

      setEntries(data || []);

      // Update cache
      try {
        localStorage.setItem("mood_entries_cache", JSON.stringify(data || []));
      } catch (e) {
        console.error("Error saving to cache:", e);
      }

      setError(null);
    } catch (err) {
      console.error("Critical error in fetchEntries:", err);
      setError(err instanceof Error ? err.message : "An unexpected loading error occurred");
    } finally {
      setLoading(false);
    }
  }, [user]); // Removed 'entries.length' dependency to avoid infinite loops

  // Upload image to storage and return URL
  const uploadImage = useCallback(async (imageData: string): Promise<string> => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Convert base64 to blob
    const base64Data = imageData.includes(",") ? imageData.split(",")[1] : imageData;
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "image/jpeg" });

    // Generate unique filename
    const fileName = `${user.id}/pet-mood-${Date.now()}.jpg`;

    // Upload to user-uploads bucket
    const { error: uploadError } = await supabase.storage
      .from("user-uploads")
      .upload(fileName, blob, {
        contentType: "image/jpeg",
        upsert: false
      });

    if (uploadError) {
      console.error("Error uploading image:", uploadError);
      throw uploadError;
    }

    // Get signed URL (private bucket)
    const { data, error: urlError } = await supabase.storage
      .from("user-uploads")
      .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year expiry

    if (urlError) {
      console.error("Error creating signed URL:", urlError);
      throw urlError;
    }

    return data.signedUrl;
  }, [user]);

  // Helper to resize image
  const resizeImage = (base64Str: string, maxWidth = 256): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.7)); // Moderate compression
      };
    });
  };

  // Validate pet image before analysis
  const validateImage = useCallback(async (imageBase64: string): Promise<ValidationResult> => {
    try {
      const resizedImage = await resizeImage(imageBase64);

      // Get session for explicit token passing (hardens auth)
      const { data: { session } } = await supabase.auth.getSession();

      console.log("[useMoodEntries] Validating image. Tunneling auth...");

      if (!session?.access_token) {
        console.error("[useMoodEntries] No active session");
        return { valid: false, error_message: "Please log in to validate images." };
      }

      // AUTH TUNNELING: Raw Fetch with explicit ApiKey + Anon Auth to pass Gateway
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      // Timeout controller
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(`${supabaseUrl}/functions/v1/validate-pet-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": anonKey, // REQUIRED for Gateway routing
          "Authorization": `Bearer ${anonKey}`, // Pass Gateway as Anon
        },
        body: JSON.stringify({
          imageBase64: resizedImage,
          auth_token: session.access_token // Tunnel User Token
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[useMoodEntries] Fetch error (validate):", response.status, errorText);
        return { valid: false, error_message: `Connection failed: ${response.status} ${errorText}` };
      }

      const data = await response.json();

      if (data.error) {
        console.error("[useMoodEntries] Validation service error:", data.error);

        // Handle explicit Not A Pet error
        if (data.error.includes("not_a_pet") || data.error_message?.includes("invalid image")) {
          return { valid: false, error_message: "invalid image kindly upload your pets photo" };
        }

        // Handle Auth/System errors
        return {
          valid: false,
          error_message: `Server Error: ${data.error}`
        };
      }

      return data as ValidationResult;
    } catch (err) {
      console.error("Validation error:", err);
      return { valid: false, error_message: "invalid image kindly upload your pets photo" };
    }
  }, []);

  // Analyze pet mood with AI
  const analyzeMood = useCallback(async (imageBase64: string): Promise<AnalysisResult> => {
    const resizedImage = await resizeImage(imageBase64);

    // Get session for explicit token passing (hardens auth)
    const { data: { session } } = await supabase.auth.getSession();

    console.log("[useMoodEntries] Analyzing mood. Tunneling auth...");

    if (!session?.access_token) {
      throw new Error("Please log in to analyze mood.");
    }

    // AUTH TUNNELING: Raw Fetch with explicit ApiKey + Anon Auth to pass Gateway
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    // Timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/analyze-pet-mood`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": anonKey, // REQUIRED for Gateway routing
          "Authorization": `Bearer ${anonKey}`, // Pass Gateway as Anon
        },
        body: JSON.stringify({
          imageBase64: resizedImage,
          auth_token: session.access_token // Tunnel User Token
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[useMoodEntries] Fetch error (analyze):", response.status, errorText);
        throw new Error(`Server Error: ${response.status} ${errorText}`);
      }

      const data = await response.json();

      if (data.error) {
        console.error("[useMoodEntries] Analysis service error:", data.error);
        if (data.error === "not_a_pet") {
          // Pass this specific string so CameraScreen can handle credit protection
          return { error: "not_a_pet" } as any;
        }
        throw new Error(data.error);
      }

      return data as AnalysisResult;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error("Analysis timed out. The AI server appears to be busy or unreachable. Please try again later.");
      }
      throw err;
    }
  }, []);

  // Create a new mood entry
  const createEntry = useCallback(async (
    imageUrl: string,
    analysis: AnalysisResult,
    memo?: string
  ): Promise<MoodEntry> => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { data, error: insertError } = await supabase
      .from("mood_entries")
      .insert({
        user_id: user.id,
        image_url: imageUrl,
        mood: analysis.mood,
        mood_emoji: analysis.mood_emoji,
        mood_description: analysis.mood_description,
        confidence: analysis.confidence,
        care_tip: analysis.care_tip,
        memo: memo || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating mood entry:", insertError);
      throw insertError;
    }

    // Update local state
    setEntries((prev) => {
      const newEntries = [data, ...prev];
      // Update cache
      try {
        localStorage.setItem("mood_entries_cache", JSON.stringify(newEntries));
      } catch (e) {
        console.error("Error saving to cache:", e);
      }
      return newEntries;
    });
    return data;
  }, [user]);

  // Update memo for an entry
  const updateMemo = useCallback(async (entryId: string, memo: string): Promise<void> => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { error: updateError } = await supabase
      .from("mood_entries")
      .update({ memo })
      .eq("id", entryId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error updating memo:", updateError);
      throw updateError;
    }

    // Update local state
    setEntries((prev) => {
      const newEntries = prev.map((e) => (e.id === entryId ? { ...e, memo } : e));
      // Update cache
      localStorage.setItem("mood_entries_cache", JSON.stringify(newEntries));
      return newEntries;
    });
  }, [user]);

  // Delete an entry
  const deleteEntry = useCallback(async (entryId: string): Promise<void> => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Optimistic update - update local state immediately
    const previousEntries = [...entries];
    setEntries((prev) => {
      const newEntries = prev.filter((e) => e.id !== entryId);
      localStorage.setItem("mood_entries_cache", JSON.stringify(newEntries));
      return newEntries;
    });

    try {
      const { error: deleteError } = await supabase
        .from("mood_entries")
        .delete()
        .eq("id", entryId)
        .eq("user_id", user.id);

      if (deleteError) {
        // Rollback on error
        setEntries(previousEntries);
        localStorage.setItem("mood_entries_cache", JSON.stringify(previousEntries));
        console.error("Error deleting entry:", deleteError);
        throw deleteError;
      }
    } catch (err) {
      // Rollback on error
      setEntries(previousEntries);
      localStorage.setItem("mood_entries_cache", JSON.stringify(previousEntries));
      throw err;
    }
  }, [user, entries]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  return {
    entries,
    loading,
    error,
    uploadImage,
    validateImage,
    analyzeMood,
    createEntry,
    updateMemo,
    deleteEntry,
    fetchEntries,
  };
}
