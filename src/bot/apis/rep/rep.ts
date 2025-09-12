import * as dsc from 'discord.js';
import { dbRun, dbAll, DBRunResult, dbGet } from '@/util/db-utils.js';
import debugLog from '@/util/debugLog.js';

export interface Rep {
    id: number;
    createdAt: string;
    authorID: dsc.Snowflake;
    targetUserID: dsc.Snowflake;
    comment: string | null;
    type: '+rep' | '-rep';
}

export interface RepProportion {
    plus: number;
    sub: number;
};

export async function addRep(authorID: string, targetUserID: string, comment: string | null, type: '+rep' | '-rep') {
    return dbRun(`
        INSERT INTO reputation (authorID, targetUserID, comment, type)
        VALUES (?, ?, ?, ?)
    `, [authorID, targetUserID, comment, type]);
}

export async function getRepsGivenByUser(authorID: string): Promise<Rep[]> {
    const rows = await dbAll<Rep>(
        `
            SELECT * FROM reputation WHERE authorID = ?
        `,
        [authorID],
    );
    return rows;
}

export async function getLastRepGivenByUser(authorID: string): Promise<Rep | null> {
    const row = await dbGet<Rep>(`
        SELECT * FROM reputation WHERE authorID = ?
        ORDER BY createdAt DESC
        LIMIT 1
    `, [authorID]);
    return row ?? null;
}

export async function getUserReps(userID: dsc.Snowflake): Promise<Rep[]> {
    const rows = await dbAll<Rep>(`
        SELECT * FROM reputation WHERE targetUserID = ?
    `, [userID]);
    return rows;
}

export async function getAllRepsList(): Promise<Rep[]> {
    return dbAll<Rep>(`SELECT * FROM reputation`);
}

function buildRepsMap(reps: Rep[]): Map<dsc.Snowflake, Rep[]> {
    const map = new Map<dsc.Snowflake, Rep[]>();
    for (const r of reps) {
        if (!map.has(r.targetUserID)) {
            map.set(r.targetUserID, []);
        }
        map.get(r.targetUserID)!.push(r);
    }
    return map;
}

export function computeReputationScores(reps: Rep[], opts?: { maxIter?: number; tol?: number }): Map<dsc.Snowflake, number> {
    const maxIter = opts?.maxIter ?? 100;
    const tol = opts?.tol ?? 1e-3;

    const repsMap = buildRepsMap(reps);

    const users: Set<dsc.Snowflake> = new Set();
    for (const r of reps) {
        users.add(r.authorID);
        users.add(r.targetUserID);
    }

    const reputations: Map<dsc.Snowflake, number> = new Map();
    for (const u of users) reputations.set(u, 5);

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
                const voterRep = reputations.get(r.authorID) ?? 0;
                const weight = Math.max(0.5, voterRep / 10); // prevent zero weight
                const val = r.type === '+rep' ? 1 : -1;
                weightedSum += val * weight;
                totalWeight += weight;
            }

            const avg = weightedSum / totalWeight; // -1 / +1
            const score = avg + Math.log1p(incoming.length) * 0.5;
            next.set(u, score);

            maxDelta = Math.max(maxDelta, Math.abs(score - (reputations.get(u) ?? 5)));
        }

        reputations.clear();
        for (const [k, v] of next) reputations.set(k, v);

        if (maxDelta < tol) break; // converged
    }

    return reputations;
}

function scaleTwoNumbers(a: number, b: number, newMax: number, threshold: number): { a: number, b: number } {
    if (a == b) {
        return a >= threshold ? { a: newMax, b: newMax } : { a: newMax-1, b: newMax-1 };
    }

    const bigger = a > b ? a : b;

    if (bigger > threshold) {
        return {
            a: a == bigger ? newMax : a * newMax / bigger,
            b: b == bigger ? newMax : b * newMax / bigger,
        };
    } else {
        return {
            a: a * newMax / bigger,
            b: b * newMax / bigger,
        };
    }
}

async function deleteExpiredReps() {
    return dbRun(`
      DELETE FROM reputation
      WHERE createdAt <= datetime('now', '-7 days');
    `);
}

export type Reputation = { repScore: number; repScale: number; repProportion: RepProportion };

export async function getUserReputation(userID: dsc.Snowflake): Promise<Reputation> {
    await deleteExpiredReps();

    const reps = await getAllRepsList();

    const reputations = computeReputationScores(reps);
    if (!reputations.has(userID)) {
        return { repScore: 0, repScale: 0, repProportion: { plus: 0, sub: 0 } };
    }

    const values = Array.from(reputations.values());
    if (values.length == 0) {
        return { repScore: 0, repScale: 0, repProportion: { plus: 0, sub: 0 } };
    }

    const min = Math.min(...values);
    const max = Math.max(...values);

    if (min == max) {
        return { repScore: reputations.get(userID)!, repScale: 0, repProportion: { plus: 0, sub: 0 } };
    }

    const repScore = reputations.get(userID)!;
    const repScale = ((repScore - min) / (max - min)) * 10;

    const repProportion = await getUserReputationProportion(userID);

    return { repScore, repScale, repProportion };
}


export async function getUserReputationProportion(userID: dsc.Snowflake): Promise<RepProportion> {
    const userReps = await getUserReps(userID);
    debugLog(userReps);
    const userPlusRepsCount = userReps.reduce((acc, rep) => acc + (rep.type === '+rep' ? 1 : 0), 0);
    const userSubRepsCount =  userReps.reduce((acc, rep) => acc + (rep.type === '-rep' ? 1 : 0), 0);

    const { a: userPlusRepsCountScaled, b: userSubRepsCountScaled } = scaleTwoNumbers(userPlusRepsCount, userSubRepsCount, 5, 5);
    return { plus: userPlusRepsCountScaled, sub: userSubRepsCountScaled };
}
