import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI = null;
let currentKey = null;
let lastModelIndex = 0;

// --- Model Distribution Strategy (v4.7 Ultimate Core) ---
const MODELS = [
    "gemini-3-flash-preview",
    "gemini-2.0-flash-exp",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-1.5-pro"
];

const modelCooldowns = new Map();
const COOLDOWN_DURATION = 60000; 

const getValidKey = () => {
    const k = process.env.MY_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!k || k.toString().includes("YOUR_")) return null;
    return k.toString().replace(/['"]/g, "").trim();
};

const getFallbackApiUrl = () => {
    const url = process.env.NATSUMI_API_URL || process.env.NATSUMI_HF_API_URL || process.env.HUGGINGFACE_NATSUMI_API_URL;
    return url ? url.toString().replace(/\/$/, "") : "";
};

const generateHuggingFaceContent = async (message, system = "") => {
    const baseUrl = getFallbackApiUrl();
    if (!baseUrl) return null;

    const response = await fetch(`${baseUrl}/assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            message,
            system,
            user_id: "discord-bot",
            guild_id: "natsumi",
        }),
        signal: AbortSignal.timeout?.(45000),
    });
    if (!response.ok) throw new Error(`HF_API_${response.status}`);
    const data = await response.json();
    return data.reply || data.text || null;
};

export const getAI = () => {
    const key = getValidKey();
    if (!key) return null;
    
    if (!genAI || currentKey !== key) {
        genAI = new GoogleGenerativeAI(key);
        currentKey = key;
    }
    return genAI;
};

export const generateDistributedContent = async (params) => {
    const ai = getAI();
    const fallbackText = params.contents?.map((item) => item.parts?.map((part) => part.text).filter(Boolean).join("\n")).filter(Boolean).join("\n") || "";
    const system = params.config?.systemInstruction || "";
    if (!ai) {
        const hf = await generateHuggingFaceContent(fallbackText, system);
        if (hf) return { text: hf, provider: "huggingface" };
        throw new Error("NO_API_KEY");
    }

    const now = Date.now();
    
    // Priority 1: gemini-3-flash-preview
    const p1Model = MODELS[0];
    const p1Cooldown = modelCooldowns.get(p1Model) || 0;
    
    let targetModels = [];
    if (p1Cooldown < now) {
        targetModels.push({ name: p1Model, index: 0 });
    }

    // Add remaining models in rotation order
    const restModels = MODELS.slice(1);
    for (let i = 0; i < restModels.length; i++) {
        const idx = ((lastModelIndex % restModels.length) + i) % restModels.length;
        const actualIdx = idx + 1;
        const mName = MODELS[actualIdx];
        if ((modelCooldowns.get(mName) || 0) < now) {
            targetModels.push({ name: mName, index: actualIdx });
        }
    }

    // Fallback if all strictly non-cooldown models are unavailable
    if (targetModels.length === 0) {
        targetModels = MODELS.map((name, index) => ({ name, index }));
    }

    for (const modelRef of targetModels) {
        const modelName = modelRef.name;
        try {
            console.log(`[AI] Attempting ${modelName} (Load Balanced)`);
            const apiModel = ai.getGenerativeModel({ 
                model: modelName,
                systemInstruction: params.config?.systemInstruction
            });
            
            const result = await apiModel.generateContent({
                contents: params.contents,
                generationConfig: {
                    temperature: params.config?.temperature ?? 0.8,
                    maxOutputTokens: 2048,
                }
            });

            const response = await result.response;
            lastModelIndex = modelRef.index; // Update successfully used model index
            
            let responseText = "";
            try {
                responseText = response.text();
            } catch (safeErr) {
                responseText = "흥, 나츠미가 대답해주기 싫은 질문이네! (세이프티 필터 작동)";
                console.warn(`[AI] Safety block triggered for ${modelName}`);
            }

            return {
                text: responseText,
            };
        } catch (err) {
            const errorMessage = (err.message || String(err)).toLowerCase();
            
            if (errorMessage.includes("429") || errorMessage.includes("quota")) {
                console.warn(`[AI] ${modelName} Quota Exceeded. Cooldown initiated.`);
                modelCooldowns.set(modelName, Date.now() + COOLDOWN_DURATION);
                continue; 
            }
            
            if (errorMessage.includes("500") || errorMessage.includes("503") || errorMessage.includes("404")) {
                console.warn(`[AI] ${modelName} Service/Found Error (${errorMessage}). Switching...`);
                modelCooldowns.set(modelName, Date.now() + COOLDOWN_DURATION); // Also cooldown for 404 to avoid spam
                continue;
            }

            throw err;
        }
    }

    const hf = await generateHuggingFaceContent(fallbackText, system);
    if (hf) return { text: hf, provider: "huggingface" };
    throw new Error("ALL_MODELS_FAILED");
};

export const getEmotion = () => {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 5) return "졸려서 투덜대는";
    if (hour >= 5 && hour < 10) return "들떠 있는";
    if (hour >= 10 && hour < 17) return "심술 궂은";
    if (hour >= 17 && hour < 21) return "조금은 상냥해진";
    return "외로운 척하는";
};
