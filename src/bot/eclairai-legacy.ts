/**
 * DO NOT REMOVE THIS CREDIT OR THE FOLLOWING DISCLAIMER
 *
 * This is a fan edition of EclairAI and has nothing to do
 * with the original one. This version does not contain any
 * of the LDLS models' source code.
 *
 * This source code does not contain the trained copy of
 * EclairAI Fan Edition.
 *
 * Original EclairAI:
 *  (c) 2024-2025 Eklerka25
 *
 * EclairAI fan edition:
 *  (c) 2025 EclairBakery contributors
 */

import { cfg } from "./cfg.js";
import * as dsc from 'discord.js';
import * as log from '@/util/log.js'
import { Snowflake } from "../defs.js";
import * as fs from 'node:fs';

export class EclairAiFirstEdition {
    private config!: typeof cfg.ai;
    private model!: {
        tokenLimitsCounter: Record<string, number>;
        model: Record<string, Record<string, number>>;
        memory: Record<string, string[]>;
        embeddings: Record<string, number[]>;
    };
    private shouldReply: boolean = true;
    private msg: dsc.Message;

    constructor(msg: dsc.OmitPartialGroupDMChannel<dsc.Message<boolean>>) {
        this.msg = msg;
        this.loadConfig();
        this.loadModel();
        for (const seq of this.config.bannedSequences) {
            if (msg.content.toLowerCase().includes(seq)) {
                this.shouldReply = false;
                log.replyError(
                    msg,
                    'Ta wiadomość narusza zasady korzystania z EclairAI Fan Edition',
                    `Jeżeli uważasz, że to pomyłka, skontaktuj się z deweloperami fanowskiej wersji EclairAI. Sekwencja wywołująca komunikat: \`${seq}\``
                );
                return;
            }
        }
        if (!this.validateCharacters(msg.content)) {
            log.replyError(
                msg,
                'Hej, niepoprawny znak / spam słowami!',
                'Napisz coś z poprawnymi znakami, pamiętaj również, że ten komunikat pojawia się jak próbujesz tricknąć model w mówienie ciągle tego samego powtarzanie. Nie chcemy by AI się uczyło nie wiadomo czego...'
            );
            this.shouldReply = false;
            return;
        }
        this.learn(msg.content);
        this.tokensHandler();
        this.remember(msg.author.id, msg.content);
    }

    private loadConfig() {
        this.config = cfg.ai;
    }

    private loadModel() {
        try {
            if (fs.existsSync(this.config.modelPath)) {
                this.model = JSON.parse(fs.readFileSync(this.config.modelPath, "utf-8"));
                if (!this.model.embeddings) this.model.embeddings = {};
                if (!this.model.memory) this.model.memory = {};
            } else {
                this.model = {
                    tokenLimitsCounter: {},
                    model: {},
                    memory: {},
                    embeddings: {}
                };
            }
        } catch (e) {
            this.shouldReply = false;
            console.error(e);
        }
    }

    private saveModel() {
        fs.writeFileSync(this.config.modelPath, JSON.stringify(this.model, null, 2));
    }

    private remember(userId: string, text: string) {
        if (!this.model.memory[userId]) this.model.memory[userId] = [];
        this.model.memory[userId].push(text);
        if (this.model.memory[userId].length > this.config.memoryLimit) {
            this.model.memory[userId].shift();
        }
    }

    private validateCharacters(content: Snowflake): boolean {
        let hasInvalidCharacters = false;

        content.split("").forEach((char) => {
            if (this.config.notAllowedCharacters.includes(char)) hasInvalidCharacters = true;
        });

        const words = content.split(/\s+/);
        for (let i = 0; i < words.length - 1; i++) {
            if (words[i].toLowerCase() === words[i + 1].toLowerCase()) {
                hasInvalidCharacters = true;
                break;
            }
        }

        return !hasInvalidCharacters;
    }

    private tokenize(text: string): string[] {
        return text.toLowerCase().split(/\s+/).filter(Boolean);
    }

    private learn(text: string) {
        text = this.replacePronouns(text);
        const tokens = this.tokenize(text);

        for (let i = 0; i < tokens.length - 1; i++) {
            const current = tokens[i];
            const next = tokens[i + 1];

            if (!this.model.model[current]) this.model.model[current] = {};
            if (!this.model.model[current][next]) this.model.model[current][next] = 0;
            this.model.model[current][next]++;

            if (!this.model.embeddings[current]) {
                this.model.embeddings[current] = this.createEmbedding(current);
            }
            if (!this.model.embeddings[next]) {
                this.model.embeddings[next] = this.createEmbedding(next);
            }
        }
        this.saveModel();
    }

    private weightedChoice(options: Record<string, number>): string {
        let total = Object.values(options).reduce((a, b) => a + b, 0);
        let rand = Math.random() * total;
        let cumulative = 0;
        for (let [word, count] of Object.entries(options)) {
            cumulative += count;
            if (rand < cumulative) return word;
        }
        return Object.keys(options)[0];
    }

    private cosineSimilarity(a: number[], b: number[]): number {
        let dot = 0, normA = 0, normB = 0;
        for (let i = 0; i < a.length; i++) {
            dot += a[i] * b[i];
            normA += a[i] ** 2;
            normB += b[i] ** 2;
        }
        return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
    }

    private createEmbedding(word: string): number[] {
        const vec = new Array(26).fill(0);
        for (const char of word) {
            const idx = char.charCodeAt(0) % 26;
            vec[idx]++;
        }
        return vec;
    }

    private generate(seed: string, maxWords: number | null = null, userId?: string): string {
        if (userId && this.model.memory[userId]) {
            const context = this.model.memory[userId].slice(-3).join(" ");
            seed = `${context} ${seed}`;
        }

        if (maxWords == null) {
            maxWords = this.tokenize(seed).length + 5;
        }

        let tokens = this.tokenize(seed);
        if (tokens.length === 0) return "";

        for (const [pattern, suggestions] of Object.entries(this.config.pretrainedSuggestions)) {
            if (seed.toLowerCase().includes(pattern.toLowerCase())) {
                if (Math.random() > (1 - this.config.temperature)) {
                    return suggestions[Math.floor(Math.random() * suggestions.length)];
                }
            }
        }

        let current = tokens[tokens.length - 1];
        if (!this.model.model[current]) {
            const keys = Object.keys(this.model.model);
            if (keys.length === 0) return seed;
            current = keys[Math.floor(Math.random() * keys.length)];
        }

        const result = [current];

        for (let i = 0; i < maxWords; i++) {
            const nextOptions = this.model.model[current];
            if (!nextOptions) break;

            let nextWord = this.weightedChoice(nextOptions);
            if (this.model.embeddings[current]) {
                let best = "";
                let bestScore = -1;
                for (const candidate of Object.keys(nextOptions)) {
                    if (this.model.embeddings[candidate]) {
                        const score = this.cosineSimilarity(
                            this.model.embeddings[current],
                            this.model.embeddings[candidate]
                        );
                        if (score > bestScore) {
                            bestScore = score;
                            best = candidate;
                        }
                    }
                }
                if (best) nextWord = best;
            }

            result.push(nextWord);
            current = nextWord;
            if (/[.!?]/.test(nextWord)) break;
        }

        return result.join(" ");
    }

    private tokensHandler() {
        const userid = this.msg.author.id;
        const datetime = new Date();
        const entry = `${datetime.getUTCDate()}-${datetime.getUTCMonth()}-${datetime.getUTCFullYear()}-${userid}`;
        if (!this.model.tokenLimitsCounter[entry]) {
            this.model.tokenLimitsCounter[entry] = this.tokenize(this.msg.content).length;
        } else {
            if (
                this.model.tokenLimitsCounter[entry] > this.config.aiTokensLimit &&
                !(this.msg.member != null && this.msg.member.roles.cache.hasAny(...this.config.unlimitedAiRole))
            ) {
                log.replyError(
                    this.msg,
                    "Wykorzystano limit zapytań",
                    "Spróbuj ponownie jutro..."
                );
                this.shouldReply = false;
                return;
            }
            this.model.tokenLimitsCounter[entry] += this.tokenize(this.msg.content).length;
        }
    }

    private replacePronouns(text: string): string {
        const replacements: Record<string, string> = {
            "ja": "ty",
            "mnie": "ciebie",
            "mi": "tobie",
            "mój": "twój",
            "moja": "twoja",
            "moje": "twoje",
            "mną": "tobą",
            "ze mną": "z tobą",
            "dla mnie": "dla ciebie",
            "i": "you",
            "me": "you",
            "my": "your",
            "mine": "yours"
        };

        const sortedKeys = Object.keys(replacements).sort((a, b) => b.length - a.length);
        let result = text.toLowerCase();

        for (const key of sortedKeys) {
            const regex = new RegExp(`\\b${key}\\b`, "gi");
            result = result.replace(regex, replacements[key]);
        }
        return result;
    }

    public reply() {
        if (!this.shouldReply) return;
        const result = this.generate(this.msg.content, null, this.msg.author.id);
        this.learn(result);
        this.msg.reply({
            allowedMentions: { parse: [], users: [], roles: [], repliedUser: false },
            content: `${result}\n-# ~ eclairAI fan edition`
        });
        this.remember(this.msg.author.id, result);
        this.saveModel();
    }
}