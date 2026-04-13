import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

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

// Helper to get current user from session
async function getCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user ?? null;
}

export function useMoodEntries() {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUserId(session?.user?.id ?? null);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch all mood entries for the user
  const fetchEntries = useCallback(async () => {
    const user = await getCurrentUser();
    if (!user) {
      setEntries([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("mood_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("analyzed_at", { ascending: false });

      if (fetchError) {
        console.error("[fetchEntries] Error:", fetchError);
        setError(fetchError.message);
        return;
      }

      console.log("[fetchEntries] Loaded entries:", {
        count: data?.length || 0,
        dateKeys: data?.map(e => {
          const d = new Date(e.analyzed_at);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }),
      });

      setEntries(data || []);
    } catch (err) {
      console.error("[fetchEntries] Error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Refetch when userId changes
  useEffect(() => {
    fetchEntries();
  }, [userId, fetchEntries]);

  // Upload image to storage and return URL
  const uploadImage = useCallback(async (imageData: string): Promise<string> => {
    console.log("[uploadImage] Starting upload...");
    const user = await getCurrentUser();
    if (!user) {
      console.error("[uploadImage] User not authenticated");
      throw new Error("User not authenticated");
    }

    try {
      // Convert base64 to blob
      const base64Data = imageData.includes(",") ? imageData.split(",")[1] : imageData;
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "image/jpeg" });

      console.log("[uploadImage] Image size:", Math.round(blob.size / 1024), "KB");

      // Validate image size (max 5MB)
      if (blob.size > 5 * 1024 * 1024) {
        throw new Error("Image is too large. Please use a smaller image (max 5MB).");
      }

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
        console.error("[uploadImage] Upload error:", uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get signed URL (private bucket)
      const { data, error: urlError } = await supabase.storage
        .from("user-uploads")
        .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year expiry

      if (urlError) {
        console.error("[uploadImage] Signed URL error:", urlError);
        throw new Error(`Failed to generate image URL: ${urlError.message}`);
      }

      console.log("[uploadImage] Success, URL generated");
      return data.signedUrl;
    } catch (err) {
      console.error("[uploadImage] Error:", err);
      throw err;
    }
  }, []);

  // Validate pet image before analysis
  const validateImage = useCallback(async (imageBase64: string): Promise<ValidationResult> => {
    console.log("[validateImage] Starting validation...");
    const user = await getCurrentUser();
    if (!user) {
      console.error("[validateImage] User not authenticated");
      return { valid: true }; // Fail open if not logged in
    }

    try {
      console.log("[validateImage] Calling edge function...");
      const { data, error: invokeError } = await supabase.functions.invoke("validate-pet-image", {
        body: { imageBase64 },
      });

      if (invokeError) {
        console.error("[validateImage] Edge function error:", invokeError);
        return { valid: true }; // Fail open on error
      }

      if (data?.error) {
        console.error("[validateImage] Service error:", data.error);
        return { valid: true }; // Fail open on error
      }

      console.log("[validateImage] Result:", data);
      return data as ValidationResult;
    } catch (err) {
      console.error("[validateImage] Failed:", err);
      return { valid: true }; // Fail open on error
    }
  }, []);

  // Analyze pet mood with AI - with timeout
  const analyzeMood = useCallback(async (imageBase64: string): Promise<AnalysisResult> => {
    console.log("[analyzeMood] Starting analysis...");
    const user = await getCurrentUser();
    if (!user) {
      console.error("[analyzeMood] User not authenticated");
      throw new Error("Please sign in to analyze your pet's mood");
    }

    // Create timeout promise (45 seconds for AI processing)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        console.error("[analyzeMood] Request timed out after 45 seconds");
        reject(new Error("Analysis timed out. Please try again."));
      }, 45000);
    });

    try {
      console.log("[analyzeMood] Calling edge function...");
      
      // Race between the actual request and timeout
      const result = await Promise.race([
        supabase.functions.invoke("analyze-pet-mood", {
          body: { imageBase64 },
        }),
        timeoutPromise,
      ]);

      const { data, error: invokeError } = result as { data: any; error: any };
      
      console.log("[analyzeMood] Response received:", { 
        hasData: !!data, 
        hasError: !!invokeError,
        dataKeys: data ? Object.keys(data) : [],
      });

      if (invokeError) {
        console.error("[analyzeMood] Edge function error:", invokeError);
        
        // Handle specific error types
        if (invokeError.message?.includes("fetch failed") || invokeError.message?.includes("network")) {
          throw new Error("Network error. Please check your connection and try again.");
        }
        throw new Error(invokeError.message || "Failed to analyze mood");
      }

      if (data?.error) {
        console.error("[analyzeMood] Service error:", data.error);
        throw new Error(data.error);
      }

      // Validate response structure
      if (!data?.mood || !data?.mood_emoji) {
        console.error("[analyzeMood] Invalid response structure:", data);
        throw new Error("Invalid response from analysis service");
      }

      console.log("[analyzeMood] Success:", { mood: data.mood, confidence: data.confidence });
      return data as AnalysisResult;
    } catch (err) {
      console.error("[analyzeMood] Failed:", err);
      throw err;
    }
  }, []);

  // Create a new mood entry
  const createEntry = useCallback(async (
    imageUrl: string,
    analysis: AnalysisResult,
    memo?: string
  ): Promise<MoodEntry> => {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Use local date for analyzed_at to avoid timezone issues
    const now = new Date();
    const localDateString = now.toISOString();

    console.log("[createEntry] Saving entry:", {
      localDate: now.toLocaleDateString(),
      localTime: now.toLocaleTimeString(),
      isoString: localDateString,
      mood: analysis.mood,
    });

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
        analyzed_at: localDateString,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[createEntry] Error:", insertError);
      throw insertError;
    }

    console.log("[createEntry] Success:", {
      entryId: data.id,
      analyzedAt: data.analyzed_at,
      localDateKey: new Date(data.analyzed_at).toLocaleDateString(),
    });

    // Update local state immediately
    setEntries((prev) => [data, ...prev]);
    return data;
  }, []);

  // Update memo for an entry
  const updateMemo = useCallback(async (entryId: string, memo: string): Promise<void> => {
    const user = await getCurrentUser();
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
    setEntries((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, memo } : e))
    );
  }, []);

  // Delete an entry
  const deleteEntry = useCallback(async (entryId: string): Promise<void> => {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { error: deleteError } = await supabase
      .from("mood_entries")
      .delete()
      .eq("id", entryId)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error deleting entry:", deleteError);
      throw deleteError;
    }

    // Update local state
    setEntries((prev) => prev.filter((e) => e.id !== entryId));
  }, []);

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
