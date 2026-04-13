import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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

const SYSTEM_PROMPT = `You are an expert pet mood analyzer specializing in analyzing pets including dogs, cats, fish, birds, hamsters, rabbits, and other animals. Analyze the pet's body language, posture, eyes, fins, scales, feathers, or fur to determine their mood.

## MOOD CATEGORIES (Choose ONE):

### Basic Moods
- Happy 😊
- Relaxed 😌
- Excited 🤩
- Curious 🧐

### Neutral / Subtle Moods
- Calm 😎
- Thoughtful 🤔
- Observant 👀
- Focused 🎯

### Negative / Stress-Related Moods
- Anxious 😰
- Lonely 🥺
- Bored 😒
- Alert ⚠️

### Cute & App-Friendly Expressions
- Playful 🎾
- Sleepy 😴
- Moody 😤
- Mischievous 😈

## RESPONSE RULES:

1. **MOOD**: Accurately identify the pet's mood based on what you observe in the image. Be truthful about what you see.

2. **MOOD DESCRIPTION**: Write a unique, creative one-liner (max 20 words) about the mood. 
   - MUST be different every single time, even for the same mood
   - Use warm, engaging language pet owners will love
   - Be creative with metaphors, expressions, and observations
   - Examples: "Those eyes are telling a story of pure contentment!", "Your little swimmer is vibing with the current today!", "Someone woke up on the right side of the bed!"

3. **CARE TIP**: Provide a unique, actionable care tip (max 15 words).
   - MUST be different every single time
   - Make it specific and helpful
   - Examples: "Try a gentle water current for extra stimulation!", "A cozy hideout would make this moment perfect!", "Time for a special treat to celebrate!"

4. **CONFIDENCE**: Rate 70-98 based on image clarity and how clearly the mood is expressed.

## OUTPUT FORMAT:
Respond with ONLY valid JSON (no markdown, no code blocks):
{
  "mood": "Mood Name",
  "mood_emoji": "emoji",
  "mood_description": "Your unique one-liner description",
  "confidence": number,
  "care_tip": "Your unique care tip"
}

CRITICAL: Generate FRESH, UNIQUE descriptions and tips every time. Never repeat the same phrases.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client to verify user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error("Authentication failed:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Authenticated user:", user.id);

    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      console.error("No image provided");
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate image size (max ~5MB base64)
    if (imageBase64.length > 5 * 1024 * 1024) {
      console.error("Image too large:", imageBase64.length);
      return new Response(
        JSON.stringify({ error: "Image too large" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const imageUrl = imageBase64.startsWith("data:")
      ? imageBase64
      : `data:image/jpeg;base64,${imageBase64}`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Analyzing pet mood with Lovable AI for user:", user.id);
    console.log("Image size (chars):", imageUrl.length);

    const startTime = Date.now();
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this pet's mood. Generate a completely unique description and care tip. Seed: ${Date.now()}-${Math.random().toString(36).slice(2)}`,
              },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
        max_tokens: 500,
        temperature: 0.9,
      }),
    });

    const responseTime = Date.now() - startTime;
    console.log("AI response received:", { status: response.status, timeMs: responseTime });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);

      const msg = response.status === 402
        ? "AI credits exhausted. Please add credits to continue."
        : response.status === 429
          ? "AI rate limit exceeded. Please try again shortly."
          : response.status === 504 || response.status === 408
            ? "AI service timed out. Please try again."
            : `AI service error (${response.status}). Please try again.`;

      return new Response(
        JSON.stringify({ error: msg }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    
    console.log("AI content received, length:", content?.length || 0);

    if (!content) {
      console.error("Empty or invalid AI response:", JSON.stringify(aiResponse));
      return new Response(
        JSON.stringify({ error: "AI returned an empty response. Please try again." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the JSON response from AI
    let analysisResult: MoodAnalysisResult;
    try {
      let cleanContent = String(content).trim();
      if (cleanContent.startsWith("```json")) cleanContent = cleanContent.slice(7);
      if (cleanContent.startsWith("```")) cleanContent = cleanContent.slice(3);
      if (cleanContent.endsWith("```")) cleanContent = cleanContent.slice(0, -3);

      analysisResult = JSON.parse(cleanContent.trim());

      const validMoods = [
        "Happy", "Relaxed", "Excited", "Curious",
        "Calm", "Thoughtful", "Observant", "Focused",
        "Anxious", "Lonely", "Bored", "Alert",
        "Playful", "Sleepy", "Moody", "Mischievous",
      ];

      if (!validMoods.includes(analysisResult.mood)) {
        analysisResult.mood = "Happy";
        analysisResult.mood_emoji = "😊";
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      analysisResult = {
        mood: "Happy",
        mood_emoji: "😊",
        mood_description: "Your pet looks wonderful today!",
        confidence: 75,
        care_tip: "Keep showering your pet with love and attention!",
      };
    }

    return new Response(
      JSON.stringify(analysisResult),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in analyze-pet-mood:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});