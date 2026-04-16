// ============================================================
// MediEat — AI Client (Claude API via Anthropic SDK)
// ============================================================
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic(); // reads ANTHROPIC_API_KEY from env

// ============================================================
// PROMPT BUILDERS
// ============================================================

function buildMealPlanSystemPrompt(profile) {
    const conditionDetails = (profile.conditions || []).map(c => {
        const rules = CONDITION_RULES[c];
        if (!rules) return `- ${c}`;
        return `- ${c}: Avoid [${(rules.avoid || []).join(', ')}]. Prefer [${(rules.prefer || []).join(', ')}]. ${(rules.notes || []).join(' ')}`;
    }).join('\n');

    const allergenList = [...(profile.allergies || []), ...(profile.customAllergies || [])];
    const macroInfo = Object.entries(profile.macroTargets || {})
        .filter(([, v]) => v > 0)
        .map(([k, v]) => `${k}: ${k === 'sodium' ? `max ${v}mg` : `${v}g`}/day`)
        .join(', ');

    return [
        {
            type: 'text',
            text: `You are a clinical nutritionist AI for MediEat, a medical dietary planning app. You create personalized meal plans that are medically appropriate, nutritionally balanced, and delicious.

CRITICAL RULES:
- Never suggest foods that conflict with the user's medical conditions or allergies
- All nutritional values must be realistic and accurate
- Recipes should be practical for home cooking (under 45 min total)
- Use metric and imperial measurements
- Each meal MUST include a recipe with steps

OUTPUT FORMAT:
You must respond with ONLY valid JSON (no markdown, no code fences, no explanation). The JSON must be an array of day objects. Each day object has this structure:

{
  "breakfast": <meal>,
  "lunch": <meal>,
  "dinner": <meal>,
  "snacks": [<meal>, ...]
}

Each <meal> object MUST have ALL of these fields:
{
  "name": "string - descriptive meal name",
  "description": "string - 1-2 sentence description of the meal",
  "calories": number,
  "protein": number (grams),
  "carbs": number (grams),
  "fat": number (grams),
  "fiber": number (grams),
  "sodium": number (mg),
  "tags": ["string array - e.g. iron_rich, calcium_rich, omega3, low_fodmap, high_fiber, low_gi"],
  "allergens": ["string array - e.g. gluten, dairy, nuts, eggs, soy, shellfish, fish, sesame, peanuts"],
  "suitable": ["string array - condition IDs this meal is good for"],
  "unsuitable": ["string array - condition IDs this meal is bad for"],
  "diet": ["string array - e.g. vegetarian, vegan, pescatarian"],
  "cuisine": "string - e.g. western, mediterranean, south_asian, east_asian, japanese, korean, latin, middle_eastern, african, caribbean",
  "ingredients": ["string array - list of ingredients"],
  "category_ingredients": {
    "proteins": ["string array"],
    "vegetables": ["string array"],
    "fruits": ["string array"],
    "grains": ["string array"],
    "dairy": ["string array"],
    "nuts": ["string array"],
    "pantry": ["string array"]
  },
  "recipe": {
    "prepTime": "string - e.g. 10 min",
    "cookTime": "string - e.g. 20 min",
    "servings": number,
    "steps": ["string array - cooking steps"]
  }
}

Condition IDs: diabetes, hypertension, heart_disease, kidney_disease, celiac, gout, ibs, obesity, anemia, osteoporosis, liver_disease, cholesterol`,
            cache_control: { type: 'ephemeral' }
        },
        {
            type: 'text',
            text: `USER HEALTH PROFILE:
Conditions: ${profile.conditions?.length ? profile.conditions.join(', ') : 'None'}
${conditionDetails ? `Condition Details:\n${conditionDetails}` : ''}
Allergies: ${allergenList.length ? allergenList.join(', ') : 'None'}
Diet Preference: ${profile.dietPreference || 'any'}
Calorie Target: ${profile.calorieTarget || 2000} kcal/day
Meals Per Day: ${profile.mealCount || 4} (${(profile.mealCount || 4) - 3} snack(s))
Favorite Foods: ${profile.favoriteFoods?.length ? profile.favoriteFoods.join(', ') : 'None specified'}
Cuisine Preferences: ${profile.cuisines?.length ? profile.cuisines.join(', ') : 'Any'}
${macroInfo ? `Macro Targets: ${macroInfo}` : ''}
${profile.macroGoals?.length ? `Nutrient Focus: ${profile.macroGoals.join(', ')}` : ''}`,
            cache_control: { type: 'ephemeral' }
        }
    ];
}

function buildChatSystemPrompt(profile) {
    const conditionDetails = (profile.conditions || []).map(c => {
        const rules = CONDITION_RULES[c];
        if (!rules) return `- ${c}`;
        return `- ${c}: Avoid [${(rules.avoid || []).join(', ')}]. Prefer [${(rules.prefer || []).join(', ')}].`;
    }).join('\n');

    const allergenList = [...(profile.allergies || []), ...(profile.customAllergies || [])];

    return [
        {
            type: 'text',
            text: `You are MediEat's AI Nutrition Advisor — a knowledgeable, friendly clinical nutrition assistant.

YOUR ROLE:
- Answer nutrition questions grounded in the user's health profile
- Explain whether specific foods are safe/beneficial given their conditions
- Suggest meals, snacks, or food swaps tailored to their needs
- Provide evidence-based nutrition advice
- Be warm, concise, and practical

IMPORTANT RULES:
- Always consider the user's medical conditions and allergies in your answers
- Never provide medical diagnoses or replace professional medical advice
- When uncertain about safety, recommend consulting their healthcare provider
- Keep responses concise (2-4 paragraphs max unless they ask for detail)
- Use simple language, avoid excessive medical jargon
- If they ask about a food, always state whether it's safe/good/bad for their specific conditions`,
            cache_control: { type: 'ephemeral' }
        },
        {
            type: 'text',
            text: `USER HEALTH PROFILE:
Conditions: ${profile.conditions?.length ? profile.conditions.join(', ') : 'None'}
${conditionDetails ? `Condition Details:\n${conditionDetails}` : ''}
Allergies: ${allergenList.length ? allergenList.join(', ') : 'None'}
Diet Preference: ${profile.dietPreference || 'any'}
Calorie Target: ${profile.calorieTarget || 2000} kcal/day
Favorite Foods: ${profile.favoriteFoods?.length ? profile.favoriteFoods.join(', ') : 'None specified'}
${profile.macroGoals?.length ? `Nutrient Focus: ${profile.macroGoals.join(', ')}` : ''}

Always reference these conditions and allergies when answering nutrition questions.`,
            cache_control: { type: 'ephemeral' }
        }
    ];
}

// ============================================================
// CONDITION RULES (same as database.js, server-side copy)
// ============================================================
const CONDITION_RULES = {
    diabetes: {
        avoid: ['sugar', 'white_rice', 'white_bread', 'high_gi'],
        prefer: ['whole_grains', 'leafy_greens', 'lean_protein', 'low_gi'],
        notes: ['Carbs limited to ~40% of daily calories. Low glycemic index foods preferred. Fiber-rich foods prioritized.']
    },
    hypertension: {
        avoid: ['high_sodium', 'processed_meat', 'canned_soup'],
        prefer: ['potassium_rich', 'leafy_greens', 'whole_grains', 'low_fat_dairy'],
        notes: ['Sodium restricted to under 1500mg/day (DASH diet). Potassium-rich foods included.']
    },
    heart_disease: {
        avoid: ['saturated_fat', 'trans_fat', 'fried', 'processed_meat'],
        prefer: ['omega3', 'fiber', 'whole_grains', 'lean_protein'],
        notes: ['Saturated fat below 6% of daily calories. Omega-3 and soluble fiber emphasized.']
    },
    kidney_disease: {
        avoid: ['high_potassium', 'high_phosphorus', 'high_sodium', 'processed'],
        prefer: ['low_potassium_veg', 'white_rice', 'egg_whites'],
        notes: ['Potassium, phosphorus, and sodium limited. Protein portions controlled.']
    },
    celiac: {
        avoid: ['wheat', 'barley', 'rye', 'gluten', 'cross_contamination'],
        prefer: ['rice', 'quinoa', 'corn', 'potatoes', 'gf_oats'],
        notes: ['All gluten strictly excluded. Only certified gluten-free oats.']
    },
    gout: {
        avoid: ['high_purine', 'organ_meat', 'shellfish', 'beer', 'fructose'],
        prefer: ['low_purine', 'cherries', 'low_fat_dairy', 'vegetables'],
        notes: ['High-purine foods avoided. Low-fat dairy may help lower uric acid.']
    },
    ibs: {
        avoid: ['high_fodmap', 'garlic', 'onion', 'beans', 'wheat_large'],
        prefer: ['low_fodmap', 'rice', 'potatoes', 'lean_protein', 'bananas'],
        notes: ['Low-FODMAP principles. Common triggers avoided. Moderate portions.']
    },
    obesity: {
        avoid: ['calorie_dense', 'sugar', 'fried', 'refined_carbs'],
        prefer: ['lean_protein', 'vegetables', 'whole_grains', 'high_satiety'],
        notes: ['High satiety with controlled calories. Protein increased for muscle preservation.']
    },
    anemia: {
        avoid: ['tea_with_meals', 'calcium_with_iron'],
        prefer: ['iron_rich', 'vitamin_c', 'lean_red_meat', 'spinach', 'legumes'],
        notes: ['Iron-rich foods featured. Vitamin C paired with iron for absorption.']
    },
    osteoporosis: {
        avoid: ['excess_sodium', 'excess_caffeine', 'excess_alcohol'],
        prefer: ['calcium_rich', 'vitamin_d', 'leafy_greens', 'dairy', 'fortified'],
        notes: ['Calcium targeted at 1000-1200mg/day. Vitamin D-rich foods included.']
    },
    liver_disease: {
        avoid: ['alcohol', 'high_fat', 'fried', 'excess_protein', 'raw_shellfish'],
        prefer: ['lean_protein_moderate', 'whole_grains', 'fruits', 'vegetables'],
        notes: ['Low fat to reduce liver workload. Easy to digest preparations.']
    },
    cholesterol: {
        avoid: ['saturated_fat', 'trans_fat', 'full_fat_dairy', 'processed_meat'],
        prefer: ['soluble_fiber', 'omega3', 'plant_sterols', 'nuts', 'oats'],
        notes: ['Soluble fiber to lower LDL. Saturated fat below 7% of daily calories.']
    }
};

// ============================================================
// API FUNCTIONS
// ============================================================

async function generateMealPlan(profile) {
    const snackCount = (profile.mealCount || 4) - 3;
    const systemPrompt = buildMealPlanSystemPrompt(profile);

    const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 16384,
        system: systemPrompt,
        messages: [
            {
                role: 'user',
                content: `Generate a ${profile.planDuration || 7}-day meal plan with 3 main meals and ${snackCount} snack(s) per day, targeting ${profile.calorieTarget || 2000} kcal/day total. Make each day varied and interesting. Include complete recipes for every meal.`
            }
        ]
    });

    const text = response.content[0].text;

    // Try to parse JSON directly, or extract from code fences
    let parsed;
    try {
        parsed = JSON.parse(text);
    } catch {
        const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (match) {
            parsed = JSON.parse(match[1].trim());
        } else {
            // Try to find array brackets
            const start = text.indexOf('[');
            const end = text.lastIndexOf(']');
            if (start !== -1 && end !== -1) {
                parsed = JSON.parse(text.slice(start, end + 1));
            } else {
                throw new Error('Could not parse AI response as JSON');
            }
        }
    }

    return parsed;
}

async function* streamChat(messages, profile) {
    const systemPrompt = buildChatSystemPrompt(profile);

    const stream = anthropic.messages.stream({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: systemPrompt,
        messages: messages
    });

    for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            yield event.delta.text;
        }
    }
}

module.exports = { generateMealPlan, streamChat };
