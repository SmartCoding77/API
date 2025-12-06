import express from 'express';
import dotenv from 'dotenv';
import { z } from 'zod';
import cors from 'cors';
import { YouTubeAdapter } from './Adapter/youtubeAdapter';
import { TikTokAdapter } from './Adapter/tiktokAdapter';
import { FacebookAdapter } from './Adapter/facebookAdapter';
import { SnapchatAdapter } from './Adapter/snapchatAdapter';
import { InstagramAdapter } from './Adapter/instagramAdapter';

import { getCached, setCached } from './cache';
import { enqueueFetch } from './orchestrator';
import { rateLimit } from './middleware/rateLimit';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(rateLimit({ windowSec: 60, max: 40 }));

// Unified schema for all platforms
const schema = z.object({
  platform: z.enum(['youtube', 'tiktok', 'facebook', 'snapchat', 'instagram']),
  url: z.string().url(),
  command: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  mode: z.enum(['sync', 'async']).default('async'),
  ttl: z.number().int().positive().optional(),
  maxResultsTotal: z.number().int().positive().optional(),
});

// Define adapters
const adapters = {
  youtube: new YouTubeAdapter(process.env.YOUTUBE_API_KEY || ''),
  tiktok: new TikTokAdapter(),
  facebook: new FacebookAdapter(),
  snapchat: new SnapchatAdapter(),
  instagram: new InstagramAdapter(),

};

function cacheKeyFor(platform: string, url: string, command: number) {
  return `${platform}:${command}:${url}`;
}

// === 🧩 Universal Fetch Route ===
app.post('/v1/fetch', async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues });
  }

  const body = parsed.data;
  const adapter = adapters[body.platform];
  if (!adapter) {
    return res.status(400).json({ error: 'Unsupported platform' });
  }

  const cacheKey =
    cacheKeyFor(body.platform, body.url, body.command) +
    (body.maxResultsTotal ? `:m${body.maxResultsTotal}` : '');

  const cached = await getCached(cacheKey);
  if (cached) {
    return res.json({
      data: JSON.parse(cached),
      cached: true,
      fetchedAt: new Date().toISOString(),
    });
  }

  // SYNC mode — fetch immediately
  if (body.mode === 'sync') {
    try {
      const resp = await adapter.fetch({ ...body } as any);
      await setCached(cacheKey, JSON.stringify(resp.data), body.ttl ?? 300);
      return res.json({
        data: resp.data,
        cached: false,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ error: err.message || 'Fetch error' });
    }
  }

  // ASYNC mode — enqueue background job
  const job = await enqueueFetch({ req: { ...body }, cacheKey, ttl: body.ttl });
  return res.status(202).json({ jobId: job.id, status: 'queued' });
});

// Health route
app.get('/health', (req, res) => res.json({ ok: true }));

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`🌐 SocialMedia API listening on port ${port}`));



// import express from 'express';
// import dotenv from 'dotenv';
// import { z } from 'zod';
// import { YouTubeAdapter } from './Adapter/youtubeAdapter';
// import { getCached, setCached } from './cache';
// import { enqueueFetch } from './orchestrator';
// import { BaseRequest } from './types';
// import { rateLimit } from './middleware/rateLimit';

// dotenv.config();

// const app = express();
// app.use(express.json());
// app.use(rateLimit({ windowSec: 60, max: 40 }));

// const schema = z.object({
//   url: z.string().url(),
//   command: z.union([z.literal(1), z.literal(2), z.literal(3)]),
//   mode: z.enum(['sync','async']).default('async'),
//   ttl: z.number().int().positive().optional(),
//   maxResultsTotal: z.number().int().positive().optional()
// });

// const adapter = new YouTubeAdapter(process.env.YOUTUBE_API_KEY || '');

// function cacheKeyFor(url: string, command: number) {
//   return `youtube:${command}:${url}`;
// }

// app.post('/v1/youtube/fetch', async (req, res) => {
//   const parsed = schema.safeParse(req.body);

//   // لازم نفصل الشرط كـ block عشان TS يفهم النوع
//   if (!parsed.success) {
//     return res.status(400).json({ error: parsed.error.issues });
//   }

//   const body = parsed.data;
//   const cacheKey =
//     cacheKeyFor(body.url, body.command) +
//     (body.maxResultsTotal ? `:m${body.maxResultsTotal}` : '');

//   const cached = await getCached(cacheKey);
//   if (cached) {
//     return res.json({
//       data: JSON.parse(cached),
//       cached: true,
//       fetchedAt: new Date().toISOString(),
//     });
//   }

//   if (body.mode === 'sync') {
//     try {
//       const resp = await adapter.fetch({ ...body } as any);
//       await setCached(cacheKey, JSON.stringify(resp.data), body.ttl ?? 300);
//       return res.json({
//         data: resp.data,
//         cached: false,
//         fetchedAt: new Date().toISOString(),
//       });
//     } catch (err: any) {
//       return res.status(500).json({ error: err.message || 'Fetch error' });
//     }
//   }

//   const job = await enqueueFetch({ req: { ...body }, cacheKey, ttl: body.ttl });
//   return res.status(202).json({ jobId: job.id, status: 'queued' });
// });


// // health
// app.get('/health', (req, res) => res.json({ ok: true }));

// const port = process.env.PORT || 4000;
// app.listen(port, () => console.log(`YouTube fetcher listening on ${port}`));
