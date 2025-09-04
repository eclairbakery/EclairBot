import * as dsc from 'discord.js';
import { Snowflake } from '../../defs.js';
import { client } from '../../client.js';
import { PredefinedActionEventTypes } from '../actions.js';
import { OnForceReloadTemplates } from '../../events/templatesEvents.js';
import { addTemplateChannel } from './templateChannels.js';

async function getChannel(id: Snowflake): Promise<dsc.Channel> {
    let channel = client.channels.cache.get(id);
    if (channel == null) {
        channel = await client.channels.fetch(id);
    }

    return channel;
}

function getNextGoal(memberCount: number): number {
    const base = Math.floor(memberCount / 50) * 50;
    let goal = base + 50;
    if (goal <= memberCount) {
        goal += 50;
    }
    return goal;
}

const populationTemplateChannel = await getChannel('1235591547437973557') as dsc.GuildChannel;
addTemplateChannel({
    channel: populationTemplateChannel,
    updateOnEvents: [
        PredefinedActionEventTypes.OnUserJoin,
        PredefinedActionEventTypes.OnUserQuit,
        OnForceReloadTemplates,
    ],
    format: (ctx) => `👥・Populacja: ${populationTemplateChannel.guild.memberCount} osób`,
});

const templateChannelTarget = await getChannel('1276862197099794514') as dsc.GuildChannel;
addTemplateChannel({
    channel: templateChannelTarget,
    updateOnEvents: [
        PredefinedActionEventTypes.OnUserJoin,
        PredefinedActionEventTypes.OnUserQuit,
        OnForceReloadTemplates,
    ],
    format: (ctx) => `🎯・Cel: ${getNextGoal(templateChannelTarget.guild.memberCount)} osób`,
});

const bansTemplateChannel = await getChannel('1235591871020011540') as dsc.GuildChannel;
addTemplateChannel({
    channel: bansTemplateChannel,
    updateOnEvents: [
        PredefinedActionEventTypes.OnUserBan,
        PredefinedActionEventTypes.OnUserUnban,
        OnForceReloadTemplates,
    ],
    format: async (ctx) => {
        const guild = bansTemplateChannel.guild;
        const bans = await guild.bans.fetch();
        return `🚫・Bany: ${bans.size}`;
    },
});