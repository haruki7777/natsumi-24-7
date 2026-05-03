import { GoogleGenAI } from "@google/genai";

let aiInstance = null;
let currentKey = null;

// --- Model Distribution Strategy ---
const MODELS = [
    "gemini-3-flash-preview",
    "gemini-3.1-flash-lite-preview",
    "gemini-3.1-pro-preview"
];

const modelCooldowns = new Map();
const COOLDOWN_DURATION = 60000; // 1 minute cooldown for throttled models

const getValidKey = () => {
    const k = process.env.MY_GEMINI_API_KEY;
    if (!k) return null;
    const cleaned = k.toString().replace(/['"]/g, "").trim();
    if (cleaned.length > 20) return cleaned;
    return null;
};

export const getAI = () => {
    const key = getValidKey();
    if (!key) return null;
    
    if (!aiInstance || currentKey !== key) {
        aiInstance = new GoogleGenAI({ apiKey: key });
        currentKey = key;
    }
    return aiInstance;
};

/**
 * Executes generateContent with automatic model rotation if quota is exceeded.
 */
export const generateDistributedContent = async (params) => {
    const ai = getAI();
    if (!ai) throw new Error("NO_API_KEY");

    const now = Date.now();
    const availableModels = MODELS.filter(m => (modelCooldowns.get(m) || 0) < now);
    
    // Fallback to all models if everything is technically on cooldown
    const targetModels = availableModels.length > 0 ? availableModels : MODELS;

    for (const model of targetModels) {
        try {
            console.log(`[AI] Attempting response with model: ${model}`);
            const result = await ai.models.generateContent({
                ...params,
                model: model
            });
            return result;
        } catch (err) {
            const errorMessage = err.message || JSON.stringify(err);
            
            // If Rate Limited (429) or Quota Exceeded
            if (errorMessage.includes("429") || errorMessage.toLowerCase().includes("quota")) {
                console.warn(`[AI] Model ${model} is throttled. Switching...`);
                modelCooldowns.set(model, Date.now() + COOLDOWN_DURATION);
                continue; // Try the next available model
            }
            
            // Re-throw if it's a safety block or other terminal error
            throw err;
        }
    }

    throw new Error("ALL_MODELS_QUOTA_EXCEEDED");
};

export const getEmotion = () => {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 5) return "귀찮음";
    if (hour >= 5 && hour < 10) return "기쁨";
    if (hour >= 10 && hour < 17) return "츤츤";
    if (hour >= 17 && hour < 21) return "사랑";
    return "슬픔";
};
