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
import * as log from '../util/log.js'
import { Snowflake } from "../defs.js";
import * as fs from 'node:fs';

export class EclairAI {
    private config: typeof cfg.ai;
    private model: {
        tokenLimitsCounter: Record<string, number>,
        model: Record<string, Record<string, number>>
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
                'Hej, niepoprawny znak!',
                'Napisz coś z poprawnymi znakami. Nie chcemy by AI się uczyło nie wiadomo czego...'
            );
            this.shouldReply = false;
            return;
        }
        this.learn(msg.content);
        this.tokensHandler();
    }

    private loadConfig() {
        this.config = cfg.ai;
    }

    private loadModel() {
        try {
            if (fs.existsSync(this.config.modelPath)) {
                this.model = JSON.parse(fs.readFileSync(this.config.modelPath, "utf-8"));
            } else {
                this.model = {
                    tokenLimitsCounter: {},
                    model: {}
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

    private validateCharacters(content: Snowflake): boolean {
        let hasInvalidCharacters: boolean = false;
        content.split('').forEach((char) => {
            if (!this.config.allowedCharacters.includes(char)) hasInvalidCharacters = true;
        })
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

    private generate(seed: string, maxWords: number = null): string {
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
            let keys = Object.keys(this.model.model);
            if (keys.length === 0) return seed;
            current = keys[Math.floor(Math.random() * keys.length)];
        }

        let result = [current];

        for (let i = 0; i < maxWords; i++) {
            let nextOptions = this.model.model[current];
            if (!nextOptions) break;

            let nextWord = this.weightedChoice(nextOptions);
            result.push(nextWord);
            current = nextWord;
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
            if (this.model.tokenLimitsCounter[entry] > this.config.aiTokensLimit && !this.msg.member.roles.cache.hasAny(this.config.unlimitedAiRole)) {
                log.replyError(this.msg, 'Wykorzystano limit zapytań dla EclairAI Fan Edition', 'Spróbuj ponownie jutro... Lub wbij 25 lvl, aby mieć unlimited access.\n-# Powodem tego jest to, iż nie chcę obciążać free hostingu z czasem coraz bardziej wymagającym modelem... Nie jest to super duży model, ale boję się, że niedługo hosting wywali jak dam bez limitu. Wbij ten 25 level i się nie martw. Prawie każdy go ma, to nie jest super trudne jakoś...');
                this.shouldReply = false;
                return;
            }
            this.model.tokenLimitsCounter[entry] = this.model.tokenLimitsCounter[entry] + this.tokenize(this.msg.content).length;
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
        if (this.shouldReply) this.msg.reply({
            allowedMentions: {
                parse: [],
                users: [],
                roles: [],
                repliedUser: false
            },
            content: `${this.generate(this.msg.content).replaceAll('*', '\\*').replaceAll('_', '\\_').replaceAll('-#', '\\-#').replaceAll('#', '\\#')}\n-# ~ eclairAI fan edition`
        });
        this.saveModel();
    }
}