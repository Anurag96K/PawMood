import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// STRICTER PROMPT
const VALIDATION_PROMPT = `You are a strict validation AI. 
Analyze this image. Does it contain a real living CAT or DOG?
Return ONLY this JSON:
{"valid": true} -> If it is a real cat or dog.
{"valid": false, "error_message": "Not a cat or dog"} -> If it is a human, toy, drawing, text, dark/blur, or other animal.
Refuse faces, hands, dolls, and stuffed animals.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, auth_token } = await req.json();

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "No image" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

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
      return new Response(
        JSON.stringify({ error: `Auth failed: ${authError?.message || "User not found"}` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const imageUrl = imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`;
    const aiServiceUrl = Deno.env.get("AI_SERVICE_URL") ?? "http://3.88.200.253:9696";

    console.log("Calling Ollama (validate)...");
    const response = await fetch(`${aiServiceUrl}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llava",
        messages: [
          { role: "system", content: VALIDATION_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Is this a cat or dog? JSON only." },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
        stream: false,
        temperature: 0.1, // Zero creativity for validation
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama status: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    console.log("Ollama raw output (validate):", content);

    if (!content) throw new Error("Empty AI output");

    const text = String(content).toLowerCase();

    // STRICT JSON PARSING
    try {
      const firstBrace = text.indexOf("{");
      const lastBrace = text.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1) {
        const parsed = JSON.parse(text.substring(firstBrace, lastBrace + 1));
        if (typeof parsed.valid === 'boolean') {
          // Return the explicit decision
          return new Response(JSON.stringify(parsed), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      }
    } catch (e) {
      console.warn("JSON parse failed in validate-pet-image");
    }

    // FALLBACK: STRICTER KEYWORD CHECK
    // Only accept if it EXPLICITLY says "valid": true or similar positive assertion
    // Replaced loose "dog" check with nothing.
    // FAIL CLOSED: If we can't parse JSON, assume it's invalid.

    return new Response(
      JSON.stringify({ valid: false, error_message: "We couldn't clearly see a dog or cat. Please try again." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Critical Error in validate-pet-image:", error);
    return new Response(
      JSON.stringify({ valid: false, error_message: `System Error: ${error instanceof Error ? error.message : "Unknown"}` }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
