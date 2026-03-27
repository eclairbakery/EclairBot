import * as gemini from 'gemini';
import process from "node:process";

export * from 'gemini';

class ModelNotInitializedError extends Error {
    constructor(modelId: string) {
        super(`Model ${modelId} not initialized`);
    }
}

let genai: gemini.GoogleGenerativeAI | null = null;
let models: Record<string, gemini.GenerativeModel> = {};

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
    if (model) models[id] = model;
    return model;
}

export function getModel(id: string): gemini.GenerativeModel | null {
    return models[id] ?? null;
}

type PromptResolvable = string | gemini.GenerateContentRequest | (string | gemini.Part)[];

export async function askModel(id: string, prompt: PromptResolvable): Promise<gemini.GenerateContentStreamResult> {
    const model = models[id];
    if (!model) {
        throw new ModelNotInitializedError(id);
    }
    return model.generateContentStream(prompt);
}
