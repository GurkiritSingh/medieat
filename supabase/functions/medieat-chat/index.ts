import "@supabase/functions-js/edge-runtime.d.ts";
import Anthropic from "npm:@anthropic-ai/sdk@^0.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CONDITION_RULES: Record<string, { avoid: string[]; prefer: string[] }> = {
  diabetes: { avoid: ["sugar", "white_rice", "high_gi"], prefer: ["whole_grains", "leafy_greens", "lean_protein"] },
  hypertension: { avoid: ["high_sodium", "processed_meat"], prefer: ["potassium_rich", "leafy_greens", "low_fat_dairy"] },
  heart_disease: { avoid: ["saturated_fat", "trans_fat", "fried"], prefer: ["omega3", "fiber", "whole_grains"] },
  kidney_disease: { avoid: ["high_potassium", "high_phosphorus", "high_sodium"], prefer: ["low_potassium_veg", "egg_whites"] },
  celiac: { avoid: ["wheat", "barley", "rye", "gluten"], prefer: ["rice", "quinoa", "corn", "potatoes"] },
  gout: { avoid: ["high_purine", "organ_meat", "shellfish"], prefer: ["low_purine", "cherries", "low_fat_dairy"] },
  ibs: { avoid: ["high_fodmap", "garlic", "onion"], prefer: ["low_fodmap", "rice", "potatoes", "lean_protein"] },
  obesity: { avoid: ["calorie_dense", "sugar", "fried"], prefer: ["lean_protein", "vegetables", "whole_grains"] },
  anemia: { avoid: ["tea_with_meals"], prefer: ["iron_rich", "vitamin_c", "lean_red_meat", "spinach"] },
  osteoporosis: { avoid: ["excess_sodium"], prefer: ["calcium_rich", "vitamin_d", "leafy_greens", "dairy"] },
  liver_disease: { avoid: ["alcohol", "high_fat", "fried"], prefer: ["lean_protein_moderate", "whole_grains", "fruits"] },
  cholesterol: { avoid: ["saturated_fat", "full_fat_dairy"], prefer: ["soluble_fiber", "omega3", "nuts", "oats"] },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "AI not configured — add ANTHROPIC_API_KEY to Supabase secrets" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages, healthProfile } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const profile = healthProfile || {};
    const conditionDetails = (profile.conditions || []).map((c: string) => {
      const rules = CONDITION_RULES[c];
      if (!rules) return `- ${c}`;
      return `- ${c}: Avoid [${rules.avoid.join(", ")}]. Prefer [${rules.prefer.join(", ")}].`;
    }).join("\n");
    const allergenList = [...(profile.allergies || []), ...(profile.customAllergies || [])];

    const systemMessages: Anthropic.MessageCreateParams["system"] = [
      {
        type: "text",
        text: `You are MediEat's AI Nutrition Advisor — a knowledgeable, friendly clinical nutrition assistant.

YOUR ROLE:
- Answer nutrition questions grounded in the user's health profile
- Explain whether specific foods are safe/beneficial given their conditions
- Suggest meals, snacks, or food swaps tailored to their needs
- Be warm, concise, and practical (2-4 paragraphs max)

RULES:
- Always consider the user's conditions and allergies
- Never provide medical diagnoses
- When uncertain, recommend consulting their healthcare provider
- If they ask about a food, state whether it's safe/good/bad for their conditions`,
        cache_control: { type: "ephemeral" },
      },
      {
        type: "text",
        text: `USER HEALTH PROFILE:
Conditions: ${profile.conditions?.length ? profile.conditions.join(", ") : "None"}
${conditionDetails || ""}
Allergies: ${allergenList.length ? allergenList.join(", ") : "None"}
Diet: ${profile.dietPreference || "any"} | Calories: ${profile.calorieTarget || 2000} kcal/day
${profile.macroGoals?.length ? `Focus: ${profile.macroGoals.join(", ")}` : ""}`,
        cache_control: { type: "ephemeral" },
      },
    ];

    const anthropic = new Anthropic({ apiKey });

    // Non-streaming response for simplicity with edge functions
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: systemMessages,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Chat failed: " + (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
