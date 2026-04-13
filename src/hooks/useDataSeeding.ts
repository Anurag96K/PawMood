import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

// Hardcoded seed data with diverse moods for the week of February 9th-15th, 2026
const SEED_ENTRIES = [
  {
    day: 9,
    mood: "Happy",
    mood_emoji: "😊",
    mood_description: "Very playful and energetic today. Loves the new toy!",
    confidence: 95,
    care_tip: "Great time for a long walk or play session."
  },
  {
    day: 10,
    mood: "Sleepy",
    mood_emoji: "😴",
    mood_description: "Took several long naps in the sun. Very relaxed.",
    confidence: 88,
    care_tip: "Ensure a quiet environment for resting."
  },
  {
    day: 11,
    mood: "Curious",
    mood_emoji: "🤔",
    mood_description: "Investigating every corner of the room. Very alert.",
    confidence: 82,
    care_tip: "Provide some new sensory toys or treats to explore."
  },
  {
    day: 12,
    mood: "Excited",
    mood_emoji: "🐾",
    mood_description: "Jumping around and wagging tail. Very happy to see you!",
    confidence: 91,
    care_tip: "Reward with some extra affection and treats."
  },
  {
    day: 13,
    mood: "Grumpy",
    mood_emoji: "😠",
    mood_description: "Didn't want to be disturbed during nap time. A bit moody.",
    confidence: 75,
    care_tip: "Give some space and try interacting again later."
  },
  {
    day: 14,
    mood: "Playful",
    mood_emoji: "🎾",
    mood_description: "Constantly bringing the ball for another round of fetch.",
    confidence: 94,
    care_tip: "Spend some quality time playing their favorite game."
  },
  {
    day: 15,
    mood: "Alert",
    mood_emoji: "👂",
    mood_description: "Reacting to every sound from outside. Very protective.",
    confidence: 85,
    care_tip: "Stay calm and reassuring to help them relax."
  }
];

// Base64 image data prepared earlier (mocked or from seeds.json if available in project)
// For this seeding tool, we'll use a placeholder or the actual base64 if we embed it.
// To keep it simple and functional for the user, I'll assume they want the data in Supabase.

export function useDataSeeding() {
  const { user } = useAuth();

  const seedFebruaryData = useCallback(async () => {
    if (!user) {
      toast.error("Please log in to seed data.");
      return;
    }

    try {
      toast.loading("Seeding February data...");

      // Seed for Feb 2026
      const entriesToInsert = SEED_ENTRIES.map(seed => {
        const date = new Date(2026, 1, seed.day, 12, 0, 0); // Feb is month index 1
        return {
          user_id: user.id,
          mood: seed.mood,
          mood_emoji: seed.mood_emoji,
          mood_description: seed.mood_description,
          confidence: seed.confidence,
          care_tip: seed.care_tip,
          analyzed_at: date.toISOString(),
          // Use a placeholder image or a generated one
          image_url: "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&q=80&w=1000",
          created_at: date.toISOString(),
          updated_at: date.toISOString()
        };
      });

      const { error } = await supabase
        .from("mood_entries")
        .insert(entriesToInsert);

      if (error) throw error;

      toast.dismiss();
      toast.success("Successfully seeded February data!");
      localStorage.setItem("has_seeded_feb_data", "true");
      
      // Refresh entries in the app
      window.location.reload();
    } catch (err: any) {
      toast.dismiss();
      toast.error("Seeding failed: " + err.message);
      console.error("Seed error:", err);
    }
  }, [user]);

  return { seedFebruaryData };
}
