// ============================================================
// MediEat — Direct Supabase Client (runs in browser)
// ============================================================

const SUPABASE_URL = 'https://qrswutkoygynhtzpxqfi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyc3d1dGtveWd5bmh0enB4cWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MjQ3MTcsImV4cCI6MjA5MDEwMDcxN30.ITBPc-Qm2LlSk4asrXUfor9JFSZ95iT3AYJ6Cm-vlPY';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const MediEatAPI = {

    // ========================================================
    // AUTH
    // ========================================================
    async signUp(email, password, displayName) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { display_name: displayName } }
        });
        if (error) throw new Error(error.message);
        return data;
    },

    async signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw new Error(error.message);
        return data;
    },

    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw new Error(error.message);
    },

    async getMe() {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw new Error(error.message);
        return { user };
    },

    isLoggedIn() {
        return !!supabase.auth.getSession();
    },

    async isLoggedInAsync() {
        const { data: { session } } = await supabase.auth.getSession();
        return !!session;
    },

    // ========================================================
    // HEALTH PROFILE
    // ========================================================
    async getHealthProfile() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('health_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') throw new Error(error.message);
        return data || null;
    },

    async saveHealthProfile(profile) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not logged in');

        const { data, error } = await supabase
            .from('health_profiles')
            .upsert({
                user_id: user.id,
                conditions: profile.conditions || [],
                allergies: profile.allergies || [],
                custom_allergies: profile.custom_allergies || [],
                favorite_foods: profile.favorite_foods || [],
                diet_preference: profile.diet_preference || 'any',
                calorie_target: profile.calorie_target || 2000,
                meal_count: profile.meal_count || 4,
                cuisines: profile.cuisines || [],
                macro_targets: profile.macro_targets || {},
                macro_goals: profile.macro_goals || [],
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    // ========================================================
    // MEAL PLANS
    // ========================================================
    async getMealPlans() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('meal_plans')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return data;
    },

    async getMealPlan(id) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not logged in');

        const { data, error } = await supabase
            .from('meal_plans')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

        if (error) throw new Error('Plan not found');
        return data;
    },

    async saveMealPlan(name, durationDays, planData, conditions, calorieTarget) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not logged in');

        const { data, error } = await supabase
            .from('meal_plans')
            .insert({
                user_id: user.id,
                name: name || 'Untitled Plan',
                duration_days: durationDays,
                plan_data: planData,
                conditions: conditions || [],
                calorie_target: calorieTarget
            })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    async deleteMealPlan(id) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not logged in');

        const { error } = await supabase
            .from('meal_plans')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) throw new Error(error.message);
    },

    // ========================================================
    // SAVED MEALS
    // ========================================================
    async getSavedMeals() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('saved_meals')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return data;
    },

    async saveMeal(mealName, mealType, mealData, tags) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not logged in');

        const { data, error } = await supabase
            .from('saved_meals')
            .insert({
                user_id: user.id,
                meal_name: mealName,
                meal_type: mealType,
                meal_data: mealData,
                tags: tags || []
            })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    async deleteSavedMeal(id) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not logged in');

        const { error } = await supabase
            .from('saved_meals')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) throw new Error(error.message);
    },

    // ========================================================
    // GROCERY LISTS
    // ========================================================
    async getGroceryLists() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('grocery_lists')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return data;
    },

    async saveGroceryList(items, mealPlanId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not logged in');

        const { data, error } = await supabase
            .from('grocery_lists')
            .insert({
                user_id: user.id,
                meal_plan_id: mealPlanId || null,
                items: items || []
            })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    async updateGroceryList(id, items) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not logged in');

        const { data, error } = await supabase
            .from('grocery_lists')
            .update({ items })
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    async deleteGroceryList(id) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not logged in');

        const { error } = await supabase
            .from('grocery_lists')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) throw new Error(error.message);
    }
};

window.MediEatAPI = MediEatAPI;
