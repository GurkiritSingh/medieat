// ============================================================
// Auth + profile sync layer.
// Wraps Supabase auth with rate limiting and persists the user's
// full app state (preferences + current plan) to a `profiles` row.
// ============================================================

let currentUser = null;
let isSyncing = false;

// ---------- Auth flows ----------

async function authSignUp(email, password) {
    const id = email.toLowerCase();
    const check = rlCheck('signup', id);
    if (!check.allowed) return { ok: false, error: check.message };

    try {
        const { data, error } = await supabaseClient.auth.signUp({ email, password });
        if (error) {
            rlRecord('signup', id, false);
            return { ok: false, error: cleanAuthError(error.message) };
        }
        rlRecord('signup', id, true);
        return { ok: true, data };
    } catch (e) {
        rlRecord('signup', id, false);
        return { ok: false, error: e.message || 'Sign up failed' };
    }
}

async function authLogIn(email, password) {
    const id = email.toLowerCase();
    const check = rlCheck('login', id);
    if (!check.allowed) return { ok: false, error: check.message };

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) {
            rlRecord('login', id, false);
            return { ok: false, error: cleanAuthError(error.message) };
        }
        rlRecord('login', id, true);
        return { ok: true, data };
    } catch (e) {
        rlRecord('login', id, false);
        return { ok: false, error: e.message || 'Login failed' };
    }
}

async function authLogOut() {
    await supabaseClient.auth.signOut();
    currentUser = null;
}

async function authResetPassword(email) {
    const id = email.toLowerCase();
    const check = rlCheck('reset', id);
    if (!check.allowed) return { ok: false, error: check.message };

    try {
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email);
        if (error) {
            rlRecord('reset', id, false);
            return { ok: false, error: cleanAuthError(error.message) };
        }
        rlRecord('reset', id, true);
        return { ok: true };
    } catch (e) {
        rlRecord('reset', id, false);
        return { ok: false, error: e.message || 'Reset failed' };
    }
}

function cleanAuthError(msg) {
    return msg
        .replace(/^Error:\s*/i, '')
        .replace(/AuthApiError:\s*/i, '')
        .trim();
}

// ---------- Profile sync ----------

// Snapshot the entire app state into a JSON-safe object.
function snapshotState() {
    return {
        conditions: selectedConditions,
        allergies: selectedAllergies,
        custom_allergies: customAllergies,
        favorite_foods: favoriteFoods,
        macro_goals: macroGoals,
        macro_targets: macroTargets,
        selected_cuisines: selectedCuisines,
        calorie_target: calorieTarget,
        meal_count: mealCount,
        diet_preference: dietPreference,
        plan_duration: planDuration,
        meal_alert_times: mealAlertTimes,
        current_plan: currentPlan
    };
}

// Apply a profile row back into app state (called after login).
function applySnapshot(row) {
    if (!row) return;
    if (Array.isArray(row.conditions)) selectedConditions = row.conditions;
    if (Array.isArray(row.allergies)) selectedAllergies = row.allergies;
    if (Array.isArray(row.custom_allergies)) customAllergies = row.custom_allergies;
    if (Array.isArray(row.favorite_foods)) favoriteFoods = row.favorite_foods;
    if (Array.isArray(row.macro_goals)) macroGoals = row.macro_goals;
    if (row.macro_targets && typeof row.macro_targets === 'object') macroTargets = row.macro_targets;
    if (Array.isArray(row.selected_cuisines)) selectedCuisines = row.selected_cuisines;
    if (typeof row.calorie_target === 'number') calorieTarget = row.calorie_target;
    if (typeof row.meal_count === 'number') mealCount = row.meal_count;
    if (typeof row.diet_preference === 'string') dietPreference = row.diet_preference;
    if (typeof row.plan_duration === 'number') planDuration = row.plan_duration;
    if (row.meal_alert_times && typeof row.meal_alert_times === 'object') {
        mealAlertTimes = row.meal_alert_times;
        try { localStorage.setItem('mealAlertTimes', JSON.stringify(mealAlertTimes)); } catch { /* ignore */ }
    }
    if (row.current_plan) currentPlan = row.current_plan;

    // Repaint visible step
    if (typeof renderConditions === 'function') {
        renderConditions();
        renderAllergies();
        // Restore selected condition cards
        selectedConditions.forEach(id => {
            const card = document.querySelector(`.condition-card[data-id="${id}"]`);
            if (card) card.classList.add('selected');
        });
        selectedAllergies.forEach(id => {
            const card = document.querySelector(`.allergy-card[data-id="${id}"]`);
            if (card) card.classList.add('selected');
        });
    }
    if (typeof renderFavoriteTags === 'function') renderFavoriteTags();
    if (currentPlan && typeof renderResults === 'function') {
        renderResults();
    }
}

async function loadProfileFromCloud() {
    if (!currentUser) return;
    isSyncing = true;
    try {
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .maybeSingle();
        if (error) {
            console.warn('Profile load failed:', error.message);
            return;
        }
        if (data) applySnapshot(data);
    } finally {
        isSyncing = false;
    }
}

let saveTimer = null;
function queueProfileSave() {
    if (!currentUser || isSyncing) return;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(saveProfileToCloud, 1000); // debounce 1s
}

async function saveProfileToCloud() {
    if (!currentUser) return;
    const snapshot = snapshotState();
    const row = { id: currentUser.id, ...snapshot, updated_at: new Date().toISOString() };
    const { error } = await supabaseClient.from('profiles').upsert(row);
    if (error) console.warn('Profile save failed:', error.message);
}

// ---------- Session bootstrap ----------

async function initAuth() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        currentUser = session.user;
        await loadProfileFromCloud();
    }
    updateAccountBadge();

    supabaseClient.auth.onAuthStateChange(async (event, session) => {
        currentUser = session ? session.user : null;
        updateAccountBadge();
        if (event === 'SIGNED_IN') {
            await loadProfileFromCloud();
        }
    });
}

function updateAccountBadge() {
    const badge = document.getElementById('accountBadge');
    if (!badge) return;
    if (currentUser) {
        const name = currentUser.email || 'Account';
        badge.innerHTML = `<span class="account-email">${name}</span><button class="btn-account" onclick="openAccountModal()">Account</button>`;
    } else {
        badge.innerHTML = `<button class="btn-account" onclick="openAccountModal()">&#128100; Sign in</button>`;
    }
}
