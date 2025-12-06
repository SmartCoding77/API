// src/middleware/rateLimit.ts
import Redis from 'ioredis';
import { Request, Response, NextFunction } from 'express';

const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

export function rateLimit({ windowSec = 60, max = 30, keyPrefix = 'rl' } = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
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

















