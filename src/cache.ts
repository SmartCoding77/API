import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

export async function getCached(key: string): Promise<string | null> {
  return redis.get(key);
}

export async function setCached(key: string, value: string, ttlSec = 300) {
  await redis.set(key, value, 'EX', ttlSec);
}
