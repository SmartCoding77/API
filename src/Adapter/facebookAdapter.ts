import axios from 'axios';
import * as cheerio from 'cheerio';

export class FacebookAdapter {
  async fetch(req: BaseRequest) {
    try {
      const { data: html } = await axios.get(req.url, {
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
    } catch (err: any) {
      throw new Error(`Facebook scraping failed: ${err.message}`);
    }
  }
}


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
