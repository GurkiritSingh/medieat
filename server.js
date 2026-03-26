const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { supabase, supabaseAdmin } = require('./supabaseClient');

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
// START SERVER
// ============================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`MediEat API running on http://localhost:${PORT}`);
    console.log(`API docs: http://localhost:${PORT}/api`);
});
