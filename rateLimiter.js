// ============================================================
// Client-side rate limiter for auth attempts.
// Persists state in localStorage with exponential backoff.
//
// NOTE: This is a usability + speed-bump layer, NOT a complete
// defence. The real protections are:
//   - Supabase's own auth throttling
//   - Row Level Security on the profiles table
//   - Rate limit policies in the Supabase dashboard (Auth > Rate Limits)
// ============================================================

const RL_PREFIX = 'medmeal-rl:';

const RL_LIMITS = {
    login: {
        maxAttempts: 5,
        windowMs: 60_000,         // 5 attempts per minute
        baseBlockMs: 30_000,      // 30s first block
        maxBlockMs: 30 * 60_000   // up to 30 minutes
    },
    signup: {
        maxAttempts: 3,
        windowMs: 10 * 60_000,    // 3 signups per 10 minutes per device
        baseBlockMs: 60_000,      // 1 minute first block
        maxBlockMs: 60 * 60_000   // up to 1 hour
    },
    reset: {
        maxAttempts: 3,
        windowMs: 10 * 60_000,
        baseBlockMs: 60_000,
        maxBlockMs: 30 * 60_000
    }
};

function rlLoad(key) {
    try {
        const raw = localStorage.getItem(RL_PREFIX + key);
        if (!raw) return { attempts: [], blockedUntil: 0, consecutiveBlocks: 0 };
        return JSON.parse(raw);
    } catch {
        return { attempts: [], blockedUntil: 0, consecutiveBlocks: 0 };
    }
}

function rlSave(key, state) {
    try {
        localStorage.setItem(RL_PREFIX + key, JSON.stringify(state));
    } catch { /* localStorage may be full */ }
}

function rlFormatDuration(ms) {
    if (ms < 1000) return 'a moment';
    const seconds = Math.ceil(ms / 1000);
    if (seconds < 60) return `${seconds} second${seconds === 1 ? '' : 's'}`;
    const minutes = Math.ceil(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'}`;
    const hours = Math.ceil(minutes / 60);
    return `${hours} hour${hours === 1 ? '' : 's'}`;
}

// Returns { allowed, retryAfterMs, message }
function rlCheck(action, identifier = 'default') {
    const config = RL_LIMITS[action];
    if (!config) return { allowed: true, retryAfterMs: 0, message: '' };
    const key = `${action}:${identifier}`;
    const state = rlLoad(key);
    const now = Date.now();

    if (state.blockedUntil > now) {
        const retryAfterMs = state.blockedUntil - now;
        return {
            allowed: false,
            retryAfterMs,
            message: `Too many attempts. Try again in ${rlFormatDuration(retryAfterMs)}.`
        };
    }

    const recent = state.attempts.filter(ts => now - ts < config.windowMs);
    if (recent.length >= config.maxAttempts) {
        const retryAfterMs = config.windowMs - (now - recent[0]);
        return {
            allowed: false,
            retryAfterMs,
            message: `Too many attempts. Try again in ${rlFormatDuration(retryAfterMs)}.`
        };
    }

    return { allowed: true, retryAfterMs: 0, message: '' };
}

// Record an attempt. success=true clears the counter.
function rlRecord(action, identifier = 'default', success = false) {
    const config = RL_LIMITS[action];
    if (!config) return;
    const key = `${action}:${identifier}`;

    if (success) {
        try { localStorage.removeItem(RL_PREFIX + key); } catch { /* ignore */ }
        return;
    }

    const state = rlLoad(key);
    const now = Date.now();
    state.attempts = state.attempts.filter(ts => now - ts < config.windowMs);
    state.attempts.push(now);

    if (state.attempts.length >= config.maxAttempts) {
        const blockMs = Math.min(
            config.baseBlockMs * Math.pow(2, state.consecutiveBlocks),
            config.maxBlockMs
        );
        state.blockedUntil = now + blockMs;
        state.consecutiveBlocks += 1;
        state.attempts = [];
    }

    rlSave(key, state);
}
