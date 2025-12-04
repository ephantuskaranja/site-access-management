"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordLimiter = resetPasswordLimiter;
const WINDOW_MS = 15 * 60 * 1000;
const MAX = 5;
const store = new Map();
function resetPasswordLimiter(req, res, next) {
    const user = req.user;
    const key = user?.id || user?.email || req.ip || 'anonymous';
    const now = Date.now();
    const entry = store.get(key);
    if (!entry || entry.resetAt <= now) {
        store.set(key, { count: 1, resetAt: now + WINDOW_MS });
        return next();
    }
    if (entry.count >= MAX) {
        const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
        res.setHeader('Retry-After', retryAfterSec.toString());
        return res.status(429).json({
            success: false,
            message: 'Too many password reset attempts. Please try again later.',
        });
    }
    entry.count += 1;
    store.set(key, entry);
    next();
}
//# sourceMappingURL=resetLimiter.js.map