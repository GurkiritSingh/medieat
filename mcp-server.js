const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z } = require('zod');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase admin client (bypasses RLS)
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Pushover config (loaded from .env)
const PUSHOVER_USER_KEY = process.env.PUSHOVER_USER_KEY;
const PUSHOVER_API_TOKEN = process.env.PUSHOVER_API_TOKEN;

const server = new McpServer({
    name: 'medieat',
    version: '1.0.0',
    description: 'MediEat — Meal planning, health profiles, grocery lists, and notifications'
});

// ============================================================
// HELPER: Get the first user (single-user MCP)
// ============================================================
async function getFirstUser() {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) throw new Error(`Failed to list users: ${error.message}`);
    if (!data.users || data.users.length === 0) throw new Error('No users found');
    return data.users[0];
}

// ============================================================
// TOOL: Get Health Profile
// ============================================================
server.tool(
    'get_health_profile',
    'Get the user health profile (conditions, allergies, diet preferences, calorie target, macros)',
    {},
    async () => {
        const user = await getFirstUser();
        const { data, error } = await supabase
            .from('health_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') {
            return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
        }

        if (!data) {
            return { content: [{ type: 'text', text: 'No health profile found. Use update_health_profile to create one.' }] };
        }

        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
);

// ============================================================
// TOOL: Update Health Profile
// ============================================================
server.tool(
    'update_health_profile',
    'Create or update the user health profile (conditions, allergies, diet preferences, calorie target, macros)',
    {
        conditions: z.array(z.string()).optional().describe('Medical conditions (e.g. Diabetes, Hypertension, Heart Disease, Kidney Disease, Celiac, Gout, IBS, Obesity, Anemia, Osteoporosis, Liver Disease, High Cholesterol)'),
        allergies: z.array(z.string()).optional().describe('Allergies (e.g. Gluten, Dairy, Tree Nuts, Peanuts, Eggs, Soy, Shellfish, Fish, Sesame, Corn)'),
        custom_allergies: z.array(z.string()).optional().describe('Custom allergies not in the standard list'),
        favorite_foods: z.array(z.string()).optional().describe('Favorite foods to include in meal plans'),
        diet_preference: z.string().optional().describe('Diet type: any, vegetarian, vegan, keto, paleo, mediterranean, halal, kosher'),
        calorie_target: z.number().optional().describe('Daily calorie target'),
        meal_count: z.number().optional().describe('Number of meals per day'),
        cuisines: z.array(z.string()).optional().describe('Preferred cuisines'),
        macro_targets: z.object({
            protein: z.number().optional(),
            carbs: z.number().optional(),
            fat: z.number().optional(),
            fiber: z.number().optional(),
            sodium: z.number().optional()
        }).optional().describe('Macro nutrient targets in grams (sodium in mg)'),
        macro_goals: z.array(z.string()).optional().describe('Macro goals like high-protein, low-carb, low-sodium')
    },
    async (params) => {
        const user = await getFirstUser();

        const updateData = { user_id: user.id, updated_at: new Date().toISOString() };
        if (params.conditions !== undefined) updateData.conditions = params.conditions;
        if (params.allergies !== undefined) updateData.allergies = params.allergies;
        if (params.custom_allergies !== undefined) updateData.custom_allergies = params.custom_allergies;
        if (params.favorite_foods !== undefined) updateData.favorite_foods = params.favorite_foods;
        if (params.diet_preference !== undefined) updateData.diet_preference = params.diet_preference;
        if (params.calorie_target !== undefined) updateData.calorie_target = params.calorie_target;
        if (params.meal_count !== undefined) updateData.meal_count = params.meal_count;
        if (params.cuisines !== undefined) updateData.cuisines = params.cuisines;
        if (params.macro_targets !== undefined) updateData.macro_targets = params.macro_targets;
        if (params.macro_goals !== undefined) updateData.macro_goals = params.macro_goals;

        const { data, error } = await supabase
            .from('health_profiles')
            .upsert(updateData, { onConflict: 'user_id' })
            .select()
            .single();

        if (error) return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
        return { content: [{ type: 'text', text: `Health profile updated:\n${JSON.stringify(data, null, 2)}` }] };
    }
);

// ============================================================
// TOOL: List Meal Plans
// ============================================================
server.tool(
    'list_meal_plans',
    'List all saved meal plans (returns name, duration, calorie target, created date)',
    {},
    async () => {
        const user = await getFirstUser();
        const { data, error } = await supabase
            .from('meal_plans')
            .select('id, name, duration_days, calorie_target, conditions, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
        if (!data || data.length === 0) {
            return { content: [{ type: 'text', text: 'No meal plans found.' }] };
        }

        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
);

// ============================================================
// TOOL: Get Meal Plan
// ============================================================
server.tool(
    'get_meal_plan',
    'Get full details of a specific meal plan including all meals',
    {
        plan_id: z.string().describe('The UUID of the meal plan to retrieve')
    },
    async ({ plan_id }) => {
        const user = await getFirstUser();
        const { data, error } = await supabase
            .from('meal_plans')
            .select('*')
            .eq('id', plan_id)
            .eq('user_id', user.id)
            .single();

        if (error) return { content: [{ type: 'text', text: `Error: Plan not found` }] };
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
);

// ============================================================
// TOOL: Save Meal Plan
// ============================================================
server.tool(
    'save_meal_plan',
    'Save a new meal plan to the database',
    {
        name: z.string().describe('Name for the meal plan'),
        duration_days: z.number().describe('Number of days the plan covers'),
        plan_data: z.any().describe('The full meal plan data as JSON (days, meals, ingredients, macros)'),
        conditions: z.array(z.string()).optional().describe('Health conditions this plan accounts for'),
        calorie_target: z.number().optional().describe('Daily calorie target for this plan')
    },
    async (params) => {
        const user = await getFirstUser();
        const { data, error } = await supabase
            .from('meal_plans')
            .insert({
                user_id: user.id,
                name: params.name,
                duration_days: params.duration_days,
                plan_data: params.plan_data,
                conditions: params.conditions || [],
                calorie_target: params.calorie_target
            })
            .select()
            .single();

        if (error) return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
        return { content: [{ type: 'text', text: `Meal plan "${data.name}" saved!\nID: ${data.id}` }] };
    }
);

// ============================================================
// TOOL: Delete Meal Plan
// ============================================================
server.tool(
    'delete_meal_plan',
    'Delete a meal plan by ID',
    {
        plan_id: z.string().describe('The UUID of the meal plan to delete')
    },
    async ({ plan_id }) => {
        const user = await getFirstUser();
        const { error } = await supabase
            .from('meal_plans')
            .delete()
            .eq('id', plan_id)
            .eq('user_id', user.id);

        if (error) return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
        return { content: [{ type: 'text', text: `Meal plan deleted.` }] };
    }
);

// ============================================================
// TOOL: List Saved Meals
// ============================================================
server.tool(
    'list_saved_meals',
    'List all individually saved/bookmarked meals',
    {},
    async () => {
        const user = await getFirstUser();
        const { data, error } = await supabase
            .from('saved_meals')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
        if (!data || data.length === 0) {
            return { content: [{ type: 'text', text: 'No saved meals found.' }] };
        }

        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
);

// ============================================================
// TOOL: Save a Meal
// ============================================================
server.tool(
    'save_meal',
    'Bookmark/save an individual meal',
    {
        meal_name: z.string().describe('Name of the meal'),
        meal_type: z.string().describe('Type: breakfast, lunch, dinner, or snack'),
        meal_data: z.any().describe('Full meal data as JSON (ingredients, recipe, macros, calories)'),
        tags: z.array(z.string()).optional().describe('Tags for categorization')
    },
    async (params) => {
        const user = await getFirstUser();
        const { data, error } = await supabase
            .from('saved_meals')
            .insert({
                user_id: user.id,
                meal_name: params.meal_name,
                meal_type: params.meal_type,
                meal_data: params.meal_data,
                tags: params.tags || []
            })
            .select()
            .single();

        if (error) return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
        return { content: [{ type: 'text', text: `Meal "${data.meal_name}" saved!\nID: ${data.id}` }] };
    }
);

// ============================================================
// TOOL: Delete Saved Meal
// ============================================================
server.tool(
    'delete_saved_meal',
    'Remove a saved meal by ID',
    {
        meal_id: z.string().describe('The UUID of the saved meal to delete')
    },
    async ({ meal_id }) => {
        const user = await getFirstUser();
        const { error } = await supabase
            .from('saved_meals')
            .delete()
            .eq('id', meal_id)
            .eq('user_id', user.id);

        if (error) return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
        return { content: [{ type: 'text', text: `Saved meal deleted.` }] };
    }
);

// ============================================================
// TOOL: List Grocery Lists
// ============================================================
server.tool(
    'list_grocery_lists',
    'List all grocery/shopping lists',
    {},
    async () => {
        const user = await getFirstUser();
        const { data, error } = await supabase
            .from('grocery_lists')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
        if (!data || data.length === 0) {
            return { content: [{ type: 'text', text: 'No grocery lists found.' }] };
        }

        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
);

// ============================================================
// TOOL: Create Grocery List
// ============================================================
server.tool(
    'create_grocery_list',
    'Create a new grocery/shopping list',
    {
        items: z.array(z.object({
            name: z.string(),
            quantity: z.string().optional(),
            category: z.string().optional(),
            checked: z.boolean().optional()
        })).describe('List of grocery items'),
        meal_plan_id: z.string().optional().describe('Link to a meal plan ID if generated from one')
    },
    async (params) => {
        const user = await getFirstUser();
        const { data, error } = await supabase
            .from('grocery_lists')
            .insert({
                user_id: user.id,
                meal_plan_id: params.meal_plan_id || null,
                items: params.items
            })
            .select()
            .single();

        if (error) return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
        return { content: [{ type: 'text', text: `Grocery list created!\nID: ${data.id}\nItems: ${params.items.length}` }] };
    }
);

// ============================================================
// TOOL: Update Grocery List
// ============================================================
server.tool(
    'update_grocery_list',
    'Update items in a grocery list (e.g. check off items)',
    {
        list_id: z.string().describe('The UUID of the grocery list'),
        items: z.array(z.object({
            name: z.string(),
            quantity: z.string().optional(),
            category: z.string().optional(),
            checked: z.boolean().optional()
        })).describe('Updated list of grocery items')
    },
    async ({ list_id, items }) => {
        const user = await getFirstUser();
        const { data, error } = await supabase
            .from('grocery_lists')
            .update({ items })
            .eq('id', list_id)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
        return { content: [{ type: 'text', text: `Grocery list updated.` }] };
    }
);

// ============================================================
// TOOL: Delete Grocery List
// ============================================================
server.tool(
    'delete_grocery_list',
    'Delete a grocery list by ID',
    {
        list_id: z.string().describe('The UUID of the grocery list to delete')
    },
    async ({ list_id }) => {
        const user = await getFirstUser();
        const { error } = await supabase
            .from('grocery_lists')
            .delete()
            .eq('id', list_id)
            .eq('user_id', user.id);

        if (error) return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
        return { content: [{ type: 'text', text: `Grocery list deleted.` }] };
    }
);

// ============================================================
// TOOL: Check Allergies
// ============================================================
server.tool(
    'check_allergies',
    'Check if ingredients conflict with the user allergies or health conditions',
    {
        ingredients: z.array(z.string()).describe('List of ingredients to check')
    },
    async ({ ingredients }) => {
        const user = await getFirstUser();
        const { data: profile } = await supabase
            .from('health_profiles')
            .select('allergies, custom_allergies, conditions')
            .eq('user_id', user.id)
            .single();

        if (!profile) {
            return { content: [{ type: 'text', text: 'No health profile found — cannot check allergies.' }] };
        }

        const allAllergies = [...(profile.allergies || []), ...(profile.custom_allergies || [])];
        const conflicts = [];

        for (const ingredient of ingredients) {
            const lower = ingredient.toLowerCase();
            for (const allergy of allAllergies) {
                if (lower.includes(allergy.toLowerCase())) {
                    conflicts.push({ ingredient, allergy });
                }
            }
        }

        if (conflicts.length === 0) {
            return { content: [{ type: 'text', text: `✅ No allergy conflicts found.\nChecked against: ${allAllergies.join(', ') || 'none'}\nConditions: ${(profile.conditions || []).join(', ') || 'none'}` }] };
        }

        const warnings = conflicts.map(c => `⚠️ "${c.ingredient}" conflicts with allergy: ${c.allergy}`);
        return { content: [{ type: 'text', text: `ALLERGY CONFLICTS FOUND:\n${warnings.join('\n')}` }] };
    }
);

// ============================================================
// TOOL: Send Pushover Notification
// ============================================================
server.tool(
    'send_notification',
    'Send a push notification to the user phone via Pushover',
    {
        message: z.string().describe('The notification message'),
        title: z.string().optional().describe('Notification title (default: MediEat)')
    },
    async ({ message, title }) => {
        const body = new URLSearchParams({
            token: PUSHOVER_API_TOKEN,
            user: PUSHOVER_USER_KEY,
            message,
            title: title || 'MediEat'
        });

        const response = await fetch('https://api.pushover.net/1/messages.json', {
            method: 'POST',
            body
        });

        const result = await response.json();
        if (result.status === 1) {
            return { content: [{ type: 'text', text: `Notification sent: "${message}"` }] };
        }

        return { content: [{ type: 'text', text: `Failed to send notification: ${JSON.stringify(result)}` }] };
    }
);

// ============================================================
// START MCP SERVER
// ============================================================
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('MediEat MCP server running on stdio');
}

main().catch(console.error);
