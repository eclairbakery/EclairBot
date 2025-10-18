import { Action, AnyAction, PredefinedActionEventTypes, ActionCallback, ConstraintCallback, AnyEventCtx, ActionEventType } from '../actions.js';
import { MessageEventCtx, UserEventCtx, VoiceChannelsEventCtx, ThreadEventCtx, ChannelEventCtx } from '../actions.js';
import { PredefinedActionCallbacks, PredefinedActionConstraints } from '../actions.js';
import { OnForceReloadTemplates } from '../../events/templatesEvents.js';

import actionsManager from '../actions.js';

import { RenameableChannel } from '../../defs.js';

import * as dsc from 'discord.js';
import { ChannelName, makeChannelName } from '@/util/makeChannelName.js';
import { client } from '@/client.js';

export async function getChannel(id: dsc.Snowflake, client: dsc.Client): Promise<dsc.Channel> {
    let channel = client.channels.cache.get(id);
    if (channel == null) {
        channel = await client.channels.fetch(id);
    }

    return channel;
}

export interface TemplateChannel {
    channel: RenameableChannel;
    updateOnEvents: ActionEventType[];
    format: (ctx: AnyEventCtx) => string | Promise<string>;

    additionalConstraints?: ConstraintCallback<ChannelEventCtx>[];
    additionalCallbacks?: ActionCallback<ChannelEventCtx>[];
}

export function* mkTemplateChannelUpdateActions({ channel, updateOnEvents, format, additionalConstraints, additionalCallbacks }: TemplateChannel): Iterable<AnyAction> {
    for (const event of updateOnEvents) {
        yield {
            activationEventType: event,
            constraints: [
                ...additionalConstraints || [],
            ],
            callbacks: [
                async (ctx: AnyEventCtx) => {
                    let newName: string | Promise<string> = format(ctx);
                    if (newName instanceof Promise) {
                        newName = await newName;
                    }
                    channel.setName(newName);
                },
                ...additionalCallbacks || [],
            ],
        };
    }
}

export function addTemplateChannel(options: TemplateChannel) {
    for (const action of mkTemplateChannelUpdateActions(options)) {
        actionsManager.addAction(action);
    }
}

export async function makeNameGuard(channelId: string, channelName: ChannelName) {
    addTemplateChannel({
        channel: await getChannel(channelId, client) as dsc.GuildChannel,
        updateOnEvents: [
            PredefinedActionEventTypes.OnChannelUpdate,
            OnForceReloadTemplates
        ],
        format() {
            return makeChannelName(channelName);
        }
    })
}