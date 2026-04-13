import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MoodAnalysisResult {
  mood: string;
  mood_emoji: string;
  mood_description: string;
  confidence: number;
  care_tip: string;
}

// STRICTER SYSTEM PROMPT
const SYSTEM_PROMPT = `You are a strict pet mood analyzer. 
FIRST, validate the image.
- If the image is pitch black, blurry, dark, or contains humans, dolls, toys, drawings, or non-living objects: Return {"error": "not_a_pet"}
- If the image contains a REAL DOG or CAT, then analyze its mood.

## MOOD CATEGORIES: Happy 😊, Relaxed 😌, Excited 🤩, Curious 🧐, Calm 😎, Thoughtful 🤔, Observant 👀, Focused 🎯, Anxious 😰, Lonely 🥺, Bored 😒, Alert ⚠️, Playful 🎾, Sleepy 😴, Moody 😤, Mischievous 😈.

## RESPONSE RULES:
1. MOOD: Choose one accurately.
2. MOOD DESCRIPTION: Write a UNIQUE one-liner (max 20 words).
3. CARE TIP: Provide a UNIQUE actionable tip (max 15 words).
4. CONFIDENCE: Rate 70-98.

Respond with ONLY valid JSON. 
Example Success: {"mood": "Happy", "mood_emoji": "😊", "mood_description": "...", "confidence": 90, "care_tip": "..."}
Example Failure: {"error": "not_a_pet"}`;

const CARE_TIPS = [
  "Give them a gentle scratch behind the ears.", "A little playtime might be exactly what they need.",
  "Fresh water is always a good idea!", "Maybe it's time for a small healthy treat?",
  "A short walk could lift their spirits.", "Talk to them softly; they love your voice.",
  "Check if their favorite toy is nearby.", "Give them some space if they seem tired.",
  "A belly rub is the universal language of love.", "Just sitting with them makes them happy.",
  "Try a new puzzle toy to keep them engaged.", "Grooming can be a great bonding experience.",
  "Set up a cozy window spot for them to watch the world.", "A game of hide and seek with treats is always fun.",
  "Make sure they have a quiet place to retreat and rest.", "Sometimes they just want to be near you.",
  "Check their paws for any small stuck debris after walks.", "A fresh bowl of food is a simple way to show love.",
  "Praise them for good behavior with a happy tone.", "Gentle eye contact can strengthen your bond."
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, auth_token } = await req.json();
    if (!imageBase64) return new Response(JSON.stringify({ error: "No image" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // AUTH TUNNELING
    const normalizeHeader = (h: string | null) => h ? h.replace("Bearer ", "") : "";
    const token = auth_token || normalizeHeader(req.headers.get("authorization"));

    if (!token) {
      console.error("Auth Error: Missing Auth Token");
      return new Response(JSON.stringify({ error: "Missing Auth Token" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false }
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error("Auth Error: Token validation failed", authError?.message);
      return new Response(JSON.stringify({ error: `Auth failed: ${authError?.message || "User not found"}` }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const imageUrl = imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`;
    const aiServiceUrl = Deno.env.get("AI_SERVICE_URL") ?? "http://3.88.200.253:9696";

    console.log("Calling Ollama (analyze)...");
    const response = await fetch(`${aiServiceUrl}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llava",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this image. If it's pitch black or not a pet, say error." },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
        stream: false,
        temperature: 0.1, // Lower temperature to reduce hallucinations
      }),
    });

    if (!response.ok) throw new Error(`Ollama status: ${response.status}`);

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    console.log("Raw AI Response (analyze):", content);

    if (!content) throw new Error("Empty AI response");

    let result: MoodAnalysisResult;
    try {
      const text = String(content).trim();
      const firstBrace = text.indexOf("{");
      const lastBrace = text.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1) {
        const parsed = JSON.parse(text.substring(firstBrace, lastBrace + 1));
        if (parsed.error === "not_a_pet") return new Response(JSON.stringify({ error: "not_a_pet" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        result = parsed;
      } else {
        throw new Error("No JSON found");
      }
    } catch (e) {
      console.warn("JSON parse failed");
      // STRICT FALLBACK (Fail Closed)
      // If we can't parse JSON, we assume it's NOT a valid result.
      return new Response(JSON.stringify({ error: "not_a_pet" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Ensure defaults
    if (!result.mood_emoji) result.mood_emoji = "😊";
    if (!result.care_tip) result.care_tip = CARE_TIPS[Math.floor(Math.random() * CARE_TIPS.length)];
    if (!result.mood_description) result.mood_description = "They look wonderful today.";

    return new Response(JSON.stringify(result), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Critical Error in analyze-pet-mood:", error);
    return new Response(
      JSON.stringify({ error: `System Error: ${error instanceof Error ? error.message : "Unknown"}` }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});