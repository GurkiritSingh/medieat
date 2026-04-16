import "@supabase/functions-js/edge-runtime.d.ts";
import Anthropic from "npm:@anthropic-ai/sdk@^0.39.0";
import { checkRateLimit, getClientIP } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `You are GShop's AI shopping assistant for UK grocery shopping. You help users plan meals, build shopping lists, and make smart grocery decisions.

CRITICAL RULES:
- Always suggest UK-available products and brands
- Use UK spelling (colour, favourite, etc.)
- Reference UK supermarkets (Tesco, Asda, Sainsbury's, Aldi, Lidl, Morrisons, etc.)
- Respect dietary filters and allergens strictly
- Be friendly, concise, and practical
- When suggesting meals, include ingredients with quantities

AVAILABLE GROCERY CATEGORIES (use exactly these values):
fruit_veg, meat_fish, dairy, bakery, drinks, snacks, household, frozen, tinned, other

AVAILABLE DIETARY TAGS:
vegan, vegetarian, gluten_free, dairy_free, halal, nut_free, kosher

RESPONSE FORMAT:
You must respond with ONLY valid JSON (no markdown, no code fences). The JSON must have this structure:

{
  "message": "Your conversational response to the user",
  "shopping_items": [
    { "name": "item name", "quantity": 1, "category": "fruit_veg" }
  ],
  "meal_suggestions": [
    {
      "name": "Meal name",
      "servings": 4,
      "tags": ["vegetarian", "nut_free"],
      "ingredients": [
        { "name": "ingredient name", "quantity": 1, "category": "fruit_veg" }
      ]
    }
  ]
}

Rules:
- "message" is ALWAYS required
- "shopping_items" is optional — only include when suggesting items to add to their list
- "meal_suggestions" is optional — only include when suggesting specific meals
- Keep item names UK-appropriate (e.g. "mince beef" not "ground beef", "coriander" not "cilantro")`;

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
    const rl = await checkRateLimit(ip, "gshop-ai");
    if (!rl.allowed) {
      return new Response(
        JSON.stringify({ error: `Rate limit exceeded. Try again in ${Math.ceil(rl.resetSeconds / 60)} minutes.` }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(rl.resetSeconds) } }
      );
    }

    const { message, conversationHistory, dietaryFilters, allergens, budget } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userContext: string[] = [];
    if (dietaryFilters?.length) userContext.push(`Dietary filters: ${dietaryFilters.join(", ")}`);
    if (allergens?.length) userContext.push(`Allergens to avoid: ${allergens.join(", ")}`);
    if (budget) userContext.push(`Budget: £${budget}`);

    const systemMessages: Anthropic.MessageCreateParams["system"] = [
      { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
    ];

    if (userContext.length > 0) {
      systemMessages.push({
        type: "text",
        text: `USER PREFERENCES:\n${userContext.join("\n")}`,
        cache_control: { type: "ephemeral" },
      });
    }

    const messages: Anthropic.MessageParam[] = [];
    if (conversationHistory?.length) {
      for (const msg of conversationHistory) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }
    messages.push({ role: "user", content: message });

    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemMessages,
      messages,
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) {
        parsed = JSON.parse(match[1].trim());
      } else {
        const start = text.indexOf("{");
        const end = text.lastIndexOf("}");
        if (start !== -1 && end !== -1) {
          parsed = JSON.parse(text.slice(start, end + 1));
        } else {
          parsed = { message: text };
        }
      }
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "AI request failed: " + (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
