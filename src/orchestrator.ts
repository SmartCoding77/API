import { Queue, Worker, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import { YouTubeAdapter } from './Adapter/youtubeAdapter';
import { TikTokAdapter } from './Adapter/tiktokAdapter';
// import { TwitterAdapter } from './Adapter/twitterAdapter';
import { FacebookAdapter } from './Adapter/facebookAdapter';
import { SnapchatAdapter } from './Adapter/snapchatAdapter';
import { InstagramAdapter } from './Adapter/instagramAdapter';
import { setCached, getCached } from './cache';
import { BaseRequest } from './types';

/* -------------------------------------------------------------------------- */
/* 🧠 REDIS CONNECTION                                                        */
/* -------------------------------------------------------------------------- */
const connection = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  // BullMQ v4+ best practice: prevent automatic retries inside Redis client
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

/* -------------------------------------------------------------------------- */
/* 🧩 QUEUE DEFINITION                                                        */
/* -------------------------------------------------------------------------- */
export const queue = new Queue('social-fetch', { connection });

// Optional: Log queue failures globally
const queueEvents = new QueueEvents('social-fetch', { connection });
queueEvents.on('failed', ({ jobId, failedReason }) => {
  console.error('❌ Queue job failed', jobId, failedReason);
});

/* -------------------------------------------------------------------------- */
/* 🌐 PLATFORM ADAPTER REGISTRY                                               */
/* -------------------------------------------------------------------------- */
export const adapters = {
  youtube: new YouTubeAdapter(process.env.YOUTUBE_API_KEY || ''),
  tiktok: new TikTokAdapter(),
  // twitter: new TwitterAdapter(),
  // x: new TwitterAdapter(), 
  facebook: new FacebookAdapter(),
  snapchat: new SnapchatAdapter(),
  instagram: new InstagramAdapter(),
};

/* -------------------------------------------------------------------------- */
/* 📨 ENQUEUE A JOB                                                           */
/* -------------------------------------------------------------------------- */
export async function enqueueFetch(payload: {
  req: BaseRequest & { platform: keyof typeof adapters };
  cacheKey: string;
  ttl?: number;
}) {
  return queue.add('fetch', payload, {
    attempts: 3,
    removeOnComplete: true,
    removeOnFail: false,
    backoff: { type: 'exponential', delay: 1500 },
  });
}

/* -------------------------------------------------------------------------- */
/* ⚙️ WORKER TO PROCESS JOBS                                                 */
/* -------------------------------------------------------------------------- */
export const worker = new Worker(
  'social-fetch',
  async job => {
    const { req, cacheKey, ttl = 300 } = job.data as {
      req: BaseRequest & { platform: keyof typeof adapters };
      cacheKey: string;
      ttl?: number;
    };

    // 1️⃣ Cache check before making network call
    const cached = await getCached(cacheKey);
    if (cached) return { cached: true, data: JSON.parse(cached) };

    // 2️⃣ Dynamic adapter selection
    const adapter = adapters[req.platform];
    if (!adapter) throw new Error(`Unsupported platform: ${req.platform}`);

    // 3️⃣ Fetch and cache result
    const resp = await adapter.fetch(req);
    await setCached(cacheKey, JSON.stringify(resp.data), ttl);

    return { cached: false, data: resp.data };
  },
  {
    connection,
    concurrency: Number(process.env.WORKER_CONCURRENCY || 4),
  }
);

/* -------------------------------------------------------------------------- */
/* 🚨 ERROR HANDLING                                                          */
/* -------------------------------------------------------------------------- */
worker.on('failed', (job, err) => {
  console.error(`⚠️ Worker job failed [${job?.id}]`, err.message);
});



// import { Queue, Worker, QueueEvents } from 'bullmq';
// import Redis from 'ioredis';
// import { YouTubeAdapter } from './Adapter/youtubeAdapter';
// import { setCached, getCached } from './cache';
// import { BaseRequest } from './types';

// // const connection = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

// const connection = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
//   maxRetriesPerRequest: null,
// });


// export const queue = new Queue('youtube-fetch', { connection });

// // v5: استخدم QueueEvents بدل QueueScheduler
// const queueEvents = new QueueEvents('youtube-fetch', { connection });
// queueEvents.on('failed', ({ jobId, failedReason }) => {
//   console.error('Job failed', jobId, failedReason);
// });

// const adapter = new YouTubeAdapter(process.env.YOUTUBE_API_KEY || '');

// export async function enqueueFetch(payload: { req: BaseRequest; cacheKey: string; ttl?: number }) {
//   return queue.add('fetch', payload, { attempts: 3, backoff: { type: 'exponential', delay: 1500 } });
// }

// export const worker = new Worker(
//   'youtube-fetch',
//   async job => {
//     const { req, cacheKey, ttl = 300 } = job.data as {
//       req: BaseRequest; cacheKey: string; ttl?: number;
//     };
//     const cached = await getCached(cacheKey);
//     if (cached) return { cached: true, data: JSON.parse(cached) };

//     const resp = await adapter.fetch(req);
//     await setCached(cacheKey, JSON.stringify(resp.data), ttl);
//     return { cached: false, data: resp.data };
//   },
//   { connection, concurrency: Number(process.env.WORKER_CONCURRENCY || 2) }
// );
