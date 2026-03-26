// ============================================================
// MediEat — Frontend API Client
// Drop this into your HTML: <script src="medieat-api.js"></script>
// ============================================================

const API_BASE = window.location.origin;

const MediEatAPI = {
    token: localStorage.getItem('medieat_token') || null,

    // -- Internal helpers --
    _headers() {
        const h = { 'Content-Type': 'application/json' };
        if (this.token) h['Authorization'] = `Bearer ${this.token}`;
        return h;
    },

    async _request(method, path, body = null) {
        const opts = { method, headers: this._headers() };
        if (body) opts.body = JSON.stringify(body);

        const res = await fetch(`${API_BASE}${path}`, opts);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Request failed');
        return data;
    },

    // ========================================================
    // AUTH
    // ========================================================
    async signUp(email, password, displayName) {
        const data = await this._request('POST', '/api/auth/signup', {
            email, password, display_name: displayName
        });
        if (data.session) {
            this.token = data.session.access_token;
            localStorage.setItem('medieat_token', this.token);
        }
        return data;
    },

    async signIn(email, password) {
        const data = await this._request('POST', '/api/auth/signin', {
            email, password
        });
        if (data.session) {
            this.token = data.session.access_token;
            localStorage.setItem('medieat_token', this.token);
        }
        return data;
    },

    async signOut() {
        await this._request('POST', '/api/auth/signout');
        this.token = null;
        localStorage.removeItem('medieat_token');
    },

    async getMe() {
        return this._request('GET', '/api/auth/me');
    },

    isLoggedIn() {
        return !!this.token;
    },

    // ========================================================
    // PROFILE
    // ========================================================
    async getProfile() {
        return this._request('GET', '/api/profile');
    },

    async updateProfile(displayName, avatarUrl) {
        return this._request('PUT', '/api/profile', {
            display_name: displayName, avatar_url: avatarUrl
        });
    },

    // ========================================================
    // HEALTH PROFILE
    // ========================================================
    async getHealthProfile() {
        return this._request('GET', '/api/health-profile');
    },

    async saveHealthProfile(profile) {
        // profile = { conditions, allergies, custom_allergies, favorite_foods,
        //             diet_preference, calorie_target, meal_count, cuisines,
        //             macro_targets, macro_goals }
        return this._request('PUT', '/api/health-profile', profile);
    },

    // ========================================================
    // MEAL PLANS
    // ========================================================
    async getMealPlans() {
        return this._request('GET', '/api/meal-plans');
    },

    async getMealPlan(id) {
        return this._request('GET', `/api/meal-plans/${id}`);
    },

    async saveMealPlan(name, durationDays, planData, conditions, calorieTarget) {
        return this._request('POST', '/api/meal-plans', {
            name, duration_days: durationDays, plan_data: planData,
            conditions, calorie_target: calorieTarget
        });
    },

    async deleteMealPlan(id) {
        return this._request('DELETE', `/api/meal-plans/${id}`);
    },

    // ========================================================
    // SAVED MEALS
    // ========================================================
    async getSavedMeals() {
        return this._request('GET', '/api/saved-meals');
    },

    async saveMeal(mealName, mealType, mealData, tags) {
        return this._request('POST', '/api/saved-meals', {
            meal_name: mealName, meal_type: mealType,
            meal_data: mealData, tags: tags || []
        });
    },

    async deleteSavedMeal(id) {
        return this._request('DELETE', `/api/saved-meals/${id}`);
    },

    // ========================================================
    // GROCERY LISTS
    // ========================================================
    async getGroceryLists() {
        return this._request('GET', '/api/grocery-lists');
    },

    async saveGroceryList(items, mealPlanId) {
        return this._request('POST', '/api/grocery-lists', {
            items, meal_plan_id: mealPlanId || null
        });
    },

    async updateGroceryList(id, items) {
        return this._request('PUT', `/api/grocery-lists/${id}`, { items });
    },

    async deleteGroceryList(id) {
        return this._request('DELETE', `/api/grocery-lists/${id}`);
    }
};

// Make globally available
window.MediEatAPI = MediEatAPI;
