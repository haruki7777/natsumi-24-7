import { Collection } from "discord.js";

const cache = new Collection();
const TTL = 300000; // 5 minutes default

export const getCache = (key) => {
    const data = cache.get(key);
    if (!data) return null;
    if (Date.now() - data.timestamp > TTL) {
        cache.delete(key);
        return null;
    }
    return data.value;
};

export const setCache = (key, value) => {
    cache.set(key, {
        value,
        timestamp: Date.now()
    });
};

export const clearCache = () => {
    cache.clear();
};
