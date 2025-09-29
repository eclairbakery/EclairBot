import * as dsc from 'discord.js';
import { Snowflake } from '../../defs.js';
import { PredefinedActionEventTypes } from '../actions.js';
import { OnForceReloadTemplates } from '../../events/templatesEvents.js';
import { addTemplateChannel } from './templateChannels.js';
import { makeChannelName } from '@/util/makeChannelName.js';

async function getChannel(id: Snowflake, client: dsc.Client): Promise<dsc.Channel> {
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

export async function registerTemplateChannels(client: dsc.Client) {
    const populationTemplateChannel = await getChannel('1235591547437973557', client) as dsc.GuildChannel;
    addTemplateChannel({
        channel: populationTemplateChannel,
        updateOnEvents: [
            PredefinedActionEventTypes.OnUserJoin,
            PredefinedActionEventTypes.OnUserQuit,
            OnForceReloadTemplates,
        ],
        format: (ctx) => makeChannelName({ emoji: '👥', name: `Populacja: ${populationTemplateChannel.guild.memberCount} osób`, leaveSpaces: true }),
    });

    const templateChannelTarget = await getChannel('1276862197099794514', client) as dsc.GuildChannel;
    addTemplateChannel({
        channel: templateChannelTarget,
        updateOnEvents: [
            PredefinedActionEventTypes.OnUserJoin,
            PredefinedActionEventTypes.OnUserQuit,
            OnForceReloadTemplates,
        ],
        format: (ctx) => makeChannelName({emoji: '🎯', name: `Cel: ${getNextGoal(templateChannelTarget.guild.memberCount)} pieczywa`, leaveSpaces: true}),
    });

    const bansTemplateChannel = await getChannel('1235591871020011540', client) as dsc.GuildChannel;
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
            return makeChannelName({emoji: '🚫', name: `Bany: ${bans.size} ludzi`, leaveSpaces: true});
        },
    });


}