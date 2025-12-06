"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacebookAdapter = void 0;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
class FacebookAdapter {
    async fetch(req) {
        try {
            const { data: html } = await axios_1.default.get(req.url, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            const $ = cheerio.load(html);
            const title = $('meta[property="og:title"]').attr('content') || '';
            const image = $('meta[property="og:image"]').attr('content') || '';
            const description = $('meta[property="og:description"]').attr('content') || '';
            return {
                data: {
                    publisher: { title: 'Facebook User' },
                    video: {
                        id: req.url,
                        title,
                        thumbnails: { default: { url: image, width: 480, height: 360 } },
                        duration: undefined
                    },
                    engagement: {}
                }
            };
        }
        catch (err) {
            throw new Error(`Facebook scraping failed: ${err.message}`);
        }
    }
}
exports.FacebookAdapter = FacebookAdapter;
// import axios from "axios";
// import { SocialAdapter, BaseRequest, Command1 } from "../types";
// export class FacebookAdapter implements SocialAdapter {
//   async fetch(req: BaseRequest): Promise<{ data: Command1 }> {
//     try {
//       // 1️⃣ المحاولة الأولى: عبر oEmbed بدون توكن
//       const oembedUrl = `https://www.facebook.com/plugins/post/oembed.json/?url=${encodeURIComponent(req.url)}`;
//       const { data } = await axios.get(oembedUrl);
//       return this.mapResponse(data);
//     } catch (err1) {
//       console.warn("⚠️ فشل الطلب العام، نحاول عبر Graph API...");
//       // 2️⃣ المحاولة الثانية: عبر Graph API مع توكن
//       const token = process.env.FACEBOOK_ACCESS_TOKEN;
//       if (!token)
//         throw new Error("فشل جلب بيانات فيسبوك: لا يوجد توكن ولا طريقة عامة ناجحة");
//       try {
//         const graphUrl = `https://graph.facebook.com/v19.0/oembed_post?url=${encodeURIComponent(req.url)}&access_token=${token}`;
//         const { data } = await axios.get(graphUrl);
//         return this.mapResponse(data);
//       } catch (err2: any) {
//         throw new Error("فشل جلب بيانات فيسبوك: جميع المحاولات فشلت.");
//       }
//     }
//   }
//   private mapResponse(data: any): { data: Command1 } {
//     return {
//       data: {
//         publisher: {
//           title: data.author_name || "غير معروف",
//           channelId: data.author_url || "",
//           thumbnails: {
//             default: { url: data.thumbnail_url || "", width: 100, height: 100 },
//           },
//         },
//         video: {
//           id: data.url || "",
//           title: data.title || "بدون عنوان",
//           thumbnails: {
//             default: { url: data.thumbnail_url || "", width: 480, height: 360 },
//           },
//           duration: undefined,
//         },
//         engagement: {},
//       },
//     };
//   }
// }
