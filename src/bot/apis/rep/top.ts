import * as dsc from 'discord.js';

import { computeReputationScales, computeReputationScores } from "./rep.js";
import User from '../db/user.js';
import { client } from '@/client.js';

export async function getTopRep(count: number): Promise<[dsc.Snowflake, number][]> {
    const reps = await new User(client.user!.id).reputation.getAll();
    const repScores = computeReputationScores(reps);
    const repScales = computeReputationScales(repScores);

    const sortedUsers = Array.from(repScales.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, count)

    return sortedUsers;
}
