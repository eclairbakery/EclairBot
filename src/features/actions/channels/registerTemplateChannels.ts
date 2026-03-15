import * as dsc from "discord.js";

import { PredefinedActionEventTypes } from "../index.ts";
import { OnForceReloadTemplates } from "../../../events/actions/templatesEvents.ts";
import { addTemplateChannel, getChannel } from "./templateChannels.ts";
import { makeChannelName } from "@/util/makeChannelName.ts";

function getNextGoal(memberCount: number): number {
    const base = Math.floor(memberCount / 50) * 50;
    let goal = base + 50;
    if (goal <= memberCount) {
        goal += 50;
    }
    return goal;
}

export async function registerTemplateChannels(client: dsc.Client) {
    const populationTemplateChannel = await getChannel("1235591547437973557", client) as dsc.GuildChannel;
    addTemplateChannel({
        channel: populationTemplateChannel,
        updateOnEvents: [
            PredefinedActionEventTypes.OnUserJoin,
            PredefinedActionEventTypes.OnUserQuit,
            OnForceReloadTemplates,
        ],
        format: (_ctx) => makeChannelName({ emoji: "👥", name: `Populacja: ${populationTemplateChannel.guild.memberCount} osób`, leaveSpaces: true }),
    });

    const templateChannelTarget = await getChannel("1276862197099794514", client) as dsc.GuildChannel;
    addTemplateChannel({
        channel: templateChannelTarget,
        updateOnEvents: [
            PredefinedActionEventTypes.OnUserJoin,
            PredefinedActionEventTypes.OnUserQuit,
            OnForceReloadTemplates,
        ],
        format: (_ctx) => makeChannelName({ emoji: "🎯", name: `Cel: ${getNextGoal(templateChannelTarget.guild.memberCount)} pieczywa`, leaveSpaces: true }),
    });

    const bansTemplateChannel = await getChannel("1235591871020011540", client) as dsc.GuildChannel;
    addTemplateChannel({
        channel: bansTemplateChannel,
        updateOnEvents: [
            PredefinedActionEventTypes.OnUserBan,
            PredefinedActionEventTypes.OnUserUnban,
            OnForceReloadTemplates,
        ],
        format: async (_ctx) => {
            const guild = bansTemplateChannel.guild;
            const bans = await guild.bans.fetch();
            return makeChannelName({ emoji: "🚫", name: `Bany: ${bans.size} ludzi`, leaveSpaces: true });
        },
    });
}
