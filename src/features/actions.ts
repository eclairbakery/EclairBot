import * as log from '../util/log.js';
import * as dsc from 'discord.js';

// import { MessageEventCtx, UserEventCtx, VoiceChannelsEventCtx, ThreadEventCtx, ChannelEventCtx }
export type MessageEventCtx       = dsc.Message;
export type ReactionEventCtx      = { reaction: dsc.MessageReaction, user: dsc.User };
export type UserEventCtx          = dsc.GuildMember;
export type BanEventCtx           = dsc.GuildBan;
export type VoiceChannelsEventCtx = { channel: dsc.VoiceBasedChannel, user: dsc.GuildMember };
export type ThreadEventCtx        = dsc.ThreadChannel;
export type ChannelEventCtx       = dsc.Channel;

export type AnyEventCtx =
    | MessageEventCtx
    | UserEventCtx
    | VoiceChannelsEventCtx
    | ThreadEventCtx
    | ChannelEventCtx
    | ReactionEventCtx
    | BanEventCtx
    | any /* for custom events */
;;

export type ActionCallback<CtxType> = (ctx: CtxType) => void | Promise<any>;
export type AnyActionCallback       = (ctx: AnyEventCtx) => void;

export type ConstraintCallback<CtxType> = (ctx: CtxType) => boolean;
export type AnyConstraintCallback       = (ctx: AnyEventCtx) => boolean;
export const Skip = false;
export const Ok = true;

export type ActionEventType = symbol;

export class PredefinedActionEventTypes {
    // message events
    static readonly OnMessageCreate:       ActionEventType = Symbol('OnMessageCreate');
    static readonly OnMessageEdit:         ActionEventType = Symbol('OnMessageEdit');
    static readonly OnMessageCreateOrEdit: ActionEventType = Symbol('OnMessageCreateOrEdit');
    static readonly OnMessageDelete:       ActionEventType = Symbol('OnMessageDelete');

    // reaction events
    static readonly OnMessageReactionAdd:    ActionEventType = Symbol('OnMessageReactionAdd');
    static readonly OnMessageReactionRemove: ActionEventType = Symbol('OnMessageReactionRemove');

    // user events
    static readonly OnUserJoin: ActionEventType = Symbol('OnUserJoin');
    static readonly OnUserQuit: ActionEventType = Symbol('OnUserQuit');

    // bans events
    static readonly OnUserBan:   ActionEventType = Symbol('OnUserBan');
    static readonly OnUserUnban: ActionEventType = Symbol('OnUserUnban');

    // threads events
    static readonly OnThreadCreate: ActionEventType = Symbol('OnThreadCreate');
    static readonly OnThreadDelete: ActionEventType = Symbol('OnThreadDelete');
    static readonly OnThreadUpdate: ActionEventType = Symbol('OnThreadUpdate');

    // channels events
    static readonly OnChannelCreate: ActionEventType = Symbol('OnChannelCreate');
    static readonly OnChannelDelete: ActionEventType = Symbol('OnChannelDelete');
    static readonly OnChannelUpdate: ActionEventType = Symbol('OnChannelUpdate');

    // voice channels events
    static readonly OnVoiceChannelJoin:        ActionEventType = Symbol('OnVoiceChannelJoin');
    static readonly OnVoiceChannelQuit:        ActionEventType = Symbol('OnVoiceChannelQuit');
    static readonly OnVoiceChannelStartStream: ActionEventType = Symbol('OnVoiceChannelStartStream');
    static readonly OnVoiceChannelEndStream:   ActionEventType = Symbol('OnVoiceChannelEndStream');
    static readonly OnVoiceChannelMute:        ActionEventType = Symbol('OnVoiceChannelMute');
    static readonly OnVoiceChannelSelfMute:    ActionEventType = Symbol('OnVoiceChannelSelfMute');
    static readonly OnVoiceChannelDeaf:        ActionEventType = Symbol('OnVoiceChannelDeaf');
    static readonly OnVoiceChannelSelfDeaf:    ActionEventType = Symbol('OnVoiceChannelSelfDeaf');
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

    static msgMatchesRegex(regex: string | RegExp): ConstraintCallback<MessageEventCtx> {
        const re = typeof regex === 'string' ? new RegExp(regex) : regex;
        return (msg) => {
            if (re.test(msg.content)) return Ok;
            return Skip;
        };
    }

    static userHasRole(roleId: dsc.Snowflake): ConstraintCallback<UserEventCtx> {
        return (userCtx) => {
            if (userCtx.roles.cache.has(roleId)) return Ok;
            return Skip;
        };
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
        const eventTypes = action.activationEventType === PredefinedActionEventTypes.OnMessageCreateOrEdit
            ? [PredefinedActionEventTypes.OnMessageCreate, PredefinedActionEventTypes.OnMessageEdit]
            : [action.activationEventType];

        for (const eventType of eventTypes) {
            if (!this.actions.has(eventType)) this.actions.set(eventType, []);
            this.actions.get(eventType)?.push(action);
        }
    }

    addActions(...actions: AnyAction[]) {
        for (const action of actions) {
            this.addAction(action);
        }
    }

    registerEvents(client: dsc.Client): void {
        // ---- Message Events ----
        this.handleEvent(client, 'messageCreate', PredefinedActionEventTypes.OnMessageCreate, (msg: dsc.Message) => msg,
            action => [PredefinedActionEventTypes.OnMessageCreate, PredefinedActionEventTypes.OnMessageCreateOrEdit].includes(action.activationEventType)
        );
        this.handleEvent(client, 'messageUpdate', PredefinedActionEventTypes.OnMessageEdit, (_old, newMsg: dsc.Message) => newMsg,
            action => [PredefinedActionEventTypes.OnMessageEdit, PredefinedActionEventTypes.OnMessageCreateOrEdit].includes(action.activationEventType)
        );
        this.handleEvent(client, 'messageDelete', PredefinedActionEventTypes.OnMessageDelete, (msg: dsc.Message) => msg);

        // ---- Reaction Events ----
        this.handleEvent(client, 'messageReactionAdd', PredefinedActionEventTypes.OnMessageReactionAdd, (reaction: dsc.MessageReaction, user: dsc.User) => ({ reaction, user }));
        this.handleEvent(client, 'messageReactionRemove', PredefinedActionEventTypes.OnMessageReactionRemove, (reaction: dsc.MessageReaction, user: dsc.User) => ({ reaction, user }));

        // ---- User Events ----
        this.handleEvent(client, 'guildMemberAdd', PredefinedActionEventTypes.OnUserJoin, (member: dsc.GuildMember) => member);
        this.handleEvent(client, 'guildMemberRemove', PredefinedActionEventTypes.OnUserQuit, (member: dsc.GuildMember) => member);

        // ---- Threads Events ----
        this.handleEvent(client, 'threadCreate', PredefinedActionEventTypes.OnThreadCreate, (thread: dsc.ThreadChannel) => thread);
        this.handleEvent(client, 'threadDelete', PredefinedActionEventTypes.OnThreadDelete, (thread: dsc.ThreadChannel) => thread);

        // ---- Channels Events ----
        this.handleEvent(client, 'channelCreate', PredefinedActionEventTypes.OnChannelCreate, (channel: dsc.Channel) => channel);
        this.handleEvent(client, 'channelDelete', PredefinedActionEventTypes.OnChannelDelete, (channel: dsc.Channel) => channel);
        this.handleEvent(client, 'channelUpdate', PredefinedActionEventTypes.OnChannelUpdate, (_old, newChannel: dsc.Channel) => newChannel);

        // ---- Voice Channels Events ----
        this.handleEvent<VoiceChannelsEventCtx>(
            client, 'voiceStateUpdate', PredefinedActionEventTypes.OnVoiceChannelJoin,
            (oldState, newState) => ({ channel: newState.channel, user: newState.member.user }),
            (action, oldState, newState) => newState.channelId && !oldState.channelId,
        );
        this.handleEvent<VoiceChannelsEventCtx>(
            client, 'voiceStateUpdate', PredefinedActionEventTypes.OnVoiceChannelQuit,
            (oldState, newState) => ({ channel: oldState.channel, user: oldState.member.user }),
            (action, oldState, newState) => oldState.channelId && !newState.channelId,
        );
        this.handleEvent<VoiceChannelsEventCtx>(
            client, 'voiceStateUpdate', PredefinedActionEventTypes.OnVoiceChannelStartStream,
            (oldState, newState) => ({ channel: newState.channel, user: newState.member.user }),
            (action, oldState, newState) => newState.streaming && !oldState.streaming,
        );
        this.handleEvent<VoiceChannelsEventCtx>(
            client, 'voiceStateUpdate', PredefinedActionEventTypes.OnVoiceChannelEndStream,
            (oldState, newState) => ({ channel: newState.channel, user: newState.member.user }),
            (action, oldState, newState) => oldState.streaming && !newState.streaming,
        );
        this.handleEvent<VoiceChannelsEventCtx>(
            client, 'voiceStateUpdate', PredefinedActionEventTypes.OnVoiceChannelMute,
            (oldState, newState) => ({ channel: newState.channel, user: newState.member.user }),
            (action, oldState, newState) => !oldState.mute && newState.mute,
        );
        this.handleEvent<VoiceChannelsEventCtx>(
            client, 'voiceStateUpdate', PredefinedActionEventTypes.OnVoiceChannelSelfMute,
            (oldState, newState) => ({ channel: newState.channel, user: newState.member.user }),
            (action, oldState, newState) => !oldState.selfMute && newState.selfMute,
        );
        this.handleEvent<VoiceChannelsEventCtx>(
            client, 'voiceStateUpdate', PredefinedActionEventTypes.OnVoiceChannelDeaf,
            (oldState, newState) => ({ channel: newState.channel, user: newState.member.user }),
            (action, oldState, newState) => !oldState.deaf && newState.deaf,
        );
        this.handleEvent<VoiceChannelsEventCtx>(
            client, 'voiceStateUpdate', PredefinedActionEventTypes.OnVoiceChannelSelfDeaf,
            (oldState, newState) => ({ channel: newState.channel, user: newState.member.user }),
            (action, oldState, newState) => !oldState.selfDeaf && newState.selfDeaf,
        );

        this.handleEvent(client, 'guildBanAdd', PredefinedActionEventTypes.OnUserBan, (ban: dsc.GuildBan) => ban);
        this.handleEvent(client, 'guildBanRemove', PredefinedActionEventTypes.OnUserUnban, (ban: dsc.GuildBan) => ban);
    }

    async emit<CtxType>(eventType: ActionEventType, ctx: CtxType) {
        const actions = this.actions.get(eventType);
        if (!actions) return;

    actionsLoop:
        for (const action of actions) {
            // check constraints
            for (const constraint of action.constraints) {
                if (constraint(ctx as any) == Skip) {
                    continue actionsLoop;
                }
            }

            // execute callbacks
            for (const callback of action.callbacks) {
                const result = callback(ctx as any);
                if (result && typeof (result as any).then === "function") {
                    await result;
                }
            }
        }
    }

    mkEvent(name: string): ActionEventType {
        return Symbol(name);
    }
}

const actionsManager = new ActionManager();
export default actionsManager;