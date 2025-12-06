"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimit = rateLimit;
// src/middleware/rateLimit.ts
const ioredis_1 = __importDefault(require("ioredis"));
const redis = new ioredis_1.default(process.env.REDIS_URL || 'redis://127.0.0.1:6379');
function rateLimit({ windowSec = 60, max = 30, keyPrefix = 'rl' } = {}) {
    return async (req, res, next) => {
        const key = `${keyPrefix}:${req.ip}`;
        const count = await redis.incr(key);
        if (count === 1) {
            await redis.expire(key, windowSec);
        }
        if (count > max) {
            return res.status(429).json({ error: 'Too many requests' });
        }
        next();
    };
}
