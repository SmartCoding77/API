"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.worker = exports.adapters = exports.queue = void 0;
exports.enqueueFetch = enqueueFetch;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const youtubeAdapter_1 = require("./Adapter/youtubeAdapter");
const tiktokAdapter_1 = require("./Adapter/tiktokAdapter");
// import { TwitterAdapter } from './Adapter/twitterAdapter';
const facebookAdapter_1 = require("./Adapter/facebookAdapter");
const snapchatAdapter_1 = require("./Adapter/snapchatAdapter");
const instagramAdapter_1 = require("./Adapter/instagramAdapter");
const cache_1 = require("./cache");
/* -------------------------------------------------------------------------- */
/* 🧠 REDIS CONNECTION                                                        */
/* -------------------------------------------------------------------------- */
const connection = new ioredis_1.default(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
    // BullMQ v4+ best practice: prevent automatic retries inside Redis client
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
});
/* -------------------------------------------------------------------------- */
/* 🧩 QUEUE DEFINITION                                                        */
/* -------------------------------------------------------------------------- */
exports.queue = new bullmq_1.Queue('social-fetch', { connection });
// Optional: Log queue failures globally
const queueEvents = new bullmq_1.QueueEvents('social-fetch', { connection });
queueEvents.on('failed', ({ jobId, failedReason }) => {
    console.error('❌ Queue job failed', jobId, failedReason);
});
/* -------------------------------------------------------------------------- */
/* 🌐 PLATFORM ADAPTER REGISTRY                                               */
/* -------------------------------------------------------------------------- */
exports.adapters = {
    youtube: new youtubeAdapter_1.YouTubeAdapter(process.env.YOUTUBE_API_KEY || ''),
    tiktok: new tiktokAdapter_1.TikTokAdapter(),
    // twitter: new TwitterAdapter(),
    // x: new TwitterAdapter(), 
    facebook: new facebookAdapter_1.FacebookAdapter(),
    snapchat: new snapchatAdapter_1.SnapchatAdapter(),
    instagram: new instagramAdapter_1.InstagramAdapter(),
};
/* -------------------------------------------------------------------------- */
/* 📨 ENQUEUE A JOB                                                           */
/* -------------------------------------------------------------------------- */
async function enqueueFetch(payload) {
    return exports.queue.add('fetch', payload, {
        attempts: 3,
        removeOnComplete: true,
        removeOnFail: false,
        backoff: { type: 'exponential', delay: 1500 },
    });
}
/* -------------------------------------------------------------------------- */
/* ⚙️ WORKER TO PROCESS JOBS                                                 */
/* -------------------------------------------------------------------------- */
exports.worker = new bullmq_1.Worker('social-fetch', async (job) => {
    const { req, cacheKey, ttl = 300 } = job.data;
    // 1️⃣ Cache check before making network call
    const cached = await (0, cache_1.getCached)(cacheKey);
    if (cached)
        return { cached: true, data: JSON.parse(cached) };
    // 2️⃣ Dynamic adapter selection
    const adapter = exports.adapters[req.platform];
    if (!adapter)
        throw new Error(`Unsupported platform: ${req.platform}`);
    // 3️⃣ Fetch and cache result
    const resp = await adapter.fetch(req);
    await (0, cache_1.setCached)(cacheKey, JSON.stringify(resp.data), ttl);
    return { cached: false, data: resp.data };
}, {
    connection,
    concurrency: Number(process.env.WORKER_CONCURRENCY || 4),
});
/* -------------------------------------------------------------------------- */
/* 🚨 ERROR HANDLING                                                          */
/* -------------------------------------------------------------------------- */
exports.worker.on('failed', (job, err) => {
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
