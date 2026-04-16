// ============================================================
// MedMeal Planner — Application Logic
// ============================================================

// State
let selectedConditions = [];
let selectedAllergies = [];
let customAllergies = [];
let favoriteFoods = [];
let macroGoals = [];
let macroTargets = { protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 }; // 0 = any
let selectedCuisines = [];
let calorieTarget = 2000;
let mealAlertTimes = JSON.parse(localStorage.getItem('mealAlertTimes') || '{"breakfast":"08:00","lunch":"12:30","dinner":"18:30","snack1":"15:30","snack2":"21:00"}');
let alertsEnabled = false;
let alertCheckInterval = null;
let firedToday = {};
let mealCount = 4; // 3 meals + 1 snack
let dietPreference = 'any';
let planDuration = 7;
let currentPlan = null;
let currentDay = 0;

// ============================================================
// ACCOUNT MODAL
// ============================================================
function openAccountModal() {
    const modal = document.getElementById('authModal');
    const content = document.getElementById('authModalContent');
    if (!modal || !content) return;

    if (typeof currentUser !== 'undefined' && currentUser) {
        content.innerHTML = `
            <h2>Your Account</h2>
            <p class="modal-sub">Signed in as <strong>${currentUser.email}</strong></p>
            <p class="modal-info">All your conditions, allergies, favorites, macro targets and current plan sync to your account automatically.</p>
            <button class="btn-primary-modal" onclick="manualSync()">&#8635; Sync Now</button>
            <button class="btn-secondary-modal" onclick="handleLogout()">Sign Out</button>
        `;
    } else {
        renderLoginForm();
    }
    modal.style.display = 'flex';
}

function closeAccountModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.style.display = 'none';
}

function renderLoginForm() {
    const content = document.getElementById('authModalContent');
    content.innerHTML = `
        <h2>Sign In</h2>
        <p class="modal-sub">Save your meal plans across devices.</p>
        <form id="loginForm" onsubmit="handleLogin(event)">
            <input type="email" id="loginEmail" placeholder="Email" required autocomplete="email">
            <input type="password" id="loginPassword" placeholder="Password" required autocomplete="current-password" minlength="6">
            <div id="authError" class="auth-error"></div>
            <button type="submit" class="btn-primary-modal">Sign In</button>
        </form>
        <div class="modal-divider"><span>or</span></div>
        <button class="btn-secondary-modal" onclick="renderSignupForm()">Create New Account</button>
    `;
}

function renderSignupForm() {
    const content = document.getElementById('authModalContent');
    content.innerHTML = `
        <h2>Create Account</h2>
        <p class="modal-sub">Free, no credit card required.</p>
        <form id="signupForm" onsubmit="handleSignup(event)">
            <input type="email" id="signupEmail" placeholder="Email" required autocomplete="email">
            <input type="password" id="signupPassword" placeholder="Password (min 6 chars)" required autocomplete="new-password" minlength="6">
            <div id="authError" class="auth-error"></div>
            <button type="submit" class="btn-primary-modal">Create Account</button>
        </form>
        <div class="modal-divider"><span>or</span></div>
        <button class="btn-secondary-modal" onclick="renderLoginForm()">Already Have an Account</button>
    `;
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('authError');
    errorEl.textContent = '';

    const result = await authLogIn(email, password);
    if (result.ok) {
        closeAccountModal();
    } else {
        errorEl.textContent = result.error;
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const errorEl = document.getElementById('authError');
    errorEl.textContent = '';

    const result = await authSignUp(email, password);
    if (result.ok) {
        const content = document.getElementById('authModalContent');
        content.innerHTML = `
            <h2>Check Your Email</h2>
            <p class="modal-sub">We sent a confirmation link to <strong>${email}</strong>.</p>
            <p class="modal-info">Click the link in your email to verify your account, then come back and sign in.</p>
            <button class="btn-primary-modal" onclick="renderLoginForm()">Back to Sign In</button>
        `;
    } else {
        errorEl.textContent = result.error;
    }
}

async function handleLogout() {
    await authLogOut();
    closeAccountModal();
}

async function manualSync() {
    if (typeof saveProfileToCloud === 'function') {
        await saveProfileToCloud();
        const content = document.getElementById('authModalContent');
        if (content) {
            const btn = content.querySelector('.btn-primary-modal');
            if (btn) {
                const original = btn.innerHTML;
                btn.innerHTML = '&#10003; Synced';
                setTimeout(() => { btn.innerHTML = original; }, 1500);
            }
        }
    }
}

// Hook to call after any state change. Defined as no-op until auth.js loads.
function syncIfLoggedIn() {
    if (typeof queueProfileSave === 'function') queueProfileSave();
}

// ============================================================
// INITIALIZATION
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    renderConditions();
    renderAllergies();
});

function renderConditions() {
    const grid = document.getElementById('conditionsGrid');
    grid.innerHTML = CONDITIONS.map(c => `
        <div class="condition-card" data-id="${c.id}" onclick="toggleCondition('${c.id}')">
            <span class="icon">${c.icon}</span>
            <span class="name">${c.name}</span>
            <span class="desc">${c.desc}</span>
        </div>
    `).join('');
}

function renderAllergies() {
    const grid = document.getElementById('allergiesGrid');
    grid.innerHTML = ALLERGIES.map(a => `
        <div class="allergy-card" data-id="${a.id}" onclick="toggleAllergy('${a.id}')">
            <span class="icon">${a.icon}</span>
            <span class="name">${a.name}</span>
        </div>
    `).join('');
}

// ============================================================
// SELECTIONS
// ============================================================
function toggleCondition(id) {
    const card = document.querySelector(`.condition-card[data-id="${id}"]`);
    if (selectedConditions.includes(id)) {
        selectedConditions = selectedConditions.filter(c => c !== id);
        card.classList.remove('selected');
    } else {
        selectedConditions.push(id);
        card.classList.add('selected');
    }
    syncIfLoggedIn();
}

function toggleAllergy(id) {
    const card = document.querySelector(`.allergy-card[data-id="${id}"]`);
    if (selectedAllergies.includes(id)) {
        selectedAllergies = selectedAllergies.filter(a => a !== id);
        card.classList.remove('selected');
    } else {
        selectedAllergies.push(id);
        card.classList.add('selected');
    }
    syncIfLoggedIn();
}

function addCustomAllergy() {
    const input = document.getElementById('customAllergy');
    const value = input.value.trim().toLowerCase();
    if (value && !customAllergies.includes(value)) {
        customAllergies.push(value);
        const grid = document.getElementById('allergiesGrid');
        const card = document.createElement('div');
        card.className = 'allergy-card selected';
        card.dataset.id = `custom_${value}`;
        card.innerHTML = `<span class="icon">&#9888;</span><span class="name">${value}</span>`;
        card.onclick = () => {
            customAllergies = customAllergies.filter(a => a !== value);
            card.remove();
            syncIfLoggedIn();
        };
        grid.appendChild(card);
        input.value = '';
        syncIfLoggedIn();
    }
}

// Handle Enter key for inputs
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && document.activeElement.id === 'customAllergy') {
        addCustomAllergy();
    }
    if (e.key === 'Enter' && document.activeElement.id === 'favFoodInput') {
        addFavoriteFood();
    }
});

// ============================================================
// FAVORITE FOODS
// ============================================================
function addFavoriteFood() {
    const input = document.getElementById('favFoodInput');
    const value = input.value.trim();
    if (value && !favoriteFoods.some(f => f.toLowerCase() === value.toLowerCase())) {
        favoriteFoods.push(value);
        renderFavoriteTags();
        input.value = '';
        syncIfLoggedIn();
    }
}

function quickAddFav(btn) {
    const value = btn.textContent.trim();
    if (!favoriteFoods.some(f => f.toLowerCase() === value.toLowerCase())) {
        favoriteFoods.push(value);
        btn.classList.add('added');
        btn.disabled = true;
        renderFavoriteTags();
        syncIfLoggedIn();
    }
}

function removeFavorite(food) {
    favoriteFoods = favoriteFoods.filter(f => f !== food);
    renderFavoriteTags();
    document.querySelectorAll('.suggestion-chip').forEach(chip => {
        if (chip.textContent.trim().toLowerCase() === food.toLowerCase()) {
            chip.classList.remove('added');
            chip.disabled = false;
        }
    });
    syncIfLoggedIn();
}

function renderFavoriteTags() {
    const container = document.getElementById('favoritesContainer');
    if (favoriteFoods.length === 0) {
        container.innerHTML = '<p class="no-favorites">No favorites added yet. Add foods you enjoy above!</p>';
        return;
    }
    container.innerHTML = favoriteFoods.map(food => `
        <span class="favorite-tag">
            ${food}
            <button class="remove-fav" onclick="removeFavorite('${food.replace(/'/g, "\\'")}')">&times;</button>
        </span>
    `).join('');
}

// ============================================================
// MACRO GOALS
// ============================================================
function toggleMacroGoal(goal, btn) {
    if (macroGoals.includes(goal)) {
        macroGoals = macroGoals.filter(g => g !== goal);
        btn.classList.remove('active');
    } else {
        macroGoals.push(goal);
        btn.classList.add('active');
    }
    syncIfLoggedIn();
}

// ============================================================
// CUISINE
// ============================================================
function toggleCuisine(cuisine, btn) {
    if (selectedCuisines.includes(cuisine)) {
        selectedCuisines = selectedCuisines.filter(c => c !== cuisine);
        btn.classList.remove('active');
    } else {
        selectedCuisines.push(cuisine);
        btn.classList.add('active');
    }
    syncIfLoggedIn();
}

// ============================================================
// MACRO SLIDERS
// ============================================================
function updateMacroSlider(macro) {
    const slider = document.getElementById(macro + 'Slider');
    const label = document.getElementById(macro + 'Value');
    const val = parseInt(slider.value);
    macroTargets[macro] = val;

    if (val === 0) {
        label.textContent = 'Any';
        label.style.color = 'var(--text-light)';
    } else {
        const unit = macro === 'sodium' ? 'mg' : 'g';
        const prefix = macro === 'sodium' ? 'Max ' : '';
        label.textContent = `${prefix}${val}${unit}/day`;
        label.style.color = 'var(--primary)';
    }
    syncIfLoggedIn();
}

// ============================================================
// PREFERENCES
// ============================================================
function updateCalorieLabel() {
    const slider = document.getElementById('calorieSlider');
    document.getElementById('calorieLabel').textContent = slider.value + ' kcal';
    calorieTarget = parseInt(slider.value);
    syncIfLoggedIn();
}

function setMealCount(count) {
    mealCount = count;
    document.querySelectorAll('.meal-count-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.count) === count);
    });
    syncIfLoggedIn();
}

function setDiet(diet) {
    dietPreference = diet;
    document.querySelectorAll('.diet-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.diet === diet);
    });
    syncIfLoggedIn();
}

function setDuration(days) {
    planDuration = days;
    document.querySelectorAll('.duration-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.days) === days);
    });
    syncIfLoggedIn();
}

// ============================================================
// NAVIGATION
// ============================================================
function goToStep(step) {
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    const stepMap = {
        1: 'step-conditions',
        2: 'step-allergies',
        3: 'step-favorites',
        4: 'step-preferences',
        5: 'step-results'
    };
    document.getElementById(stepMap[step]).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector(`.tab-btn[onclick="switchTab('${tab}')"]`).classList.add('active');
    document.getElementById(`tab-${tab}`).classList.add('active');
}

// ============================================================
// MEAL PLAN GENERATION
// ============================================================
function generateMealPlan() {
    currentPlan = [];

    for (let day = 0; day < planDuration; day++) {
        const dayPlan = generateDayPlan(day);
        currentPlan.push(dayPlan);
    }

    currentDay = 0;
    renderResults();
    goToStep(5);
    syncIfLoggedIn();
}

function generateDayPlan(daySeed) {
    const snackCount = mealCount - 3;

    const breakfastCals = calorieTarget * 0.25;
    const lunchCals = calorieTarget * 0.30;
    const dinnerCals = calorieTarget * 0.30;
    const snackCals = snackCount > 0 ? (calorieTarget * 0.15) / snackCount : 0;

    const breakfast = pickMeal('breakfast', breakfastCals, daySeed * 10 + 1);
    const lunch = pickMeal('lunch', lunchCals, daySeed * 10 + 2);
    const dinner = pickMeal('dinner', dinnerCals, daySeed * 10 + 3);
    const snacks = [];
    for (let i = 0; i < snackCount; i++) {
        snacks.push(pickMeal('snack', snackCals, daySeed * 10 + 4 + i));
    }

    return { breakfast, lunch, dinner, snacks };
}

function pickMeal(mealType, targetCals, seed) {
    let pool = [...MEALS[mealType]];

    // Filter by dietary preference
    if (dietPreference !== 'any') {
        const filtered = pool.filter(m => {
            if (dietPreference === 'vegetarian') return m.diet.includes('vegetarian') || m.diet.includes('vegan');
            if (dietPreference === 'vegan') return m.diet.includes('vegan');
            if (dietPreference === 'pescatarian') return m.diet.includes('pescatarian') || m.diet.includes('vegetarian') || m.diet.includes('vegan');
            return true;
        });
        if (filtered.length > 0) pool = filtered;
    }

    // Filter out allergens
    const allAllergens = [...selectedAllergies, ...customAllergies];
    if (allAllergens.length > 0) {
        const filtered = pool.filter(m => {
            const hasAllergen = m.allergens.some(a => allAllergens.includes(a));
            const hasCustom = customAllergies.some(ca =>
                m.ingredients.some(ing => ing.toLowerCase().includes(ca))
            );
            return !hasAllergen && !hasCustom;
        });
        if (filtered.length > 0) pool = filtered;
    }

    // Filter by conditions (prefer suitable, remove unsuitable)
    if (selectedConditions.length > 0) {
        let best = pool.filter(m =>
            selectedConditions.every(c => m.suitable.includes(c)) &&
            !selectedConditions.some(c => m.unsuitable.includes(c))
        );

        if (best.length === 0) {
            best = pool.filter(m =>
                selectedConditions.some(c => m.suitable.includes(c)) &&
                !selectedConditions.some(c => m.unsuitable.includes(c))
            );
        }

        if (best.length === 0) {
            best = pool.filter(m =>
                !selectedConditions.some(c => m.unsuitable.includes(c))
            );
        }

        if (best.length > 0) pool = best;
    }

    // Calculate per-meal targets from daily targets
    // Approximate: meals get proportional share based on type
    const mealShare = { breakfast: 0.25, lunch: 0.30, dinner: 0.30, snack: 0.15 / Math.max(1, mealCount - 3) };
    const share = mealShare[mealType] || 0.25;

    // Score each meal
    pool = pool.map(m => {
        let score = 0;

        // Calorie closeness (0-30 points)
        const calDiff = Math.abs(m.calories - targetCals);
        score += Math.max(0, 30 - calDiff / 10);

        // Cuisine bonus (0-80 points)
        if (selectedCuisines.length > 0 && m.cuisine) {
            if (selectedCuisines.includes(m.cuisine)) {
                score += 80;
            }
        }

        // Favorite foods bonus (0-50 points)
        if (favoriteFoods.length > 0) {
            const favMatches = favoriteFoods.filter(fav =>
                m.ingredients.some(ing => ing.toLowerCase().includes(fav.toLowerCase())) ||
                m.name.toLowerCase().includes(fav.toLowerCase())
            );
            score += favMatches.length * 25;
        }

        // Macro target scoring — heavily weighted (up to 100 points per macro)
        // Protein/Fiber: peak at target (small penalty for overshoot, larger for undershoot)
        // Carbs/Fat: symmetric closeness (over OR under is bad)
        // Sodium: hard ceiling (under = good, over = bad)
        if (macroTargets.protein > 0) {
            const perMealTarget = macroTargets.protein * share;
            const ratio = m.protein / perMealTarget;
            if (ratio >= 1) score += 100 - Math.min(50, (ratio - 1) * 30);
            else score += ratio * 100;
        }
        if (macroTargets.carbs > 0) {
            const perMealTarget = macroTargets.carbs * share;
            const ratio = m.carbs / perMealTarget;
            score += Math.max(0, 100 - Math.abs(1 - ratio) * 100);
        }
        if (macroTargets.fat > 0) {
            const perMealTarget = macroTargets.fat * share;
            const ratio = m.fat / perMealTarget;
            score += Math.max(0, 100 - Math.abs(1 - ratio) * 100);
        }
        if (macroTargets.fiber > 0) {
            const perMealTarget = macroTargets.fiber * share;
            const ratio = m.fiber / perMealTarget;
            if (ratio >= 1) score += 100 - Math.min(50, (ratio - 1) * 30);
            else score += ratio * 100;
        }
        if (macroTargets.sodium > 0) {
            const perMealMax = macroTargets.sodium * share;
            if (m.sodium <= perMealMax) score += 100;
            else score += Math.max(0, 100 - ((m.sodium - perMealMax) / perMealMax) * 200);
        }

        // Nutrient focus goals (tag-based)
        macroGoals.forEach(goal => {
            switch (goal) {
                case 'high_iron':
                    if (m.tags.includes('iron_rich')) score += 20;
                    break;
                case 'high_calcium':
                    if (m.tags.includes('calcium_rich')) score += 20;
                    break;
                case 'high_omega3':
                    if (m.tags.includes('omega3')) score += 20;
                    break;
            }
        });

        return { ...m, _score: score };
    });

    // Sort by score descending
    pool.sort((a, b) => b._score - a._score);

    // When strict macro targets are set, narrow the candidate pool aggressively
    const hasStrictTargets = Object.values(macroTargets).some(v => v > 0);
    const topN = hasStrictTargets ? 2 : Math.max(3, Math.floor(pool.length * 0.5));
    const topCandidates = pool.slice(0, topN);
    const index = Math.abs(hashSeed(seed)) % topCandidates.length;
    return topCandidates[index];
}

// Simple seed-based hash for variety between days
function hashSeed(seed) {
    let hash = seed;
    hash = ((hash << 5) - hash + Date.now() % 1000) | 0;
    hash = ((hash << 5) - hash + 127) | 0;
    return Math.abs(hash);
}

// ============================================================
// RENDERING RESULTS
// ============================================================
function renderResults() {
    renderSummary();
    renderDaySelector();
    renderMealPlan(0);
    renderNutrition();
    renderGroceryList();
    renderTips();
    renderAlerts();
}

function renderSummary() {
    const conditions = selectedConditions.map(id => CONDITIONS.find(c => c.id === id)?.name).filter(Boolean);
    let summary = conditions.length > 0
        ? `Tailored for: ${conditions.join(', ')}`
        : 'General healthy meal plan';
    if (favoriteFoods.length > 0) {
        summary += ` | Favorites: ${favoriteFoods.join(', ')}`;
    }
    if (macroGoals.length > 0) {
        const goalLabels = {
            high_iron: 'Iron Rich', high_calcium: 'Calcium Rich', high_omega3: 'Omega-3 Rich'
        };
        summary += ` | Goals: ${macroGoals.map(g => goalLabels[g]).join(', ')}`;
    }
    if (selectedCuisines.length > 0) {
        const cuisineLabels = {
            western: 'Western', mediterranean: 'Mediterranean', south_asian: 'South Asian',
            east_asian: 'East Asian', japanese: 'Japanese', korean: 'Korean',
            latin: 'Latin American', middle_eastern: 'Middle Eastern', african: 'African', caribbean: 'Caribbean'
        };
        summary += ` | Cuisines: ${selectedCuisines.map(c => cuisineLabels[c]).join(', ')}`;
    }
    document.getElementById('resultsSummary').textContent = `${planDuration}-day plan | ${calorieTarget} kcal/day | ${summary}`;
}

function renderDaySelector() {
    const container = document.getElementById('daySelector');
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date().getDay();

    container.innerHTML = currentPlan.map((_, i) => {
        const dayName = planDuration === 1 ? 'Today' : days[(today + i) % 7];
        return `<button class="day-btn ${i === 0 ? 'active' : ''}" onclick="showDay(${i})">${dayName}</button>`;
    }).join('');
}

function showDay(dayIndex) {
    currentDay = dayIndex;
    document.querySelectorAll('.day-btn').forEach((btn, i) => {
        btn.classList.toggle('active', i === dayIndex);
    });
    renderMealPlan(dayIndex);
}

function renderMealPlan(dayIndex) {
    const day = currentPlan[dayIndex];
    const container = document.getElementById('mealPlanContent');

    let html = '';

    const totalCals = day.breakfast.calories + day.lunch.calories + day.dinner.calories +
        day.snacks.reduce((sum, s) => sum + s.calories, 0);
    const totalProtein = day.breakfast.protein + day.lunch.protein + day.dinner.protein +
        day.snacks.reduce((sum, s) => sum + s.protein, 0);
    const totalCarbs = day.breakfast.carbs + day.lunch.carbs + day.dinner.carbs +
        day.snacks.reduce((sum, s) => sum + s.carbs, 0);
    const totalFat = day.breakfast.fat + day.lunch.fat + day.dinner.fat +
        day.snacks.reduce((sum, s) => sum + s.fat, 0);

    html += `
        <div class="daily-summary">
            <h3>Daily Totals</h3>
            <div class="summary-bars">
                ${makeSummaryBar('Calories', totalCals, calorieTarget, 'calories')}
                ${makeSummaryBar('Protein', totalProtein, calorieTarget * 0.25 / 4, 'protein')}
                ${makeSummaryBar('Carbs', totalCarbs, calorieTarget * 0.45 / 4, 'carbs')}
                ${makeSummaryBar('Fat', totalFat, calorieTarget * 0.30 / 9, 'fat')}
            </div>
        </div>
    `;

    html += renderMealCard('Breakfast', day.breakfast, false);
    html += renderMealCard('Lunch', day.lunch, false);
    html += renderMealCard('Dinner', day.dinner, false);
    day.snacks.forEach((snack, i) => {
        html += renderMealCard(`Snack ${day.snacks.length > 1 ? i + 1 : ''}`, snack, true);
    });

    container.innerHTML = html;
}

function makeSummaryBar(label, value, target, cls) {
    const percent = Math.min(100, (value / target) * 100);
    const unit = label === 'Calories' ? 'kcal' : 'g';
    return `
        <div class="summary-bar-row">
            <span class="summary-bar-label">${label}</span>
            <div class="summary-bar-track">
                <div class="summary-bar-fill ${cls}" style="width: ${percent}%"></div>
            </div>
            <span class="summary-bar-value">${Math.round(value)} ${unit}</span>
        </div>
    `;
}

function renderMealCard(type, meal, isSnack) {
    // Check if this meal contains any favorite foods
    const matchedFavs = favoriteFoods.filter(fav =>
        meal.ingredients.some(ing => ing.toLowerCase().includes(fav.toLowerCase())) ||
        meal.name.toLowerCase().includes(fav.toLowerCase())
    );

    // Get recipe if available
    const recipe = RECIPES[meal.name];
    const recipeId = 'recipe-' + meal.name.replace(/[^a-zA-Z0-9]/g, '-');

    let recipeHtml = '';
    if (recipe) {
        recipeHtml = `
            <button class="recipe-toggle" onclick="toggleRecipe('${recipeId}')">
                <span class="recipe-toggle-icon">&#9654;</span> How to Cook (Prep: ${recipe.prepTime} | Cook: ${recipe.cookTime} | Serves: ${recipe.servings})
            </button>
            <div class="recipe-section" id="${recipeId}">
                ${recipe.source ? `<div class="recipe-source">Recipe inspired by ${recipe.source}</div>` : ''}
                ${recipe.ingredientsList ? `
                    <div class="recipe-ingredients">
                        <h5>Ingredients</h5>
                        <ul>
                            ${recipe.ingredientsList.map(ing => `<li>${ing}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                <div class="recipe-instructions">
                    <h5>Instructions</h5>
                    <ol class="recipe-steps">
                        ${recipe.steps.map(step => `<li>${step}</li>`).join('')}
                    </ol>
                </div>
            </div>
        `;
    }

    return `
        <div class="meal-card ${isSnack ? 'snack' : ''} ${matchedFavs.length > 0 ? 'has-favorites' : ''}">
            <div class="meal-card-header">
                <span class="meal-type">${type}</span>
                <span class="meal-calories">${meal.calories} kcal</span>
            </div>
            ${matchedFavs.length > 0 ? `<div class="fav-match-badge">Contains your favorite: ${matchedFavs.join(', ')}</div>` : ''}
            <div class="meal-name">${meal.name} ${meal.cuisine && meal.cuisine !== 'western' ? `<span class="cuisine-label">${meal.cuisine.replace(/_/g, ' ')}</span>` : ''}</div>
            <div class="meal-description">${meal.description}</div>
            <div class="meal-macros">
                <div class="macro"><span class="macro-dot protein"></span> Protein: <span class="macro-value">${meal.protein}g</span></div>
                <div class="macro"><span class="macro-dot carbs"></span> Carbs: <span class="macro-value">${meal.carbs}g</span></div>
                <div class="macro"><span class="macro-dot fat"></span> Fat: <span class="macro-value">${meal.fat}g</span></div>
                <div class="macro"><span class="macro-dot fiber"></span> Fiber: <span class="macro-value">${meal.fiber}g</span></div>
                <div class="macro"><span class="macro-dot sodium"></span> Sodium: <span class="macro-value">${meal.sodium}mg</span></div>
            </div>
            <div class="meal-tags">
                ${meal.tags.map(t => `<span class="meal-tag">${t.replace(/_/g, ' ')}</span>`).join('')}
                ${meal.allergens.length > 0 ? meal.allergens.map(a => `<span class="meal-tag warning">contains ${a}</span>`).join('') : ''}
            </div>
            ${recipeHtml}
        </div>
    `;
}

function toggleRecipe(id) {
    const section = document.getElementById(id);
    const btn = section.previousElementSibling;
    const icon = btn.querySelector('.recipe-toggle-icon');
    section.classList.toggle('open');
    icon.innerHTML = section.classList.contains('open') ? '&#9660;' : '&#9654;';
}

// ============================================================
// NUTRITION TAB
// ============================================================
function renderNutrition() {
    const container = document.getElementById('nutritionContent');

    let totals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 };

    currentPlan.forEach(day => {
        const meals = [day.breakfast, day.lunch, day.dinner, ...day.snacks];
        meals.forEach(m => {
            totals.calories += m.calories;
            totals.protein += m.protein;
            totals.carbs += m.carbs;
            totals.fat += m.fat;
            totals.fiber += m.fiber;
            totals.sodium += m.sodium;
        });
    });

    const days = currentPlan.length;
    const avg = {
        calories: Math.round(totals.calories / days),
        protein: Math.round(totals.protein / days),
        carbs: Math.round(totals.carbs / days),
        fat: Math.round(totals.fat / days),
        fiber: Math.round(totals.fiber / days),
        sodium: Math.round(totals.sodium / days)
    };

    let html = `
        <div class="nutrition-overview">
            <div class="nutrition-stat"><div class="value">${avg.calories}</div><div class="label">Avg Calories/Day</div></div>
            <div class="nutrition-stat"><div class="value">${avg.protein}g</div><div class="label">Avg Protein/Day</div></div>
            <div class="nutrition-stat"><div class="value">${avg.carbs}g</div><div class="label">Avg Carbs/Day</div></div>
            <div class="nutrition-stat"><div class="value">${avg.fat}g</div><div class="label">Avg Fat/Day</div></div>
            <div class="nutrition-stat"><div class="value">${avg.fiber}g</div><div class="label">Avg Fiber/Day</div></div>
            <div class="nutrition-stat"><div class="value">${avg.sodium}mg</div><div class="label">Avg Sodium/Day</div></div>
        </div>
    `;

    // Macro targets feedback
    const hasTargets = Object.values(macroTargets).some(v => v > 0) || macroGoals.length > 0;
    if (hasTargets) {
        html += '<div class="condition-notes"><h3>Macro Targets vs Actual</h3>';

        const targetChecks = [
            { key: 'protein', label: 'Protein', unit: 'g', actual: avg.protein },
            { key: 'carbs', label: 'Carbs', unit: 'g', actual: avg.carbs },
            { key: 'fat', label: 'Fat', unit: 'g', actual: avg.fat },
            { key: 'fiber', label: 'Fiber', unit: 'g', actual: avg.fiber },
            { key: 'sodium', label: 'Sodium', unit: 'mg', actual: avg.sodium }
        ];

        targetChecks.forEach(({ key, label, unit, actual }) => {
            const target = macroTargets[key];
            if (target > 0) {
                const diff = actual - target;
                const pct = Math.round((actual / target) * 100);
                const isMax = key === 'sodium';
                let status, color;
                if (isMax) {
                    status = actual <= target ? 'Under limit' : `Over by ${Math.abs(Math.round(diff))}${unit}`;
                    color = actual <= target ? '#2d9c4a' : '#d63031';
                } else {
                    const closeness = Math.abs(pct - 100);
                    if (closeness <= 10) { status = 'On target'; color = '#2d9c4a'; }
                    else if (diff > 0) { status = `+${Math.round(diff)}${unit} over`; color = '#e8a317'; }
                    else { status = `${Math.round(diff)}${unit} under`; color = '#e8a317'; }
                }
                html += `<div class="condition-note">
                    <strong>${label}:</strong> Target ${isMax ? 'max ' : ''}${target}${unit}/day — Actual avg ${actual}${unit}/day
                    <span style="float:right; font-weight:700; color:${color}">${pct}% — ${status}</span>
                </div>`;
            }
        });

        macroGoals.forEach(goal => {
            let feedback = '';
            switch (goal) {
                case 'high_iron': feedback = 'Iron-rich meals have been prioritized. Pair with Vitamin C foods for better absorption.'; break;
                case 'high_calcium': feedback = 'Calcium-rich foods have been included. Aim for 1000-1200mg daily from food + supplements if needed.'; break;
                case 'high_omega3': feedback = 'Omega-3 rich foods (fatty fish, flaxseed, walnuts) have been prioritized for heart and brain health.'; break;
            }
            if (feedback) html += `<div class="condition-note">${feedback}</div>`;
        });

        html += '</div>';
    }

    // Condition-specific notes
    if (selectedConditions.length > 0) {
        html += '<div class="condition-notes"><h3>Dietary Notes for Your Conditions</h3>';
        selectedConditions.forEach(condId => {
            const rules = CONDITION_RULES[condId];
            const condition = CONDITIONS.find(c => c.id === condId);
            if (rules && rules.notes) {
                rules.notes.forEach(note => {
                    html += `<div class="condition-note"><strong>${condition.name}:</strong> ${note}</div>`;
                });
            }
        });
        html += '</div>';
    }

    container.innerHTML = html;
}

// ============================================================
// GSHOP INTEGRATION
// ============================================================
// GShop is a separate static React app that reads shopping lists from
// a base64-encoded ?share= URL parameter. No API calls, no shared secrets.
// Update this constant to point at your deployed GShop instance.
const GSHOP_URL = 'https://gurkiritsingh.github.io/GShop';

// Map MedMealPlanner pantry-style categories to GShop's GroceryCategory enum.
const GSHOP_CATEGORY_MAP = {
    proteins: 'meat_fish',
    vegetables: 'fruit_veg',
    fruits: 'fruit_veg',
    grains: 'bakery',
    dairy: 'dairy',
    nuts: 'snacks',
    pantry: 'tinned'
};

// Map MedMealPlanner allergies/diet to GShop dietary tags.
function buildGshopDietaryTags() {
    const tags = new Set();
    if (dietPreference === 'vegan') tags.add('vegan');
    if (dietPreference === 'vegetarian') { tags.add('vegetarian'); tags.add('vegan'); }
    const allergyToTag = { gluten: 'gluten_free', dairy: 'dairy_free', nuts: 'nut_free', peanuts: 'nut_free' };
    [...selectedAllergies, ...customAllergies].forEach(a => {
        if (allergyToTag[a]) tags.add(allergyToTag[a]);
    });
    return [...tags];
}

function buildGshopShareUrl() {
    if (!currentPlan) return null;

    // Aggregate ingredients across the whole plan, deduped by name+category
    const aggregate = new Map(); // key: "category|name" -> { n, q, c }
    currentPlan.forEach(day => {
        [day.breakfast, day.lunch, day.dinner, ...day.snacks].forEach(meal => {
            if (!meal.category_ingredients) return;
            Object.entries(meal.category_ingredients).forEach(([cat, items]) => {
                const gshopCat = GSHOP_CATEGORY_MAP[cat] || 'other';
                items.forEach(item => {
                    const key = gshopCat + '|' + item;
                    if (aggregate.has(key)) {
                        aggregate.get(key).q += 1;
                    } else {
                        aggregate.set(key, { n: item, q: 1, c: gshopCat });
                    }
                });
            });
        });
    });

    const items = [...aggregate.values()];
    const planName = `MedMeal ${planDuration}-day plan`;
    const data = {
        t: 'list',
        name: planName,
        items: items,
        d: buildGshopDietaryTags()
    };

    // Match GShop's encoding: btoa(unescape(encodeURIComponent(JSON.stringify(data))))
    const json = JSON.stringify(data);
    const encoded = btoa(unescape(encodeURIComponent(json)));
    return `${GSHOP_URL}/?share=${encoded}`;
}

function sendToGshop() {
    const url = buildGshopShareUrl();
    if (!url) {
        alert('Generate a meal plan first, then try again.');
        return;
    }
    window.open(url, '_blank', 'noopener');
}

function copyGshopLink() {
    const url = buildGshopShareUrl();
    if (!url) {
        alert('Generate a meal plan first, then try again.');
        return;
    }
    navigator.clipboard.writeText(url).then(() => {
        const btn = document.getElementById('copyGshopBtn');
        if (btn) {
            const original = btn.innerHTML;
            btn.innerHTML = '&#10003; Copied!';
            setTimeout(() => { btn.innerHTML = original; }, 1500);
        }
    }).catch(() => {
        prompt('Copy this link:', url);
    });
}

// ============================================================
// GROCERY LIST
// ============================================================
function renderGroceryList() {
    const container = document.getElementById('groceryContent');
    const categories = {};

    currentPlan.forEach(day => {
        const meals = [day.breakfast, day.lunch, day.dinner, ...day.snacks];
        meals.forEach(meal => {
            if (meal.category_ingredients) {
                Object.entries(meal.category_ingredients).forEach(([cat, items]) => {
                    if (!categories[cat]) categories[cat] = new Set();
                    items.forEach(item => categories[cat].add(item));
                });
            }
        });
    });

    const categoryIcons = {
        proteins: '\u{1F356}', vegetables: '\u{1F966}', fruits: '\u{1F34E}',
        grains: '\u{1F33E}', dairy: '\u{1F95B}', nuts: '\u{1F330}', pantry: '\u{1F3E0}'
    };

    const categoryNames = {
        proteins: 'Proteins', vegetables: 'Vegetables & Herbs', fruits: 'Fruits',
        grains: 'Grains & Breads', dairy: 'Dairy & Alternatives', nuts: 'Nuts & Seeds', pantry: 'Pantry Staples'
    };

    let html = `
        <div class="gshop-banner">
            <div class="gshop-banner-text">
                <strong>&#128722; Shop with GShop</strong>
                <p>Send this list to GShop to find nearby stores, compare prices, and check items off.</p>
            </div>
            <div class="gshop-banner-actions">
                <button class="btn-gshop-open" onclick="sendToGshop()">Open in GShop &rarr;</button>
                <button class="btn-gshop-copy" id="copyGshopBtn" onclick="copyGshopLink()">&#128279; Copy Link</button>
            </div>
        </div>
    `;

    Object.entries(categories).forEach(([cat, items]) => {
        html += `
            <div class="grocery-category">
                <h3>${categoryIcons[cat] || '\u{1F4CB}'} ${categoryNames[cat] || cat}</h3>
                ${[...items].sort().map(item => `
                    <div class="grocery-item" onclick="toggleGroceryItem(this)">
                        <div class="grocery-check"></div>
                        <span class="grocery-text">${item}</span>
                    </div>
                `).join('')}
            </div>
        `;
    });

    container.innerHTML = html;
}

function toggleGroceryItem(el) {
    el.classList.toggle('checked-off');
    const check = el.querySelector('.grocery-check');
    check.classList.toggle('checked');
    check.innerHTML = check.classList.contains('checked') ? '\u2713' : '';
}

// ============================================================
// HEALTH TIPS
// ============================================================
function renderTips() {
    const container = document.getElementById('tipsContent');
    let tips = [];

    tips.push({
        title: 'Stay Hydrated',
        text: 'Aim for 8-10 glasses of water daily. Proper hydration supports digestion, nutrient absorption, and overall health. Adjust intake based on activity level and climate.'
    });

    tips.push({
        title: 'Meal Prep for Success',
        text: 'Spending 1-2 hours on the weekend preparing ingredients can make healthy eating throughout the week much easier. Wash and chop vegetables, cook grains, and portion snacks in advance.'
    });

    selectedConditions.forEach(condId => {
        const condTips = HEALTH_TIPS[condId];
        if (condTips) {
            tips = tips.concat(condTips);
        }
    });

    if (selectedConditions.length === 0) {
        tips.push({
            title: 'Eat the Rainbow',
            text: 'Different colored fruits and vegetables contain different nutrients and antioxidants. Aim to include a variety of colors in your daily meals for optimal nutrition.'
        });
        tips.push({
            title: 'Mindful Eating',
            text: 'Eat slowly and without distractions. It takes about 20 minutes for your brain to register fullness. Paying attention to your food improves satisfaction and helps prevent overeating.'
        });
    }

    container.innerHTML = tips.map(tip => `
        <div class="tip-card">
            <h4>${tip.title}</h4>
            <p>${tip.text}</p>
        </div>
    `).join('');
}

// ============================================================
// MEAL ALERTS / NOTIFICATIONS
// ============================================================
function renderAlerts() {
    const container = document.getElementById('alertsContent');
    const snackCount = mealCount - 3;
    const permission = 'Notification' in window ? Notification.permission : 'unsupported';

    let permissionBadge = '';
    if (permission === 'unsupported') {
        permissionBadge = '<div class="alert-warning">Your browser does not support notifications.</div>';
    } else if (permission === 'denied') {
        permissionBadge = '<div class="alert-warning">Notifications are blocked. Please enable them in your browser settings.</div>';
    } else if (permission === 'default') {
        permissionBadge = '<button class="btn-enable-alerts" onclick="requestAlertPermission()">&#128276; Enable Notifications</button>';
    } else {
        permissionBadge = '<div class="alert-success">&#10003; Notifications enabled</div>';
    }

    let html = `
        <div class="alerts-intro">
            <h3>Set Your Meal Reminder Times</h3>
            <p>Get notified when it's time to eat. Set the time for each meal below.</p>
            ${permissionBadge}
        </div>
        <div class="alert-times">
            <div class="alert-row">
                <label>&#127859; Breakfast</label>
                <input type="time" value="${mealAlertTimes.breakfast}" onchange="updateMealTime('breakfast', this.value)">
            </div>
            <div class="alert-row">
                <label>&#127858; Lunch</label>
                <input type="time" value="${mealAlertTimes.lunch}" onchange="updateMealTime('lunch', this.value)">
            </div>
            <div class="alert-row">
                <label>&#127869; Dinner</label>
                <input type="time" value="${mealAlertTimes.dinner}" onchange="updateMealTime('dinner', this.value)">
            </div>
    `;

    if (snackCount >= 1) {
        html += `
            <div class="alert-row">
                <label>&#127857; Snack 1</label>
                <input type="time" value="${mealAlertTimes.snack1}" onchange="updateMealTime('snack1', this.value)">
            </div>
        `;
    }
    if (snackCount >= 2) {
        html += `
            <div class="alert-row">
                <label>&#127857; Snack 2</label>
                <input type="time" value="${mealAlertTimes.snack2}" onchange="updateMealTime('snack2', this.value)">
            </div>
        `;
    }

    html += `
        </div>
        <div class="alerts-actions">
            <button class="btn-start-alerts" onclick="startMealAlerts()">${alertsEnabled ? '&#9209; Stop Alerts' : '&#9658; Start Alerts'}</button>
            <button class="btn-test-alert" onclick="testNotification()">Test Notification</button>
        </div>
        <div class="alert-status" id="alertStatus">${alertsEnabled ? "Alerts are running. Today's notifications will fire at the times above." : 'Click "Start Alerts" to begin receiving meal reminders.'}</div>
        <div class="alert-note">
            <strong>Note:</strong> Meal alerts only run while this browser tab is open. For the best experience, leave this tab open in the background. Notifications also need to be enabled for this site.
        </div>
    `;

    container.innerHTML = html;
}

function updateMealTime(meal, value) {
    mealAlertTimes[meal] = value;
    localStorage.setItem('mealAlertTimes', JSON.stringify(mealAlertTimes));
    syncIfLoggedIn();
}

function requestAlertPermission() {
    if (!('Notification' in window)) return;
    Notification.requestPermission().then(perm => {
        renderAlerts();
    });
}

function testNotification() {
    if (!('Notification' in window)) {
        alert('Your browser does not support notifications.');
        return;
    }
    if (Notification.permission !== 'granted') {
        Notification.requestPermission().then(perm => {
            if (perm === 'granted') sendTestNotification();
        });
    } else {
        sendTestNotification();
    }
}

function sendTestNotification() {
    new Notification('MedMeal Planner', {
        body: 'Notifications are working! You\'ll get reminders at your scheduled meal times.',
        icon: ''
    });
}

function startMealAlerts() {
    if (alertsEnabled) {
        // Stop alerts
        if (alertCheckInterval) clearInterval(alertCheckInterval);
        alertCheckInterval = null;
        alertsEnabled = false;
        renderAlerts();
        return;
    }

    if (!('Notification' in window) || Notification.permission !== 'granted') {
        Notification.requestPermission().then(perm => {
            if (perm === 'granted') {
                alertsEnabled = true;
                firedToday = {};
                alertCheckInterval = setInterval(checkMealTimes, 30000); // check every 30s
                checkMealTimes(); // check immediately
                renderAlerts();
            }
        });
        return;
    }

    alertsEnabled = true;
    firedToday = {};
    alertCheckInterval = setInterval(checkMealTimes, 30000);
    checkMealTimes();
    renderAlerts();
}

function checkMealTimes() {
    if (!currentPlan || currentPlan.length === 0) return;

    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    const dateKey = now.toDateString();

    // Reset firedToday on a new day
    if (firedToday._date !== dateKey) {
        firedToday = { _date: dateKey };
    }

    // Use today's plan (day 0)
    const day = currentPlan[0];
    const mealMap = {
        breakfast: day.breakfast,
        lunch: day.lunch,
        dinner: day.dinner,
        snack1: day.snacks[0],
        snack2: day.snacks[1]
    };

    Object.entries(mealAlertTimes).forEach(([mealKey, scheduledTime]) => {
        const meal = mealMap[mealKey];
        if (!meal) return;
        if (firedToday[mealKey]) return;

        // Fire if current time matches scheduled time (within a 1-minute window)
        if (currentTime === scheduledTime) {
            const labels = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack1: 'Snack', snack2: 'Snack' };
            new Notification(`Time for ${labels[mealKey]}!`, {
                body: `${meal.name} (${meal.calories} kcal, ${meal.protein}g protein)`,
                icon: '',
                requireInteraction: false
            });
            firedToday[mealKey] = true;
        }
    });
}

// ============================================================
// EXPORT
// ============================================================
function exportPlan() {
    let text = '=== MEDMEAL PLANNER ===\n';
    text += `Generated: ${new Date().toLocaleDateString()}\n`;
    text += `Calorie Target: ${calorieTarget} kcal/day\n`;

    if (selectedConditions.length > 0) {
        text += `Conditions: ${selectedConditions.map(id => CONDITIONS.find(c => c.id === id)?.name).join(', ')}\n`;
    }
    if (selectedAllergies.length > 0) {
        text += `Allergies: ${selectedAllergies.join(', ')}${customAllergies.length > 0 ? ', ' + customAllergies.join(', ') : ''}\n`;
    }
    if (favoriteFoods.length > 0) {
        text += `Favorite Foods: ${favoriteFoods.join(', ')}\n`;
    }
    if (macroGoals.length > 0) {
        text += `Macro Goals: ${macroGoals.map(g => g.replace(/_/g, ' ')).join(', ')}\n`;
    }

    text += '\n';

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date().getDay();

    currentPlan.forEach((day, i) => {
        const dayName = planDuration === 1 ? 'Today' : days[(today + i) % 7];
        text += `\n--- ${dayName} ---\n\n`;

        const printMeal = (label, meal) => {
            text += `${label}: ${meal.name} (${meal.calories} kcal)\n`;
            text += `  ${meal.description}\n`;
            text += `  Protein: ${meal.protein}g | Carbs: ${meal.carbs}g | Fat: ${meal.fat}g | Fiber: ${meal.fiber}g | Sodium: ${meal.sodium}mg\n`;
            const recipe = RECIPES[meal.name];
            if (recipe) {
                text += `  Recipe (Prep: ${recipe.prepTime} | Cook: ${recipe.cookTime} | Serves: ${recipe.servings}):\n`;
                recipe.steps.forEach((step, i) => {
                    text += `    ${i + 1}. ${step}\n`;
                });
            }
            text += '\n';
        };

        printMeal('BREAKFAST', day.breakfast);
        printMeal('LUNCH', day.lunch);
        printMeal('DINNER', day.dinner);
        day.snacks.forEach((s, j) => printMeal(`SNACK ${j + 1}`, s));
    });

    text += '\n=== GROCERY LIST ===\n\n';
    const categories = {};
    currentPlan.forEach(day => {
        [day.breakfast, day.lunch, day.dinner, ...day.snacks].forEach(meal => {
            if (meal.category_ingredients) {
                Object.entries(meal.category_ingredients).forEach(([cat, items]) => {
                    if (!categories[cat]) categories[cat] = new Set();
                    items.forEach(item => categories[cat].add(item));
                });
            }
        });
    });
    Object.entries(categories).forEach(([cat, items]) => {
        text += `${cat.toUpperCase()}:\n`;
        [...items].sort().forEach(item => text += `  [ ] ${item}\n`);
        text += '\n';
    });

    text += '\n---\nDisclaimer: This is not medical advice. Consult your healthcare provider.\n';

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'MedMeal-Plan.txt';
    a.click();
    URL.revokeObjectURL(url);
}
