// Simulate meal picking and check if macro targets are hit
const fs = require('fs');
const path = require('path');

// Load database.js, replace const/let with var so assignments hit the global object
let dbCode = fs.readFileSync(path.join(__dirname, 'database.js'), 'utf8');
dbCode = dbCode.replace(/^const /gm, 'var ').replace(/^let /gm, 'var ');
eval.call(global, dbCode);
const MEALS = global.MEALS;

// Replicated pickMeal scoring logic from app.js
function pickMeal(mealType, targetCals, seed, state) {
    let pool = [...MEALS[mealType]];

    // Dietary filter
    if (state.dietPreference !== 'any') {
        const filtered = pool.filter(m => {
            if (state.dietPreference === 'vegetarian') return m.diet.includes('vegetarian') || m.diet.includes('vegan');
            if (state.dietPreference === 'vegan') return m.diet.includes('vegan');
            if (state.dietPreference === 'pescatarian') return m.diet.includes('pescatarian') || m.diet.includes('vegetarian') || m.diet.includes('vegan');
            return true;
        });
        if (filtered.length > 0) pool = filtered;
    }

    // Allergen filter
    const allAllergens = [...state.selectedAllergies];
    if (allAllergens.length > 0) {
        const filtered = pool.filter(m => !m.allergens.some(a => allAllergens.includes(a)));
        if (filtered.length > 0) pool = filtered;
    }

    // Condition filter
    if (state.selectedConditions.length > 0) {
        let best = pool.filter(m =>
            state.selectedConditions.every(c => m.suitable.includes(c)) &&
            !state.selectedConditions.some(c => m.unsuitable.includes(c))
        );
        if (best.length === 0) {
            best = pool.filter(m =>
                state.selectedConditions.some(c => m.suitable.includes(c)) &&
                !state.selectedConditions.some(c => m.unsuitable.includes(c))
            );
        }
        if (best.length === 0) {
            best = pool.filter(m => !state.selectedConditions.some(c => m.unsuitable.includes(c)));
        }
        if (best.length > 0) pool = best;
    }

    const mealShare = { breakfast: 0.25, lunch: 0.30, dinner: 0.30, snack: 0.15 / Math.max(1, state.mealCount - 3) };
    const share = mealShare[mealType] || 0.25;

    pool = pool.map(m => {
        let score = 0;
        const calDiff = Math.abs(m.calories - targetCals);
        score += Math.max(0, 30 - calDiff / 10);

        if (state.selectedCuisines.length > 0 && m.cuisine) {
            if (state.selectedCuisines.includes(m.cuisine)) score += 80;
        }

        if (state.favoriteFoods.length > 0) {
            const favMatches = state.favoriteFoods.filter(fav =>
                m.ingredients.some(ing => ing.toLowerCase().includes(fav.toLowerCase())) ||
                m.name.toLowerCase().includes(fav.toLowerCase())
            );
            score += favMatches.length * 25;
        }

        if (state.macroTargets.protein > 0) {
            const perMealTarget = state.macroTargets.protein * share;
            const ratio = m.protein / perMealTarget;
            if (ratio >= 1) score += 100 - Math.min(50, (ratio - 1) * 30);
            else score += ratio * 100;
        }
        if (state.macroTargets.carbs > 0) {
            const perMealTarget = state.macroTargets.carbs * share;
            const ratio = m.carbs / perMealTarget;
            score += Math.max(0, 100 - Math.abs(1 - ratio) * 100);
        }
        if (state.macroTargets.fat > 0) {
            const perMealTarget = state.macroTargets.fat * share;
            const ratio = m.fat / perMealTarget;
            score += Math.max(0, 100 - Math.abs(1 - ratio) * 100);
        }
        if (state.macroTargets.fiber > 0) {
            const perMealTarget = state.macroTargets.fiber * share;
            const ratio = m.fiber / perMealTarget;
            if (ratio >= 1) score += 100 - Math.min(50, (ratio - 1) * 30);
            else score += ratio * 100;
        }
        if (state.macroTargets.sodium > 0) {
            const perMealMax = state.macroTargets.sodium * share;
            if (m.sodium <= perMealMax) score += 100;
            else score += Math.max(0, 100 - ((m.sodium - perMealMax) / perMealMax) * 200);
        }

        return { ...m, _score: score };
    });

    pool.sort((a, b) => b._score - a._score);

    const hasStrictTargets = Object.values(state.macroTargets).some(v => v > 0);
    const topN = hasStrictTargets ? 2 : Math.max(3, Math.floor(pool.length * 0.5));
    const topCandidates = pool.slice(0, topN);
    const idx = seed % topCandidates.length;
    return topCandidates[idx];
}

function simulatePlan(state) {
    const snackCount = state.mealCount - 3;
    const bCals = state.calorieTarget * 0.25;
    const lCals = state.calorieTarget * 0.30;
    const dCals = state.calorieTarget * 0.30;
    const sCals = snackCount > 0 ? (state.calorieTarget * 0.15) / snackCount : 0;

    // Simulate 7 days
    const days = [];
    for (let d = 0; d < 7; d++) {
        const b = pickMeal('breakfast', bCals, d * 10 + 1, state);
        const l = pickMeal('lunch', lCals, d * 10 + 2, state);
        const dn = pickMeal('dinner', dCals, d * 10 + 3, state);
        const snacks = [];
        for (let i = 0; i < snackCount; i++) snacks.push(pickMeal('snack', sCals, d * 10 + 4 + i, state));
        days.push({ b, l, dn, snacks });
    }

    // Calculate averages
    let totals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 };
    days.forEach(day => {
        [day.b, day.l, day.dn, ...day.snacks].forEach(m => {
            totals.calories += m.calories;
            totals.protein += m.protein;
            totals.carbs += m.carbs;
            totals.fat += m.fat;
            totals.fiber += m.fiber;
            totals.sodium += m.sodium;
        });
    });
    const avg = {};
    Object.keys(totals).forEach(k => avg[k] = Math.round(totals[k] / 7));
    return avg;
}

function defaultState() {
    return {
        selectedConditions: [],
        selectedAllergies: [],
        favoriteFoods: [],
        macroGoals: [],
        macroTargets: { protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 },
        selectedCuisines: [],
        calorieTarget: 2000,
        mealCount: 4,
        dietPreference: 'any',
    };
}

function runTest(label, target) {
    const state = defaultState();
    Object.assign(state.macroTargets, target);
    const avg = simulatePlan(state);
    console.log('\n=== ' + label + ' ===');
    console.log('Target:', target);
    console.log('Actual avg/day:', avg);
    Object.entries(target).forEach(([k, tgt]) => {
        if (tgt === 0) return;
        const actual = avg[k];
        const pct = Math.round((actual / tgt) * 100);
        const isMax = k === 'sodium';
        let verdict;
        if (isMax) {
            verdict = actual <= tgt ? 'PASS (under limit)' : 'FAIL (over limit by ' + (actual - tgt) + ')';
        } else {
            const closeness = Math.abs(pct - 100);
            verdict = closeness <= 15 ? 'PASS' : (pct < 85 ? 'UNDER (' + pct + '%)' : 'OVER (' + pct + '%)');
        }
        console.log(`  ${k}: ${actual} / ${tgt}  [${pct}%]  ${verdict}`);
    });
}

console.log('Testing macro target reachability across scenarios...');

runTest('Protein 200g', { protein: 200 });
runTest('Protein 150g', { protein: 150 });
runTest('Protein 120g', { protein: 120 });
runTest('Fiber 30g', { fiber: 30 });
runTest('Fiber 40g', { fiber: 40 });
runTest('Low Carb 100g', { carbs: 100 });
runTest('Low Carb 150g', { carbs: 150 });
runTest('Low Fat 40g', { fat: 40 });
runTest('Low Sodium 1500mg', { sodium: 1500 });
runTest('Low Sodium 2000mg', { sodium: 2000 });
runTest('High Protein + Low Carb', { protein: 180, carbs: 120 });
runTest('Balanced athlete', { protein: 150, carbs: 250, fat: 60, fiber: 30 });
