"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCached = getCached;
exports.setCached = setCached;
const ioredis_1 = __importDefault(require("ioredis"));
const redis = new ioredis_1.default(process.env.REDIS_URL || 'redis://127.0.0.1:6379');
async function getCached(key) {
    return redis.get(key);
}
async function setCached(key, value, ttlSec = 300) {
    await redis.set(key, value, 'EX', ttlSec);
}
