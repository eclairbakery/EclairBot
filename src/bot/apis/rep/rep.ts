import * as dsc from 'discord.js';

import { dbRun, dbAll, DBRunResult } from "@/util/db-utils.js";

export interface Rep {
    id: number;
    userID: dsc.Snowflake;
    targetUserID: dsc.Snowflake;

    comment: string;
    type: '+rep' | '-rep';
};

export async function setRep(userID: dsc.Snowflake, targetUserID: dsc.Snowflake, comment: string | null, type: '+rep' | '-rep'): Promise<DBRunResult> {
    return dbRun(`
        INSERT INTO reps (userID, targetUserID, comment, type)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(userID, targetUserID) DO UPDATE SET type = excluded.type, comment = excluded.comment
    `, [userID, targetUserID, comment, type]);
}

export async function getReps(userID: dsc.Snowflake): Promise<Rep[]> {
    const rows = await dbAll(`
        SELECT id, userID, targetUserID, comment, type
        FROM reps
        WHERE targetUserID = ?
    `, [userID]);
    return rows as Rep[];
}

export async function getUserReputation(userID: dsc.Snowflake): Promise<number> {
    // load everything at once
    const rows = await dbAll(`
        SELECT id, userID, targetUserID, comment, type
        FROM reps
    `);

    const repsMap = new Map<dsc.Snowflake, Rep[]>();
    for (const row of rows as Rep[]) {
        if (!repsMap.has(row.targetUserID)) {
            repsMap.set(row.targetUserID, []);
        }
        repsMap.get(row.targetUserID)!.push(row);
    }

    return getUserReputationHelper(userID, repsMap, new Set());
}

async function getUserReputationHelper(
    userID: dsc.Snowflake,
    repsMap: Map<dsc.Snowflake, Rep[]>,
    visited: Set<dsc.Snowflake>
): Promise<number> {
    if (visited.has(userID)) return 5.0;
    visited.add(userID);

    const reps = repsMap.get(userID) ?? [];
    return calcReputation(reps, repsMap, visited);
}

async function calcReputation(
    reps: Rep[],
    repsMap: Map<dsc.Snowflake, Rep[]>,
    visited: Set<dsc.Snowflake>
): Promise<number> {
    if (reps.length === 0) return 5.0;

    const weights = await Promise.all(
        reps.map(rep =>
            getUserReputationHelper(rep.userID, repsMap, new Set(visited))
        )
    );

    let totalWeight = 0;
    let weightedSum = 0;

    for (let i = 0; i < reps.length; i++) {
        const rep = reps[i];
        const weight = weights[i];
        const value = rep.type === '+rep' ? 1 : -1;

        weightedSum += value * weight;
        totalWeight += weight;
    }

    if (totalWeight === 0) return 5.0;

    const avg = weightedSum / totalWeight;
    const score = ((avg + 1) / 2) * 10;
    return Math.round(score * 10) / 10;
}
