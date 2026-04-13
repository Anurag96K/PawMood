import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ValidationResult {
  valid: boolean;
  error_code?: "no_animal" | "no_face" | "too_small" | "low_quality";
  error_message?: string;
}

const VALIDATION_PROMPT = `You are an expert image validator for a pet mood analysis app. Your job is to determine if an image is suitable for pet mood analysis.

Analyze the image and check for these criteria:

1. **Animal Presence**: Is there an animal (dog, cat, bird, fish, hamster, rabbit, or other pet) in the image?
2. **Face Visibility**: Is the animal's face clearly visible? (eyes, nose/beak/snout should be identifiable)
3. **Face Size**: Is the animal's face large enough in the frame? The face should take up a reasonable portion of the image (at least 15-20% of the frame). Reject if:
   - The animal is too far away
   - The face is too small to analyze expressions
   - The animal appears tiny in the frame
4. **Image Quality**: Is the image clear enough? Check for:
   - Excessive blur that makes features unrecognizable
   - Too dark to see details
   - Too bright/overexposed to see features
   - Motion blur that obscures the face

Respond with ONLY valid JSON (no markdown, no code blocks):

If the image PASSES all checks:
{
  "valid": true
}

If the image FAILS, respond with ONE of these:

No animal detected:
{
  "valid": false,
  "error_code": "no_animal",
  "error_message": "We couldn't find a pet in this photo. Please take a photo of your furry, feathered, or finned friend!"
}

Animal present but face not visible:
{
  "valid": false,
  "error_code": "no_face",
  "error_message": "We can see your pet, but their face isn't clear enough. Please take another photo with their face visible!"
}

Animal too far away or face too small:
{
  "valid": false,
  "error_code": "too_small",
  "error_message": "Your pet looks a bit far away! Please get closer so we can see their adorable face better."
}

Image quality too low:
{
  "valid": false,
  "error_code": "low_quality",
  "error_message": "This photo is a bit blurry or dark. Please try again with better lighting and hold steady!"
}

IMPORTANT: Be strict about face size - if the animal's face is small or far away, reject it with "too_small". The face needs to be clearly visible and large enough to read expressions.`;

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

    console.log("Validating image for user:", user.id);

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

    console.log("Validating pet image with Lovable AI");

    // Use the faster/cheaper flash-lite model for validation
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: VALIDATION_PROMPT },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Validate this image for pet mood analysis.",
              },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
        max_tokens: 200,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);

      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "AI rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // On error, default to allowing the image through (fail open for validation)
      return new Response(
        JSON.stringify({ valid: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      // On invalid response, allow image through
      console.log("Invalid AI response, allowing image through");
      return new Response(
        JSON.stringify({ valid: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the JSON response from AI
    let validationResult: ValidationResult;
    try {
      let cleanContent = String(content).trim();
      if (cleanContent.startsWith("```json")) cleanContent = cleanContent.slice(7);
      if (cleanContent.startsWith("```")) cleanContent = cleanContent.slice(3);
      if (cleanContent.endsWith("```")) cleanContent = cleanContent.slice(0, -3);

      validationResult = JSON.parse(cleanContent.trim());
      console.log("Validation result:", validationResult);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // On parse error, allow image through
      validationResult = { valid: true };
    }

    return new Response(
      JSON.stringify(validationResult),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in validate-pet-image:", error);
    // On any error, allow image through (fail open)
    return new Response(
      JSON.stringify({ valid: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
