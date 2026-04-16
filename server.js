const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { supabase, supabaseAdmin } = require('./supabaseClient');
const { generateMealPlan, streamChat } = require('./ai-client');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================
// Auth Middleware — extracts user from Bearer token
// ============================================================
async function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = user;
    next();
}

// ============================================================
// AUTH ROUTES
// ============================================================

// Sign up
app.post('/api/auth/signup', async (req, res) => {
    const { email, password, display_name } = req.body;

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name } }
    });

    if (error) return res.status(400).json({ error: error.message });
    res.json({ user: data.user, session: data.session });
});

// Sign in
app.post('/api/auth/signin', async (req, res) => {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) return res.status(400).json({ error: error.message });
    res.json({ user: data.user, session: data.session });
});

// Sign out
app.post('/api/auth/signout', requireAuth, async (req, res) => {
    const { error } = await supabase.auth.signOut();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Signed out successfully' });
});

// Get current user
app.get('/api/auth/me', requireAuth, (req, res) => {
    res.json({ user: req.user });
});

// ============================================================
// PROFILE ROUTES
// ============================================================

// Get profile
app.get('/api/profile', requireAuth, async (req, res) => {
    const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', req.user.id)
        .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// Update profile
app.put('/api/profile', requireAuth, async (req, res) => {
    const { display_name, avatar_url } = req.body;

    const { data, error } = await supabaseAdmin
        .from('profiles')
        .update({ display_name, avatar_url, updated_at: new Date().toISOString() })
        .eq('id', req.user.id)
        .select()
        .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// ============================================================
// HEALTH PROFILE ROUTES
// ============================================================

// Get health profile
app.get('/api/health-profile', requireAuth, async (req, res) => {
    const { data, error } = await supabaseAdmin
        .from('health_profiles')
        .select('*')
        .eq('user_id', req.user.id)
        .single();

    if (error && error.code !== 'PGRST116') {
        return res.status(400).json({ error: error.message });
    }
    res.json(data || null);
});

// Create or update health profile (upsert)
app.put('/api/health-profile', requireAuth, async (req, res) => {
    const {
        conditions, allergies, custom_allergies, favorite_foods,
        diet_preference, calorie_target, meal_count, cuisines,
        macro_targets, macro_goals
    } = req.body;

    const { data, error } = await supabaseAdmin
        .from('health_profiles')
        .upsert({
            user_id: req.user.id,
            conditions: conditions || [],
            allergies: allergies || [],
            custom_allergies: custom_allergies || [],
            favorite_foods: favorite_foods || [],
            diet_preference: diet_preference || 'any',
            calorie_target: calorie_target || 2000,
            meal_count: meal_count || 4,
            cuisines: cuisines || [],
            macro_targets: macro_targets || {},
            macro_goals: macro_goals || [],
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
        .select()
        .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// ============================================================
// MEAL PLAN ROUTES
// ============================================================

// Get all meal plans
app.get('/api/meal-plans', requireAuth, async (req, res) => {
    const { data, error } = await supabaseAdmin
        .from('meal_plans')
        .select('*')
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// Get single meal plan
app.get('/api/meal-plans/:id', requireAuth, async (req, res) => {
    const { data, error } = await supabaseAdmin
        .from('meal_plans')
        .select('*')
        .eq('id', req.params.id)
        .eq('user_id', req.user.id)
        .single();

    if (error) return res.status(404).json({ error: 'Plan not found' });
    res.json(data);
});

// Save a meal plan
app.post('/api/meal-plans', requireAuth, async (req, res) => {
    const { name, duration_days, plan_data, conditions, calorie_target } = req.body;

    const { data, error } = await supabaseAdmin
        .from('meal_plans')
        .insert({
            user_id: req.user.id,
            name: name || 'Untitled Plan',
            duration_days,
            plan_data,
            conditions: conditions || [],
            calorie_target
        })
        .select()
        .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
});

// Delete a meal plan
app.delete('/api/meal-plans/:id', requireAuth, async (req, res) => {
    const { error } = await supabaseAdmin
        .from('meal_plans')
        .delete()
        .eq('id', req.params.id)
        .eq('user_id', req.user.id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Plan deleted' });
});

// ============================================================
// SAVED MEALS ROUTES
// ============================================================

// Get saved meals
app.get('/api/saved-meals', requireAuth, async (req, res) => {
    const { data, error } = await supabaseAdmin
        .from('saved_meals')
        .select('*')
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// Save a meal
app.post('/api/saved-meals', requireAuth, async (req, res) => {
    const { meal_name, meal_type, meal_data, tags } = req.body;

    const { data, error } = await supabaseAdmin
        .from('saved_meals')
        .insert({
            user_id: req.user.id,
            meal_name,
            meal_type,
            meal_data,
            tags: tags || []
        })
        .select()
        .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
});

// Delete a saved meal
app.delete('/api/saved-meals/:id', requireAuth, async (req, res) => {
    const { error } = await supabaseAdmin
        .from('saved_meals')
        .delete()
        .eq('id', req.params.id)
        .eq('user_id', req.user.id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Meal removed' });
});

// ============================================================
// GROCERY LIST ROUTES
// ============================================================

// Get grocery lists
app.get('/api/grocery-lists', requireAuth, async (req, res) => {
    const { data, error } = await supabaseAdmin
        .from('grocery_lists')
        .select('*')
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// Save grocery list
app.post('/api/grocery-lists', requireAuth, async (req, res) => {
    const { meal_plan_id, items } = req.body;

    const { data, error } = await supabaseAdmin
        .from('grocery_lists')
        .insert({
            user_id: req.user.id,
            meal_plan_id: meal_plan_id || null,
            items: items || []
        })
        .select()
        .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
});

// Update grocery list (check off items)
app.put('/api/grocery-lists/:id', requireAuth, async (req, res) => {
    const { items } = req.body;

    const { data, error } = await supabaseAdmin
        .from('grocery_lists')
        .update({ items })
        .eq('id', req.params.id)
        .eq('user_id', req.user.id)
        .select()
        .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// Delete grocery list
app.delete('/api/grocery-lists/:id', requireAuth, async (req, res) => {
    const { error } = await supabaseAdmin
        .from('grocery_lists')
        .delete()
        .eq('id', req.params.id)
        .eq('user_id', req.user.id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Grocery list deleted' });
});

// ============================================================
// AI ROUTES
// ============================================================

// AI availability check
app.get('/api/ai/status', (req, res) => {
    const hasKey = !!(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your-api-key-here');
    res.json({ available: hasKey });
});

// GShop AI Shopping Assistant (no Supabase auth — standalone endpoint)
app.post('/api/gshop/ai', async (req, res) => {
    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your-api-key-here') {
        return res.status(503).json({ error: 'AI not configured — add your ANTHROPIC_API_KEY to enable this feature' });
    }

    const { message, conversationHistory, dietaryFilters, allergens, budget } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    const userContext = [];
    if (dietaryFilters?.length) userContext.push(`Dietary filters: ${dietaryFilters.join(', ')}`);
    if (allergens?.length) userContext.push(`Allergens to avoid: ${allergens.join(', ')}`);
    if (budget) userContext.push(`Budget: £${budget}`);

    const systemMessages = [
        {
            type: 'text',
            text: `You are GShop's AI shopping assistant for UK grocery shopping. You help users plan meals, build shopping lists, and make smart grocery decisions.

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
- Keep item names UK-appropriate (e.g. "mince beef" not "ground beef", "coriander" not "cilantro")`,
            cache_control: { type: 'ephemeral' }
        }
    ];

    if (userContext.length > 0) {
        systemMessages.push({
            type: 'text',
            text: `USER PREFERENCES:\n${userContext.join('\n')}`,
            cache_control: { type: 'ephemeral' }
        });
    }

    const messages = [];
    if (conversationHistory?.length) {
        for (const msg of conversationHistory) {
            messages.push({ role: msg.role, content: msg.content });
        }
    }
    messages.push({ role: 'user', content: message });

    try {
        const Anthropic = require('@anthropic-ai/sdk');
        const anthropic = new Anthropic();

        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4096,
            system: systemMessages,
            messages
        });

        const text = response.content[0].text;

        let parsed;
        try {
            parsed = JSON.parse(text);
        } catch {
            const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (match) {
                parsed = JSON.parse(match[1].trim());
            } else {
                const start = text.indexOf('{');
                const end = text.lastIndexOf('}');
                if (start !== -1 && end !== -1) {
                    parsed = JSON.parse(text.slice(start, end + 1));
                } else {
                    parsed = { message: text };
                }
            }
        }

        res.json(parsed);
    } catch (err) {
        console.error('GShop AI error:', err);
        res.status(500).json({ error: 'AI request failed: ' + err.message });
    }
});

// Simple in-memory rate limiter: max 20 AI requests per user per hour
const aiRateLimits = new Map();
function checkAIRateLimit(userId) {
    const now = Date.now();
    const userLimits = aiRateLimits.get(userId) || [];
    const recent = userLimits.filter(t => now - t < 3600000);
    if (recent.length >= 20) return false;
    recent.push(now);
    aiRateLimits.set(userId, recent);
    return true;
}

// Generate AI meal plan
app.post('/api/ai/meal-plan', requireAuth, async (req, res) => {
    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your-api-key-here') {
        return res.status(503).json({ error: 'AI not configured — add your ANTHROPIC_API_KEY to enable this feature' });
    }

    if (!checkAIRateLimit(req.user.id)) {
        return res.status(429).json({ error: 'Rate limit exceeded. Try again in an hour.' });
    }

    const {
        conditions, allergies, customAllergies, favoriteFoods,
        dietPreference, calorieTarget, mealCount, cuisines,
        macroTargets, macroGoals, planDuration
    } = req.body;

    try {
        const plan = await generateMealPlan({
            conditions, allergies, customAllergies, favoriteFoods,
            dietPreference, calorieTarget, mealCount, cuisines,
            macroTargets, macroGoals, planDuration
        });
        res.json(plan);
    } catch (err) {
        console.error('AI meal plan error:', err);
        res.status(500).json({ error: 'Failed to generate AI meal plan. ' + err.message });
    }
});

// AI nutrition chat (streaming SSE)
app.post('/api/ai/chat', requireAuth, async (req, res) => {
    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your-api-key-here') {
        return res.status(503).json({ error: 'AI not configured — add your ANTHROPIC_API_KEY to enable this feature' });
    }

    if (!checkAIRateLimit(req.user.id)) {
        return res.status(429).json({ error: 'Rate limit exceeded. Try again in an hour.' });
    }

    const { messages, healthProfile } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Messages array is required' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    try {
        const stream = streamChat(messages, healthProfile || {});
        for await (const chunk of stream) {
            res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
        }
        res.write(`data: [DONE]\n\n`);
        res.end();
    } catch (err) {
        console.error('AI chat error:', err);
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
        res.end();
    }
});

// ============================================================
// START SERVER
// ============================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`MediEat API running on http://localhost:${PORT}`);
    console.log(`API docs: http://localhost:${PORT}/api`);
});
