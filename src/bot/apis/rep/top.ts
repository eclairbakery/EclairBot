import * as dsc from 'discord.js';

import { computeReputationScales, computeReputationScores, getAllRepsList } from "./rep.js";

export async function getTopRep(count: number): Promise<[dsc.Snowflake, number][]> {
    const reps = await getAllRepsList();
    const repScores = computeReputationScores(reps);
    const repScales = computeReputationScales(repScores);

    const sortedUsers = Array.from(repScales.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, count)

    return sortedUsers;
}
