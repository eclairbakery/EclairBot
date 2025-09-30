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
import * as fs from 'node:fs';

export class EclairAI {
    private vocab: string[] = [];
    private embeddings: Record<string, number[]> = {};
    private hiddenWeights: number[][];
    private outputWeights: number[][];
    private hiddenSize: number;
    private embeddingSize: number;

    constructor() {
        this.hiddenSize = cfg.ai.hiddenSize;
        this.embeddingSize = cfg.ai.embeddingSize;
        this.hiddenWeights = [];
        this.outputWeights = [];
        this.loadModel();
    }

    private getEmbedding(word: string): number[] {
        if (!this.embeddings[word]) {
            this.embeddings[word] = Array.from({ length: this.embeddingSize }, () => Math.random() * 0.2 - 0.1);
        }
        return this.embeddings[word];
    }

    private sigmoid(x: number): number {
        return 1 / (1 + Math.exp(-x));
    }

    private sigmoidDerivative(x: number): number {
        return x * (1 - x);
    }

    private dot(a: number[], b: number[]): number {
        return a.reduce((sum, val, i) => sum + val * b[i], 0);
    }

    private randomMatrix(rows: number, cols: number): number[][] {
        return Array.from({ length: rows }, () => Array.from({ length: cols }, () => Math.random() * 0.2 - 0.1));
    }

    /** @unused */
    private addVectors(a: number[], b: number[]): number[] {
        return a.map((v, i) => v + b[i]);
    }

    private tokenize(text: string): string[] {
        return text
            .toLowerCase()
            .match(/\b\w+\b|[^\s\w]/g) || [];
    }

    private relu(x: number): number {
        return Math.max(0, x);
    }

    private reluDerivative(x: number): number {
        return x > 0 ? 1 : 0;
    }

    private crossEntropyLoss(output: number[], targetIdx: number): number {
        const eps = 1e-9;
        return -Math.log(output[targetIdx] + eps);
    }

    public train(pairs: { question: string, response: string }[], lr = 0.05, epochs = 500) {
        for (const { question, response } of pairs) {
            for (const word of [...this.tokenize(question), ...this.tokenize(response)]) {
                this.getEmbedding(word);
            }
        }

        if (this.hiddenWeights.length === 0) {
            this.hiddenWeights = this.randomMatrix(this.hiddenSize, this.embeddingSize);
            this.vocab = Object.keys(this.embeddings);
            this.outputWeights = this.randomMatrix(this.vocab.length, this.hiddenSize);
        }

        for (let epoch = 0; epoch < epochs; epoch++) {
            let totalLoss = 0;
            for (const { question, response } of pairs) {
                const qTokens = this.tokenize(question);
                const rTokens = this.tokenize(response);

                for (let i = 0; i < Math.min(qTokens.length, rTokens.length); i++) {
                    const input = this.getEmbedding(qTokens[i]);
                    const targetIdx = this.vocab.indexOf(rTokens[i]);
                    if (targetIdx === -1) continue;

                    const hidden = this.hiddenWeights.map(row => this.relu(this.dot(row, input)));
                    const output = this.outputWeights.map(row => this.dot(row, hidden));
                    const probs = this.softmaxWithTemperature(output);

                    totalLoss += this.crossEntropyLoss(probs, targetIdx);

                    const outputDelta = probs.map((p, idx) => (idx === targetIdx ? 1 : 0) - p);
                    const hiddenError = this.hiddenWeights.map((_, j) =>
                        this.outputWeights.reduce((sum, row, k) => sum + outputDelta[k] * row[j], 0)
                    );
                    const hiddenDelta = hiddenError.map((e, idx) => e * this.reluDerivative(hidden[idx]));

                    for (let j = 0; j < this.outputWeights.length; j++)
                        for (let k = 0; k < this.outputWeights[0].length; k++)
                            this.outputWeights[j][k] += lr * outputDelta[j] * hidden[k];

                    for (let j = 0; j < this.hiddenWeights.length; j++)
                        for (let k = 0; k < this.hiddenWeights[0].length; k++)
                            this.hiddenWeights[j][k] += lr * hiddenDelta[j] * input[k];
                }
            }
            console.log(`Epoch ${epoch + 1}, Loss: ${totalLoss.toFixed(4)}`);
        }
        this.saveModel();
    }

    private softmaxWithTemperature(values: number[]): number[] {
        const max = Math.max(...values);
        const expVals = values.map(v => Math.exp((v - max) / (cfg.ai.temperature || 1)));
        const sum = expVals.reduce((a, b) => a + b, 0);
        return expVals.map(v => v / sum);
    }

    public predict(question: string, maxTokens = 5): string {
        const qTokens = this.tokenize(question);
        const context = qTokens.slice(-1);
        const result: string[] = [];

        for (let t = 0; t < maxTokens; t++) {
            const input = this.getEmbedding(context[context.length - 1]);
            const hidden = this.hiddenWeights.map(row => this.relu(this.dot(row, input)));
            const output = this.outputWeights.map(row => this.sigmoid(this.dot(row, hidden)));

            const probs = this.softmaxWithTemperature(output);
            let r = Math.random();
            let chosenIdx = 0;
            for (let i = 0; i < probs.length; i++) {
                r -= probs[i];
                if (r <= 0) {
                    chosenIdx = i;
                    break;
                }
            }

            const word = this.vocab[chosenIdx];
            result.push(word);
            context.push(word);
        }

        return result.join(' ');
    }

    private saveModel() {
        const data = {
            vocab: this.vocab,
            embeddings: this.embeddings,
            hiddenWeights: this.hiddenWeights,
            outputWeights: this.outputWeights,
            hiddenSize: this.hiddenSize,
            embeddingSize: this.embeddingSize
        };
        fs.writeFileSync('@/bot/eclairai-model.json', JSON.stringify(data));
    }

    private trainAI() {
        this.train([
            {
                question: 'witaj',
                response: 'w czym mogę zepsuć/pomóc/[wstaw czasownik]'
            },
            {
                question: 'jaka pogoda',
                response: 'jako model językowy nie mam dośtępu do aktualnych danych pogo... dobra, co ja taki sztywny? wyjrzyj za okno.'
            }
        ], 0.5, 1000);
    }

    private loadModel() {
        if (fs.existsSync('@/bot/eclairai-model.json')) {
            const data = JSON.parse(fs.readFileSync('@/bot/eclairai-model.json', 'utf-8'));
            this.vocab = data.vocab;
            this.embeddings = data.embeddings;
            this.hiddenWeights = data.hiddenWeights;
            this.outputWeights = data.outputWeights;
            this.hiddenSize = data.hiddenSize;
            this.embeddingSize = data.embeddingSize;
        } else {
            this.trainAI();
        }
    }
}
