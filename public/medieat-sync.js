// ============================================================
// MediEat — Supabase Sync (Auth + Cloud Save/Load)
// ============================================================

let authMode = 'signin'; // 'signin' or 'signup'

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================
function showToast(message) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ============================================================
// AUTH MODAL
// ============================================================
function openAuthModal() {
    document.getElementById('authModal').classList.add('active');
    document.getElementById('authEmail').focus();
}

function closeAuthModal() {
    document.getElementById('authModal').classList.remove('active');
    document.getElementById('authError').style.display = 'none';
    document.getElementById('authForm').reset();
}

function toggleAuthMode(e) {
    e.preventDefault();
    authMode = authMode === 'signin' ? 'signup' : 'signin';

    document.getElementById('authModalTitle').textContent =
        authMode === 'signin' ? 'Sign In' : 'Create Account';
    document.getElementById('authModalSubtitle').textContent =
        authMode === 'signin' ? 'Save your plans and sync across devices' : 'Start saving your personalized meal plans';
    document.getElementById('authSubmitBtn').textContent =
        authMode === 'signin' ? 'Sign In' : 'Create Account';
    document.getElementById('authSwitchText').textContent =
        authMode === 'signin' ? "Don't have an account?" : 'Already have an account?';
    document.getElementById('authSwitchLink').textContent =
        authMode === 'signin' ? 'Sign Up' : 'Sign In';
    document.getElementById('nameField').style.display =
        authMode === 'signup' ? 'block' : 'none';
    document.getElementById('authError').style.display = 'none';
}

async function handleAuth(e) {
    e.preventDefault();
    const btn = document.getElementById('authSubmitBtn');
    const errorEl = document.getElementById('authError');

    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;
    const name = document.getElementById('authName').value.trim();

    btn.disabled = true;
    btn.textContent = authMode === 'signin' ? 'Signing in...' : 'Creating account...';
    errorEl.style.display = 'none';

    try {
        if (authMode === 'signup') {
            await MediEatAPI.signUp(email, password, name || 'User');
            showToast('Account created! Welcome to MediEat');
        } else {
            await MediEatAPI.signIn(email, password);
            showToast('Welcome back!');
        }

        closeAuthModal();
        updateAuthUI(true, name || email.split('@')[0]);
        loadHealthProfile();
    } catch (err) {
        errorEl.textContent = err.message;
        errorEl.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.textContent = authMode === 'signin' ? 'Sign In' : 'Create Account';
    }
}

async function handleSignOut() {
    try {
        await MediEatAPI.signOut();
        updateAuthUI(false);
        showToast('Signed out');
    } catch (err) {
        showToast('Error signing out');
    }
}

function updateAuthUI(loggedIn, name) {
    document.getElementById('authBarLoggedOut').style.display = loggedIn ? 'none' : 'block';
    document.getElementById('authBarLoggedIn').style.display = loggedIn ? 'flex' : 'none';
    if (loggedIn && name) {
        document.getElementById('userGreeting').textContent = 'Hi, ' + name;
    }
}

// ============================================================
// HEALTH PROFILE SYNC
// ============================================================
async function loadHealthProfile() {
    if (!MediEatAPI.isLoggedIn()) return;

    try {
        const profile = await MediEatAPI.getHealthProfile();
        if (!profile) return;

        // Restore state from saved profile
        if (profile.conditions && profile.conditions.length > 0) {
            selectedConditions = profile.conditions;
            document.querySelectorAll('.condition-card').forEach(card => {
                card.classList.toggle('selected', selectedConditions.includes(card.dataset.id));
            });
        }

        if (profile.allergies && profile.allergies.length > 0) {
            selectedAllergies = profile.allergies;
            document.querySelectorAll('.allergy-card').forEach(card => {
                card.classList.toggle('selected', selectedAllergies.includes(card.dataset.id));
            });
        }

        if (profile.custom_allergies) customAllergies = profile.custom_allergies;
        if (profile.favorite_foods) {
            favoriteFoods = profile.favorite_foods;
            renderFavoriteTags();
        }

        if (profile.diet_preference) {
            dietPreference = profile.diet_preference;
            document.querySelectorAll('.diet-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.diet === dietPreference);
            });
        }

        if (profile.calorie_target) {
            calorieTarget = profile.calorie_target;
            const slider = document.getElementById('calorieSlider');
            if (slider) {
                slider.value = calorieTarget;
                document.getElementById('calorieLabel').textContent = calorieTarget + ' kcal';
            }
        }

        if (profile.meal_count) {
            mealCount = profile.meal_count;
            document.querySelectorAll('.meal-count-btn').forEach(btn => {
                btn.classList.toggle('active', parseInt(btn.dataset.count) === mealCount);
            });
        }

        if (profile.cuisines) {
            selectedCuisines = profile.cuisines;
            document.querySelectorAll('.cuisine-btn').forEach(btn => {
                btn.classList.toggle('active', selectedCuisines.includes(btn.dataset.cuisine));
            });
        }

        if (profile.macro_targets) {
            macroTargets = profile.macro_targets;
            ['protein', 'carbs', 'fat', 'fiber', 'sodium'].forEach(macro => {
                const slider = document.getElementById(macro + 'Slider');
                if (slider && macroTargets[macro] !== undefined) {
                    slider.value = macroTargets[macro];
                    updateMacroSlider(macro);
                }
            });
        }

        if (profile.macro_goals) {
            macroGoals = profile.macro_goals;
            document.querySelectorAll('.macro-goal-btn').forEach(btn => {
                btn.classList.toggle('active', macroGoals.includes(btn.dataset.goal));
            });
        }

        showToast('Profile loaded from cloud');
    } catch (err) {
        console.error('Failed to load health profile:', err);
    }
}

async function saveHealthProfile() {
    if (!MediEatAPI.isLoggedIn()) return;

    try {
        await MediEatAPI.saveHealthProfile({
            conditions: selectedConditions,
            allergies: selectedAllergies,
            custom_allergies: customAllergies,
            favorite_foods: favoriteFoods,
            diet_preference: dietPreference,
            calorie_target: calorieTarget,
            meal_count: mealCount,
            cuisines: selectedCuisines,
            macro_targets: macroTargets,
            macro_goals: macroGoals
        });
    } catch (err) {
        console.error('Failed to save health profile:', err);
    }
}

// ============================================================
// MEAL PLAN CLOUD SAVE/LOAD
// ============================================================
async function savePlanToCloud() {
    if (!MediEatAPI.isLoggedIn()) {
        openAuthModal();
        return;
    }

    if (!currentPlan) {
        showToast('Generate a plan first');
        return;
    }

    const btn = document.querySelector('.btn-save-plan');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    try {
        // Auto-save health profile whenever a plan is saved
        await saveHealthProfile();

        const conditionNames = selectedConditions
            .map(id => CONDITIONS.find(c => c.id === id)?.name)
            .filter(Boolean);

        const planName = conditionNames.length > 0
            ? `${conditionNames.join(', ')} Plan`
            : `${calorieTarget}kcal ${planDuration}-Day Plan`;

        await MediEatAPI.saveMealPlan(
            planName,
            planDuration,
            currentPlan,
            selectedConditions,
            calorieTarget
        );

        showToast('Plan saved to cloud!');
    } catch (err) {
        showToast('Failed to save: ' + err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = '\u2601 Save to Cloud';
    }
}

// ============================================================
// SAVED PLANS MODAL
// ============================================================
function openSavedPlansModal() {
    document.getElementById('savedPlansModal').classList.add('active');
    loadSavedPlans();
}

function closeSavedPlansModal() {
    document.getElementById('savedPlansModal').classList.remove('active');
}

async function loadSavedPlans() {
    const container = document.getElementById('savedPlansList');
    container.innerHTML = '<p class="loading-text">Loading your plans...</p>';

    try {
        const plans = await MediEatAPI.getMealPlans();

        if (!plans || plans.length === 0) {
            container.innerHTML = '<p class="no-plans-text">No saved plans yet. Generate a meal plan and save it!</p>';
            return;
        }

        container.innerHTML = plans.map(plan => {
            const date = new Date(plan.created_at).toLocaleDateString();
            const conditions = (plan.conditions || []).join(', ') || 'General';
            return `
                <div class="saved-plan-card">
                    <div class="saved-plan-info">
                        <h4>${escapeHtml(plan.name)}</h4>
                        <p>${plan.duration_days} days | ${plan.calorie_target || '?'} kcal | ${conditions} | ${date}</p>
                    </div>
                    <div class="saved-plan-actions">
                        <button class="btn-load-plan" onclick="loadPlanFromCloud('${plan.id}')">Load</button>
                        <button class="btn-delete-plan" onclick="deletePlanFromCloud('${plan.id}')">Delete</button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {
        container.innerHTML = '<p class="loading-text">Failed to load plans. Try again.</p>';
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function loadPlanFromCloud(planId) {
    try {
        const plan = await MediEatAPI.getMealPlan(planId);

        if (plan && plan.plan_data) {
            currentPlan = plan.plan_data;
            planDuration = plan.duration_days || currentPlan.length;
            if (plan.calorie_target) calorieTarget = plan.calorie_target;
            if (plan.conditions) selectedConditions = plan.conditions;

            currentDay = 0;
            renderResults();
            goToStep(5);
            closeSavedPlansModal();
            showToast('Plan loaded!');
        }
    } catch (err) {
        showToast('Failed to load plan');
    }
}

async function deletePlanFromCloud(planId) {
    if (!confirm('Delete this plan?')) return;

    try {
        await MediEatAPI.deleteMealPlan(planId);
        showToast('Plan deleted');
        loadSavedPlans(); // Refresh the list
    } catch (err) {
        showToast('Failed to delete plan');
    }
}

// ============================================================
// AUTO-SAVE on Generate (hook into existing generateMealPlan)
// ============================================================
const _originalGenerateMealPlan = window.generateMealPlan;
window.generateMealPlan = function() {
    _originalGenerateMealPlan();
    // Auto-save health profile when generating
    saveHealthProfile();
};

// ============================================================
// INIT — check login state on page load
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    if (MediEatAPI.isLoggedIn()) {
        try {
            const { user } = await MediEatAPI.getMe();
            const name = user.user_metadata?.display_name || user.email?.split('@')[0] || 'User';
            updateAuthUI(true, name);
            loadHealthProfile();
        } catch (err) {
            // Token expired
            MediEatAPI.token = null;
            localStorage.removeItem('medieat_token');
            updateAuthUI(false);
        }
    }
});

// Close modals on backdrop click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.remove('active');
        }
    });
});
