import "@supabase/functions-js/edge-runtime.d.ts";
import Anthropic from "npm:@anthropic-ai/sdk@^0.39.0";
import { checkRateLimit, getClientIP } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CONDITION_RULES: Record<string, { avoid: string[]; prefer: string[]; notes: string[] }> = {
  diabetes: { avoid: ["sugar", "white_rice", "white_bread", "high_gi"], prefer: ["whole_grains", "leafy_greens", "lean_protein", "low_gi"], notes: ["Carbs limited to ~40%. Low GI preferred."] },
  hypertension: { avoid: ["high_sodium", "processed_meat"], prefer: ["potassium_rich", "leafy_greens", "whole_grains", "low_fat_dairy"], notes: ["Sodium under 1500mg/day."] },
  heart_disease: { avoid: ["saturated_fat", "trans_fat", "fried"], prefer: ["omega3", "fiber", "whole_grains", "lean_protein"], notes: ["Sat fat below 6%."] },
  kidney_disease: { avoid: ["high_potassium", "high_phosphorus", "high_sodium"], prefer: ["low_potassium_veg", "white_rice", "egg_whites"], notes: ["K, P, Na limited."] },
  celiac: { avoid: ["wheat", "barley", "rye", "gluten"], prefer: ["rice", "quinoa", "corn", "potatoes"], notes: ["Strictly gluten-free."] },
  gout: { avoid: ["high_purine", "organ_meat", "shellfish"], prefer: ["low_purine", "cherries", "low_fat_dairy"], notes: ["Low purine."] },
  ibs: { avoid: ["high_fodmap", "garlic", "onion", "beans"], prefer: ["low_fodmap", "rice", "potatoes", "lean_protein"], notes: ["Low FODMAP."] },
  obesity: { avoid: ["calorie_dense", "sugar", "fried"], prefer: ["lean_protein", "vegetables", "whole_grains"], notes: ["High satiety, controlled calories."] },
  anemia: { avoid: ["tea_with_meals"], prefer: ["iron_rich", "vitamin_c", "lean_red_meat", "spinach"], notes: ["Iron-rich + Vitamin C."] },
  osteoporosis: { avoid: ["excess_sodium"], prefer: ["calcium_rich", "vitamin_d", "leafy_greens", "dairy"], notes: ["Calcium 1000-1200mg/day."] },
  liver_disease: { avoid: ["alcohol", "high_fat", "fried"], prefer: ["lean_protein_moderate", "whole_grains", "fruits"], notes: ["Low fat, easy digest."] },
  cholesterol: { avoid: ["saturated_fat", "trans_fat", "full_fat_dairy"], prefer: ["soluble_fiber", "omega3", "nuts", "oats"], notes: ["Soluble fiber to lower LDL."] },
};

const OUTPUT_SCHEMA = `Each <meal> object MUST have ALL fields:
{ "name": "string", "description": "string",
  "calories": number, "protein": number(g), "carbs": number(g), "fat": number(g), "fiber": number(g), "sodium": number(mg),
  "tags": ["string[]"], "allergens": ["string[]"],
  "suitable": ["conditionIDs"], "unsuitable": ["conditionIDs"],
  "diet": ["vegetarian"|"vegan"|"pescatarian"], "cuisine": "string",
  "ingredients": ["string[]"],
  "category_ingredients": { "proteins":[], "vegetables":[], "fruits":[], "grains":[], "dairy":[], "nuts":[], "pantry":[] },
  "recipe": { "prepTime":"string", "cookTime":"string", "servings":number, "steps":["string[]"] }
}`;

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

    // Rate limit by IP
    const ip = getClientIP(req);
    const rl = await checkRateLimit(ip, "medieat-mealplan");
    if (!rl.allowed) {
      return new Response(
        JSON.stringify({ error: `Rate limit exceeded. Try again in ${Math.ceil(rl.resetSeconds / 60)} minutes.` }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(rl.resetSeconds) } }
      );
    }

    const profile = await req.json();
    const conditionDetails = (profile.conditions || []).map((c: string) => {
      const rules = CONDITION_RULES[c];
      if (!rules) return `- ${c}`;
      return `- ${c}: Avoid [${rules.avoid.join(", ")}]. Prefer [${rules.prefer.join(", ")}]. ${rules.notes.join(" ")}`;
    }).join("\n");

    const allergenList = [...(profile.allergies || []), ...(profile.customAllergies || [])];
    const macroInfo = Object.entries(profile.macroTargets || {})
      .filter(([, v]) => (v as number) > 0)
      .map(([k, v]) => `${k}: ${k === "sodium" ? `max ${v}mg` : `${v}g`}/day`)
      .join(", ");
    const snackCount = (profile.mealCount || 4) - 3;

    const systemMessages: Anthropic.MessageCreateParams["system"] = [
      {
        type: "text",
        text: `You are a clinical nutritionist AI for MediEat. Create personalized meal plans that are medically appropriate, nutritionally balanced, and delicious.
RULES: Never suggest foods conflicting with conditions/allergies. Realistic nutrition values. Practical recipes under 45 min.
OUTPUT: Respond with ONLY valid JSON array of day objects. Each day: { "breakfast": <meal>, "lunch": <meal>, "dinner": <meal>, "snacks": [<meal>,...] }
${OUTPUT_SCHEMA}
Condition IDs: diabetes, hypertension, heart_disease, kidney_disease, celiac, gout, ibs, obesity, anemia, osteoporosis, liver_disease, cholesterol`,
        cache_control: { type: "ephemeral" },
      },
      {
        type: "text",
        text: `USER PROFILE:
Conditions: ${profile.conditions?.length ? profile.conditions.join(", ") : "None"}
${conditionDetails || ""}
Allergies: ${allergenList.length ? allergenList.join(", ") : "None"}
Diet: ${profile.dietPreference || "any"} | Calories: ${profile.calorieTarget || 2000} kcal/day | Meals: ${profile.mealCount || 4}
Favourites: ${profile.favoriteFoods?.length ? profile.favoriteFoods.join(", ") : "None"}
Cuisines: ${profile.cuisines?.length ? profile.cuisines.join(", ") : "Any"}
${macroInfo ? `Macros: ${macroInfo}` : ""}${profile.macroGoals?.length ? `\nFocus: ${profile.macroGoals.join(", ")}` : ""}`,
        cache_control: { type: "ephemeral" },
      },
    ];

    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 16384,
      system: systemMessages,
      messages: [{ role: "user", content: `Generate a ${profile.planDuration || 7}-day meal plan with 3 meals and ${snackCount} snack(s)/day at ${profile.calorieTarget || 2000} kcal/day. Varied, with full recipes.` }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    let parsed;
    try { parsed = JSON.parse(text); }
    catch {
      const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) parsed = JSON.parse(match[1].trim());
      else { const s = text.indexOf("["), e = text.lastIndexOf("]"); parsed = JSON.parse(text.slice(s, e + 1)); }
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "AI meal plan failed: " + (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
