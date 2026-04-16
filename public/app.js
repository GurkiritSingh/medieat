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
let mealCount = 4; // 3 meals + 1 snack
let dietPreference = 'any';
let planDuration = 7;
let genMethod = 'quick'; // 'ai' or 'quick' — defaults to quick until API key is configured
let currentPlan = null;
let currentDay = 0;

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
        };
        grid.appendChild(card);
        input.value = '';
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
    }
}

function quickAddFav(btn) {
    const value = btn.textContent.trim();
    if (!favoriteFoods.some(f => f.toLowerCase() === value.toLowerCase())) {
        favoriteFoods.push(value);
        btn.classList.add('added');
        btn.disabled = true;
        renderFavoriteTags();
    }
}

function removeFavorite(food) {
    favoriteFoods = favoriteFoods.filter(f => f !== food);
    renderFavoriteTags();
    // Re-enable the suggestion chip if it exists
    document.querySelectorAll('.suggestion-chip').forEach(chip => {
        if (chip.textContent.trim().toLowerCase() === food.toLowerCase()) {
            chip.classList.remove('added');
            chip.disabled = false;
        }
    });
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
}

// ============================================================
// PREFERENCES
// ============================================================
function updateCalorieLabel() {
    const slider = document.getElementById('calorieSlider');
    document.getElementById('calorieLabel').textContent = slider.value + ' kcal';
    calorieTarget = parseInt(slider.value);
}

function setMealCount(count) {
    mealCount = count;
    document.querySelectorAll('.meal-count-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.count) === count);
    });
}

function setDiet(diet) {
    dietPreference = diet;
    document.querySelectorAll('.diet-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.diet === diet);
    });
}

function setDuration(days) {
    planDuration = days;
    document.querySelectorAll('.duration-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.days) === days);
    });
}

function setGenMethod(method) {
    genMethod = method;
    document.querySelectorAll('.gen-method-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.method === method);
    });
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
    if (genMethod === 'ai') {
        generateAIMealPlan();
        return;
    }

    currentPlan = [];

    for (let day = 0; day < planDuration; day++) {
        const dayPlan = generateDayPlan(day);
        currentPlan.push(dayPlan);
    }

    currentDay = 0;
    renderResults();
    goToStep(5);
}

// ============================================================
// AI MEAL PLAN GENERATION
// ============================================================
async function generateAIMealPlan() {
    const overlay = document.getElementById('aiLoadingOverlay');
    overlay.classList.add('active');

    // Animate loading steps
    const steps = ['aiStep1', 'aiStep2', 'aiStep3'];
    let stepIndex = 0;
    const stepInterval = setInterval(() => {
        stepIndex++;
        if (stepIndex < steps.length) {
            document.getElementById(steps[stepIndex]).classList.add('active');
        }
    }, 3000);

    try {
        const token = (await supabase.auth.getSession())?.data?.session?.access_token;

        const response = await fetch('/api/ai/meal-plan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({
                conditions: selectedConditions,
                allergies: selectedAllergies,
                customAllergies: customAllergies,
                favoriteFoods: favoriteFoods,
                dietPreference: dietPreference,
                calorieTarget: calorieTarget,
                mealCount: mealCount,
                cuisines: selectedCuisines,
                macroTargets: macroTargets,
                macroGoals: macroGoals,
                planDuration: planDuration
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'AI generation failed');
        }

        const plan = await response.json();

        // Validate plan structure
        if (!Array.isArray(plan) || plan.length === 0) {
            throw new Error('Invalid plan format received');
        }

        // Ensure each day has the RECIPES structure for renderMealCard
        plan.forEach(day => {
            [day.breakfast, day.lunch, day.dinner, ...(day.snacks || [])].forEach(meal => {
                if (meal && meal.recipe) {
                    // Register the recipe in the global RECIPES object so renderMealCard can find it
                    if (typeof RECIPES !== 'undefined') {
                        RECIPES[meal.name] = meal.recipe;
                    }
                }
            });
        });

        currentPlan = plan;
        currentDay = 0;
        renderResults();
        goToStep(5);

        if (typeof showToast === 'function') {
            showToast('AI meal plan generated!');
        }
    } catch (err) {
        console.error('AI meal plan failed:', err);
        const isNotConfigured = err.message && (err.message.includes('not configured') || err.message.includes('API key'));
        if (typeof showToast === 'function') {
            showToast(isNotConfigured ? 'AI not configured yet — using quick generation' : 'AI unavailable, using quick generation');
        }
        // Fallback to algorithmic generation
        currentPlan = [];
        for (let day = 0; day < planDuration; day++) {
            currentPlan.push(generateDayPlan(day));
        }
        currentDay = 0;
        renderResults();
        goToStep(5);
    } finally {
        clearInterval(stepInterval);
        overlay.classList.remove('active');
    }
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
        // Uses relative scoring: the closer to target, the higher the score
        // When target is unreachable, still rewards the highest available value
        if (macroTargets.protein > 0) {
            const perMealTarget = macroTargets.protein * share;
            // Score based on how much protein relative to target (reward higher protein)
            score += Math.min(100, (m.protein / perMealTarget) * 100);
        }
        if (macroTargets.carbs > 0) {
            const perMealTarget = macroTargets.carbs * share;
            // For carbs, closer to target is better (not over, not under)
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
            score += Math.min(100, (m.fiber / perMealTarget) * 100);
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

    // Take top candidates and pick pseudo-randomly based on seed
    const topCandidates = pool.slice(0, Math.max(3, Math.floor(pool.length * 0.5)));
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
                <ol class="recipe-steps">
                    ${recipe.steps.map(step => `<li>${step}</li>`).join('')}
                </ol>
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

    let html = '';
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
