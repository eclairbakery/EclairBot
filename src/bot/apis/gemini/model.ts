import * as gemini from 'gemini';
import process from 'node:process';

export * from 'gemini';

class ModelNotInitializedError extends Error {
    constructor(modelId: string) {
        super(`Model ${modelId} not initialized`);
    }
}

let genai: gemini.GoogleGenerativeAI | null = null;
let models: Record<string, gemini.GenerativeModel[]> = {};

export async function init() {
    if (process.env.EB_GEMINI_API_KEY) {
        genai = new gemini.GoogleGenerativeAI(process.env.EB_GEMINI_API_KEY);
        models = {};
    }
}

export function isInitialized(): boolean {
    return genai != null;
}

export function initModel(id: string, params: gemini.ModelParams): gemini.GenerativeModel | null {
    const model = genai?.getGenerativeModel(params) ?? null;
    if (model) {
        if (!models[id]) models[id] = [];
        models[id].push(model);
    }
    return model;
}

export function getModels(id: string): gemini.GenerativeModel[] {
    return models[id] ?? [];
}

export function getModel(id: string): gemini.GenerativeModel | null {
    return models[id]?.[0] ?? null;
}

type PromptResolvable = string | gemini.GenerateContentRequest | (string | gemini.Part)[];

export async function askModel(id: string, prompt: PromptResolvable): Promise<gemini.GenerateContentStreamResult> {
    const fallbackModels = models[id];
    if (!fallbackModels || fallbackModels.length === 0) {
        throw new ModelNotInitializedError(id);
    }

    let lastError: unknown;
    for (const model of fallbackModels) {
        try {
            return await model.generateContentStream(prompt);
        } catch (err) {
            lastError = err;
        }
    }
    throw lastError;
}

export async function generateContent(id: string, params: gemini.GenerateContentRequest): Promise<gemini.GenerateContentResult> {
    const fallbackModels = models[id];
    if (!fallbackModels || fallbackModels.length === 0) {
        throw new ModelNotInitializedError(id);
    }

    let lastError: unknown;
    for (const model of fallbackModels) {
        try {
            return await model.generateContent(params);
        } catch (err) {
            lastError = err;
        }
    }
    throw lastError;
}
