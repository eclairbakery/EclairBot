import * as log from '../util/log.js';
import * as dsc from 'discord.js';

// import { MessageEventCtx, UserEventCtx, VoiceChannelsEventCtx, ThreadEventCtx, ChannelEventCtx }
export type MessageEventCtx       = dsc.Message;
export type ReactionEventCtx      = { reaction: dsc.MessageReaction, user: dsc.User };
export type UserEventCtx          = dsc.User;
export type VoiceChannelsEventCtx = { channel: dsc.VoiceBasedChannel, user: dsc.User };
export type ThreadEventCtx        = dsc.ThreadChannel;
export type ChannelEventCtx       = dsc.Channel;

export type AnyEventCtx = MessageEventCtx | UserEventCtx | VoiceChannelsEventCtx | ThreadEventCtx | ChannelEventCtx | ReactionEventCtx;

export type ActionCallback<CtxType> = (ctx: CtxType) => void | Promise<any>;
export type AnyActionCallback       = (ctx: AnyEventCtx) => void;

export type ConstraintCallback<CtxType> = (ctx: CtxType) => boolean;
export type AnyConstraintCallback       = (ctx: AnyEventCtx) => boolean;
export const Skip = false;
export const Ok = true;

export enum ActionEventType {
    // message events
    OnMessageCreate,
    OnMessageEdit,
    OnMessageCreateOrEdit,
    OnMessageDelete,

    // reaction events
    OnMessageReactionAdd,
    OnMessageReactionRemove,

    // user events
    OnUserJoin,
    OnUserQuit,

    // threads events
    OnThreadCreate,
    OnThreadDelete,
    OnThreadUpdate,

    // channels events
    OnChannelCreate,
    OnChannelDelete,
    OnChannelUpdate,

    // voice channels events
    OnVoiceChannelJoin,
    OnVoiceChannelQuit,
    OnVoiceChannelStartStream,
    OnVoiceChannelEndStream,
    OnVoiceChannelMute,
    OnVoiceChannelSelfMute,
    OnVoiceChannelDeaf,
    OnVoiceChannelSelfDeaf,
}

export interface Action<CallbackCtxType> {
    activationEventType: ActionEventType;
    constraints: ConstraintCallback<CallbackCtxType>[];
    callbacks: ActionCallback<CallbackCtxType>[];
}

export type AnyAction = Action<AnyEventCtx>;

export class PredefinedActionCallbacks {
    static reply(options: string | dsc.MessagePayload | dsc.MessageReplyOptions): ActionCallback<MessageEventCtx> {
        return (msg) => msg.reply(options)
    }

    static replyEmbed(...embeds: dsc.APIEmbed[]): ActionCallback<MessageEventCtx> {
        return (msg) => msg.reply({embeds: embeds});
    }

    static replyError(title: string, desc: string): ActionCallback<MessageEventCtx> {
        return (msg) => log.replyError(msg, title, desc);
    }

    static replyWarn(title: string, desc: string): ActionCallback<MessageEventCtx> {
        return (msg) => log.replyWarn(msg, title, desc);
    }

    static replyInfo(title: string, desc: string): ActionCallback<MessageEventCtx> {
        return (msg) => log.replyInfo(msg, title, desc);
    }

    static replySuccess(title: string, desc: string): ActionCallback<MessageEventCtx> {
        return (msg) => log.replySuccess(msg, title, desc);
    }

    static deleteMsg: ActionCallback<MessageEventCtx> = msg => msg.delete();
}

export class PredefinedActionConstraints {
    static not<CtxType>(callback: ConstraintCallback<CtxType>): ConstraintCallback<CtxType> {
        return (msg) => !callback(msg);
    }

    static or<CtxType>(...constraints: ConstraintCallback<CtxType>[]): ConstraintCallback<CtxType> {
        return (msg) => {
            for (const constraint of constraints) {
                if (constraint(msg) == Ok) return Ok;
            }
            return Skip;
        };
    }

    static and<CtxType>(...constraints: ConstraintCallback<CtxType>[]): ConstraintCallback<CtxType> {
        return (msg) => {
            for (const constraint of constraints) {
                if (constraint(msg) == Skip) return Skip;
            }
            return Ok;
        };
    }

    static msgContains(text: string): ConstraintCallback<MessageEventCtx> {
        return (msg) => {
            if (msg.content.includes(text)) return Ok;
            return Skip;
        };
    }

    static msgIsEqualTo(text: string): ConstraintCallback<MessageEventCtx> {
        return (msg) => {
            if (msg.content == text) return Ok;
            return Skip;
        };
    }

    static msgStartsWith(prefix: string): ConstraintCallback<MessageEventCtx> {
        return (msg) => {
            if (msg.content.startsWith(prefix)) return Ok;
            return Skip;
        }
    }

    static msgEndsWith(suffix: string): ConstraintCallback<MessageEventCtx> {
        return (msg) => {
            if (msg.content.endsWith(suffix)) return Ok;
            return Skip;
        }
    }
}

class ActionManager {
    private actions: Map<ActionEventType, AnyAction[]> = new Map();

    private handleEvent<T extends AnyEventCtx>(
        client: dsc.Client,
        eventName: string,
        eventType: ActionEventType,
        getCtx: (...args: any[]) => T,
        actionFilter?: (action: AnyAction, ...args: any[]) => boolean
    ) {
        client.on(eventName, async (...args: any[]) => {
            const ctx = getCtx(...args);

        actionsLoop:
            for (const action of this.actions.get(eventType) ?? []) {
                if (actionFilter && !actionFilter(action, ...args)) continue;

                for (const constraint of action.constraints) {
                    if (constraint(ctx) == Skip) {
                        continue actionsLoop;
                    }
                }

                for (const callback of action.callbacks) {
                    const result = callback(ctx);
                    if (result && typeof (result as any).then === "function") {
                        await result;
                    }
                }
            }
        });
    }

    addAction(action: AnyAction) {
        const eventTypes = action.activationEventType === ActionEventType.OnMessageCreateOrEdit
            ? [ActionEventType.OnMessageCreate, ActionEventType.OnMessageEdit]
            : [action.activationEventType];

        for (const eventType of eventTypes) {
            if (!this.actions.has(eventType)) this.actions.set(eventType, []);
            this.actions.get(eventType)?.push(action);
        }
    }

    registerEvents(client: dsc.Client): void {
        // ---- Message Events ----
        this.handleEvent(client, 'messageCreate', ActionEventType.OnMessageCreate, (msg: dsc.Message) => msg,
            action => [ActionEventType.OnMessageCreate, ActionEventType.OnMessageCreateOrEdit].includes(action.activationEventType)
        );
        this.handleEvent(client, 'messageUpdate', ActionEventType.OnMessageEdit, (_old, newMsg: dsc.Message) => newMsg,
            action => [ActionEventType.OnMessageEdit, ActionEventType.OnMessageCreateOrEdit].includes(action.activationEventType)
        );
        this.handleEvent(client, 'messageDelete', ActionEventType.OnMessageDelete, (msg: dsc.Message) => msg);

        // ---- Reaction Events ----
        this.handleEvent(client, 'messageReactionAdd', ActionEventType.OnMessageReactionAdd, (reaction: dsc.MessageReaction, user: dsc.User) => ({ reaction, user }));
        this.handleEvent(client, 'messageReactionRemove', ActionEventType.OnMessageReactionRemove, (reaction: dsc.MessageReaction, user: dsc.User) => ({ reaction, user }));

        // ---- User Events ----
        this.handleEvent(client, 'guildMemberAdd', ActionEventType.OnUserJoin, (member: dsc.GuildMember) => member.user);
        this.handleEvent(client, 'guildMemberRemove', ActionEventType.OnUserQuit, (member: dsc.GuildMember) => member.user);

        // ---- Threads Events ----
        this.handleEvent(client, 'threadCreate', ActionEventType.OnThreadCreate, (thread: dsc.ThreadChannel) => thread);
        this.handleEvent(client, 'threadDelete', ActionEventType.OnThreadDelete, (thread: dsc.ThreadChannel) => thread);

        // ---- Channels Events ----
        this.handleEvent(client, 'channelCreate', ActionEventType.OnChannelCreate, (channel: dsc.Channel) => channel);
        this.handleEvent(client, 'channelDelete', ActionEventType.OnChannelDelete, (channel: dsc.Channel) => channel);
        this.handleEvent(client, 'channelUpdate', ActionEventType.OnChannelUpdate, (_old, newChannel: dsc.Channel) => newChannel);

        // ---- Voice Channels Events ----
        this.handleEvent<VoiceChannelsEventCtx>(
            client, 'voiceStateUpdate', ActionEventType.OnVoiceChannelJoin,
            (oldState, newState) => ({ channel: newState.channel, user: newState.member.user }),
            (action, oldState, newState) => newState.channelId && !oldState.channelId,
        );
        this.handleEvent<VoiceChannelsEventCtx>(
            client, 'voiceStateUpdate', ActionEventType.OnVoiceChannelQuit,
            (oldState, newState) => ({ channel: oldState.channel, user: oldState.member.user }),
            (action, oldState, newState) => oldState.channelId && !newState.channelId,
        );
        this.handleEvent<VoiceChannelsEventCtx>(
            client, 'voiceStateUpdate', ActionEventType.OnVoiceChannelStartStream,
            (oldState, newState) => ({ channel: newState.channel, user: newState.member.user }),
            (action, oldState, newState) => newState.streaming && !oldState.streaming,
        );
        this.handleEvent<VoiceChannelsEventCtx>(
            client, 'voiceStateUpdate', ActionEventType.OnVoiceChannelEndStream,
            (oldState, newState) => ({ channel: newState.channel, user: newState.member.user }),
            (action, oldState, newState) => oldState.streaming && !newState.streaming,
        );
        this.handleEvent<VoiceChannelsEventCtx>(
            client, 'voiceStateUpdate', ActionEventType.OnVoiceChannelMute,
            (oldState, newState) => ({ channel: newState.channel, user: newState.member.user }),
            (action, oldState, newState) => !oldState.mute && newState.mute,
        );
        this.handleEvent<VoiceChannelsEventCtx>(
            client, 'voiceStateUpdate', ActionEventType.OnVoiceChannelSelfMute,
            (oldState, newState) => ({ channel: newState.channel, user: newState.member.user }),
            (action, oldState, newState) => !oldState.selfMute && newState.selfMute,
        );
        this.handleEvent<VoiceChannelsEventCtx>(
            client, 'voiceStateUpdate', ActionEventType.OnVoiceChannelDeaf,
            (oldState, newState) => ({ channel: newState.channel, user: newState.member.user }),
            (action, oldState, newState) => !oldState.deaf && newState.deaf,
        );
        this.handleEvent<VoiceChannelsEventCtx>(
            client, 'voiceStateUpdate', ActionEventType.OnVoiceChannelSelfDeaf,
            (oldState, newState) => ({ channel: newState.channel, user: newState.member.user }),
            (action, oldState, newState) => !oldState.selfDeaf && newState.selfDeaf,
        );
    }
}

export const actionsManager = new ActionManager();