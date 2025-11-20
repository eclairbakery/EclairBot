import * as dsc from 'discord.js';

import { db, repFromRaw } from '../db/bot-db.js';

import User from '@/bot/apis/db/user.js';
import type { Rep, RepRaw } from '@/bot/apis/db/db-defs.js';
export type { Rep };

export interface RepProportion {
    plus: number;
    sub: number;
};

function buildRepsMap(reps: Rep[]): Map<dsc.Snowflake, Rep[]> {
    const map: Map<dsc.Snowflake, Rep[]> = new Map();
    for (const r of reps) {
        if (!map.has(r.targetUserId)) {
            map.set(r.targetUserId, []);
        }
        map.get(r.targetUserId)!.push(r);
    }
    return map;
}

export function computeReputationScores(reps: Rep[], opts?: { maxIter?: number; tol?: number }): Map<dsc.Snowflake, number> {
    const maxIter = opts?.maxIter ?? 100;
    const tol = opts?.tol ?? 1e-3;

    const repsMap = buildRepsMap(reps);

    const users: Set<dsc.Snowflake> = new Set();
    for (const r of reps) {
        users.add(r.authorId);
        users.add(r.targetUserId);
    }

    const reputations: Map<dsc.Snowflake, number> = new Map();
    for (const u of users) reputations.set(u, 0);

    for (let iter = 0; iter < maxIter; iter++) {
        let maxDelta = 0;
        const next: Map<dsc.Snowflake, number> = new Map();

        for (const u of users) {
            const incoming = repsMap.get(u) ?? [];
            if (incoming.length === 0) {
                next.set(u, 5);
                continue;
            }

            let weightedSum = 0;
            let totalWeight = 0;
            for (const r of incoming) {
                const voterRep = reputations.get(r.authorId) ?? 0;
                const weight = Math.max(0.5, voterRep / 10); // prevent zero weight
                const val = r.type === '+rep' ? 1 : -1;
                weightedSum += val * weight;
                totalWeight += weight;
            }

            const avg = weightedSum / totalWeight; // -1 / +1
            const score = avg + Math.log1p(incoming.length) * 0.5;
            next.set(u, score);

            maxDelta = Math.max(maxDelta, Math.abs(score - (reputations.get(u) ?? 0)));
        }

        reputations.clear();
        for (const [k, v] of next) reputations.set(k, v);

        if (maxDelta < tol) break; // converged
    }

    return reputations;
}

function scaleTwoNumbers(a: number, b: number, newMax: number, threshold: number): { a: number, b: number } {
    if (a == 0 && b == 0) {
        return { a: 0, b: 0 };
    }

    if (a == b && a >= threshold) {
        return { a: newMax, b: newMax };
    }

    const bigger = a > b ? a : b;

    if (bigger > threshold) {
        return {
            a: a == bigger ? newMax : a * newMax / bigger,
            b: b == bigger ? newMax : b * newMax / bigger,
        };
    } else if (bigger > newMax) {
        return {
            a: a * newMax / bigger,
            b: b * newMax / bigger,
        };
    } else {
        return { a, b };
    }
}

async function deleteExpiredReps() {
    return db.runSql(`
      DELETE FROM reputation
      WHERE createdAt <= datetime('now', '-7 days');
    `);
}

export type Reputation = { repScore: number; repScale: number; repProportion: RepProportion };

export async function getUserReputationProportion(userId: dsc.Snowflake): Promise<RepProportion> {
    const user = new User(userId);
    const userReps = await user.reputation.getReceived();

    const userPlusRepsCount = userReps.reduce((acc, rep) => acc + (rep.type === '+rep' ? 1 : 0), 0);
    const userSubRepsCount =  userReps.reduce((acc, rep) => acc + (rep.type === '-rep' ? 1 : 0), 0);

    const { a: userPlusRepsCountScaled, b: userSubRepsCountScaled } = scaleTwoNumbers(userPlusRepsCount, userSubRepsCount, 5, 5);
    return { plus: userPlusRepsCountScaled, sub: userSubRepsCountScaled };
}

function computeRepScaleSmooth(repScores: Map<string, number>, userId: string): number {
    const values = Array.from(repScores.values());
    const repScore = repScores.get(userId) ?? 0;

    // linear interpolation around min/max with small smoothing factor
    const min = Math.min(...values, 0);
    const max = Math.max(...values);

    // avoid divide by almost-zero
    const range = max - min;
    if (range < 1e-6) return 0; // assign middle scale if almost equal

    // map proportionally but keep small deltas visible
    const repScale = ((repScore - min) / range) * 10;

    return Math.max(0, Math.min(10, repScale));
}

export function computeReputationScales(repScores: Map<dsc.Snowflake, number>): Map<dsc.Snowflake, number> {
    const values = Array.from(repScores.values());

    if (values.length === 0) {
        return new Map();
    }

    const min = Math.min(...values, 0);
    const max = Math.max(...values);
    const range = max - min;

    const scales: Map<dsc.Snowflake, number> = new Map();

    for (const [userId, repScore] of repScores) {
        if (range < 1e-6) {
            scales.set(userId, 0);
        } else {
            const repScale = ((repScore - min) / range) * 10;
            scales.set(userId, Math.max(0, Math.min(10, repScale)));
        }
    }

    return scales;
}

export async function getUserReputation(userId: dsc.Snowflake): Promise<Reputation> {
    await deleteExpiredReps();

    const reps = await new User(userId).reputation.getAll();

    const repScores = computeReputationScores(reps);
    if (!repScores.has(userId)) {
        return { repScore: 0, repScale: 0, repProportion: { plus: 0, sub: 0 } };
    }

    const repScore = repScores.get(userId)!;
    const repScale = computeRepScaleSmooth(repScores, userId);
    const repProportion = await getUserReputationProportion(userId);

    return { repScore, repScale, repProportion };
}

export async function getLastRepGivenByUser(authorId: string): Promise<Rep | null> {
    const row = await db.selectOne<RepRaw>(`
        SELECT * FROM reputation WHERE author_id = ?
        ORDER BY created_at DESC
        LIMIT 1
    `, [authorId]);
    return row ? repFromRaw(row) : null;
}