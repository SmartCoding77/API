"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TikTokAdapter = void 0;
const axios_1 = __importDefault(require("axios"));
/**
 * TikTok Adapter
 * Currently uses TikTok’s public oEmbed endpoint (no official API key needed).
 * You can later replace this with your own private API logic or scraper.
 */
class TikTokAdapter {
    async fetch(req) {
        try {
            // Example: https://www.tiktok.com/oembed?url=<video_url>
            const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(req.url)}`;
            const { data } = await axios_1.default.get(oembedUrl);
            return {
                data: {
                    publisher: {
                        title: data.author_name,
                        channelId: data.author_unique_id,
                        thumbnails: {
                            default: { url: data.author_url || '', width: 100, height: 100 },
                        },
                    },
                    video: {
                        id: data.embed_product_id || req.url,
                        title: data.title,
                        thumbnails: {
                            default: { url: data.thumbnail_url, width: 480, height: 360 },
                        },
                        duration: undefined, // TikTok doesn’t expose easily
                    },
                    engagement: {
                    // oEmbed doesn’t include counts — can be extended via scraping later
                    },
                },
            };
        }
        catch (err) {
            throw new Error(`TikTok fetch failed: ${err.message}`);
        }
    }
}
exports.TikTokAdapter = TikTokAdapter;
