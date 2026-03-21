import * as gemini from 'gemini';

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

type PromptResolvable = string | gemini.GenerateContentRequest | (string | gemini.Part)[];

export async function askModel(id: string, prompt: PromptResolvable): Promise<gemini.GenerateContentStreamResult> {
    return models[id].generateContentStream(prompt);
}
