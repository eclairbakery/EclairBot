import * as dsc from 'discord.js';
import { dbRun, dbAll, DBRunResult } from "@/util/db-utils.js";

export interface Rep {
    id: number;
    userID: dsc.Snowflake;
    targetUserID: dsc.Snowflake;
    comment: string | null;
    type: '+rep' | '-rep';
}

export async function setRep(
    userID: dsc.Snowflake,
    targetUserID: dsc.Snowflake,
    comment: string | null,
    type: '+rep' | '-rep'
): Promise<void> {
    const now = Date.now();
    const expiresAt = now + 7 * 24 * 60 * 60 * 1000;

    const currentPoints = await getUserReputation(targetUserID);

    let delta: number;
    if (currentPoints >= 10) {
        delta = Math.floor(Math.abs(currentPoints) / 10);
    } else {
        delta = 1;
    }
    if (type === '-rep') delta = -delta;

    await dbRun(
        `
        INSERT INTO reputation (userID, points, expiresAt)
        VALUES (?, ?, ?)
        ON CONFLICT(userID) DO UPDATE SET points = points + excluded.points, expiresAt = excluded.expiresAt
        `,
        [targetUserID, delta, expiresAt]
    );
}

export async function getUserReputation(userID: dsc.Snowflake): Promise<number> {
    const now = Date.now();

    await dbRun(
        `
        DELETE FROM reputation
        WHERE userID = ? AND expiresAt > 0 AND expiresAt < ?
        `,
        [userID, now]
    );

    const rows = await dbAll<{ points: number }>(
        `
        SELECT points
        FROM reputation
        WHERE userID = ?
        `,
        [userID]
    );

    return rows.length > 0 ? rows[0].points : 0;
}

export const cannotVote: Map<string, boolean> = new Map();