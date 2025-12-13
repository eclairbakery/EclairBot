import * as dsc from 'discord.js';

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
;;

export const MagicSkipAllActions = Symbol('MagicSkipAllActions');

export type ActionCallback<CtxType> = (ctx: CtxType) => void | Promise<any> | symbol | Promise<symbol>;
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

    // mute events
    static readonly OnUserMute:   ActionEventType = Symbol('OnUserMute');
    static readonly OnUserUnmute: ActionEventType = Symbol('OnUserUnmute');

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
    activationEventType: ActionEventType | ActionEventType[];
    constraints: ConstraintCallback<CallbackCtxType>[];
    callbacks: ActionCallback<CallbackCtxType>[];
}

export type AnyAction = Action<AnyEventCtx>;

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
            if (msg.content.toLowerCase().includes(text.toLowerCase())) return Ok;
            return Skip;
        };
    }

    static msgIsEqualTo(text: string): ConstraintCallback<MessageEventCtx> {
        return (msg) => {
            if (msg.content.toLowerCase() == text.toLowerCase()) return Ok;
            return Skip;
        };
    }

    static msgStartsWith(prefix: string): ConstraintCallback<MessageEventCtx> {
        return (msg) => {
            if (msg.content.toLowerCase().startsWith(prefix.toLowerCase())) return Ok;
            return Skip;
        }
    }

    static msgEndsWith(suffix: string): ConstraintCallback<MessageEventCtx> {
        return (msg) => {
            if (msg.content.toLowerCase().endsWith(suffix.toLowerCase())) return Ok;
            return Skip;
        }
    }

    static msgMatchesRegex(regex: string | RegExp): ConstraintCallback<MessageEventCtx> {
        const re = typeof regex == 'string' ? new RegExp(regex) : regex;
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

            if (eventName == 'messageCreate') {
                if (!(ctx as MessageEventCtx).inGuild()) return;
                if (!(ctx as MessageEventCtx).member) return;
            }

            let skipAll = false;

        actionsLoop:
            for (const action of this.actions.get(eventType) ?? []) {
                if (skipAll) break;

                if (actionFilter && !actionFilter(action, ...args)) continue;

                for (const constraint of action.constraints) {
                    if (constraint(ctx) == Skip) {
                        continue actionsLoop;
                    }
                }

                for (const callback of action.callbacks) {
                    const result = callback(ctx);
                    const awaited = result instanceof Promise ? await result : result;

                    if (awaited === MagicSkipAllActions) {
                        skipAll = true;
                        break;
                    }
                }
            }
        });
    }

    addAction(action: AnyAction) {
        const eventTypes = action.activationEventType === PredefinedActionEventTypes.OnMessageCreateOrEdit
            ? [PredefinedActionEventTypes.OnMessageCreate, PredefinedActionEventTypes.OnMessageEdit]
            : (
                typeof action.activationEventType == 'object'
                    ? action.activationEventType
                    : [ action.activationEventType ]
            );

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
        this.handleEvent(
            client,
            'messageCreate',
            PredefinedActionEventTypes.OnMessageCreate,
            (msg: dsc.Message) => msg,
            action => {
                const types = [
                    PredefinedActionEventTypes.OnMessageCreate,
                    PredefinedActionEventTypes.OnMessageCreateOrEdit
                ];
                const a = action.activationEventType;
                return Array.isArray(a)
                    ? a.some(t => types.includes(t))
                    : types.includes(a);
            }
        );
        this.handleEvent(
            client,
            'messageUpdate',
            PredefinedActionEventTypes.OnMessageEdit,
            (_old, newMsg: dsc.Message) => newMsg,
            (action, oldMsg: dsc.Message, newMsg: dsc.Message) => {
                const types = [
                    PredefinedActionEventTypes.OnMessageEdit,
                    PredefinedActionEventTypes.OnMessageCreateOrEdit
                ];
                const a = action.activationEventType;
                return (
                    (Array.isArray(a)
                        ? a.some(t => types.includes(t))
                        : types.includes(a))
                    && oldMsg.content !== newMsg.content
                );
            }
        );
        this.handleEvent(client, 'messageDelete', PredefinedActionEventTypes.OnMessageDelete, (msg: dsc.Message) => msg);

        // ---- Reaction Events ----
        this.handleEvent(client, 'messageReactionAdd', PredefinedActionEventTypes.OnMessageReactionAdd, (reaction: dsc.MessageReaction, user: dsc.User) => ({ reaction, user }));
        this.handleEvent(client, 'messageReactionRemove', PredefinedActionEventTypes.OnMessageReactionRemove, (reaction: dsc.MessageReaction, user: dsc.User) => ({ reaction, user }));

        // ---- User Events ----
        this.handleEvent(client, 'guildMemberAdd', PredefinedActionEventTypes.OnUserJoin, (member: dsc.GuildMember) => member);
        this.handleEvent(client, 'guildMemberRemove', PredefinedActionEventTypes.OnUserQuit, (member: dsc.GuildMember) => member);

        // ---- Mute Events ----
        this.handleEvent(client, 'guildMemberUpdate', PredefinedActionEventTypes.OnUserMute,
            (_old, newMember: dsc.GuildMember) => newMember,
            (_action, oldMember: dsc.GuildMember, newMember: dsc.GuildMember) => !oldMember.isCommunicationDisabled() && newMember.isCommunicationDisabled()
        );
        this.handleEvent(client, 'guildMemberUpdate', PredefinedActionEventTypes.OnUserUnmute,
            (_old, newMember: dsc.GuildMember) => newMember,
            (_action, oldMember: dsc.GuildMember, newMember: dsc.GuildMember) => oldMember.isCommunicationDisabled() && !newMember.isCommunicationDisabled()
        );

        // ---- Threads Events ----
        this.handleEvent(client, 'threadCreate', PredefinedActionEventTypes.OnThreadCreate, (thread: dsc.ThreadChannel) => thread);
        this.handleEvent(client, 'threadDelete', PredefinedActionEventTypes.OnThreadDelete, (thread: dsc.ThreadChannel) => thread);

        // ---- Channels Events ----
        this.handleEvent(client, 'channelCreate', PredefinedActionEventTypes.OnChannelCreate, (channel: dsc.Channel) => channel);
        this.handleEvent(client, 'channelDelete', PredefinedActionEventTypes.OnChannelDelete, (channel: dsc.Channel) => channel);
        this.handleEvent(client, 'channelUpdate', PredefinedActionEventTypes.OnChannelUpdate, (_old, newChannel: dsc.Channel) => newChannel);

        // ---- Voice Channels Events ----
        this.handleEvent(
            client, 'voiceStateUpdate', PredefinedActionEventTypes.OnVoiceChannelJoin,
            (oldState, newState) => ({ channel: newState.channel, user: newState.member.user }),
            (action, oldState, newState) => newState.channelId && !oldState.channelId,
        );
        this.handleEvent(
            client, 'voiceStateUpdate', PredefinedActionEventTypes.OnVoiceChannelQuit,
            (oldState, newState) => ({ channel: oldState.channel, user: oldState.member.user }),
            (action, oldState, newState) => oldState.channelId && !newState.channelId,
        );
        this.handleEvent(
            client, 'voiceStateUpdate', PredefinedActionEventTypes.OnVoiceChannelStartStream,
            (oldState, newState) => ({ channel: newState.channel, user: newState.member.user }),
            (action, oldState, newState) => newState.streaming && !oldState.streaming,
        );
        this.handleEvent(
            client, 'voiceStateUpdate', PredefinedActionEventTypes.OnVoiceChannelEndStream,
            (oldState, newState) => ({ channel: newState.channel, user: newState.member.user }),
            (action, oldState, newState) => oldState.streaming && !newState.streaming,
        );
        this.handleEvent(
            client, 'voiceStateUpdate', PredefinedActionEventTypes.OnVoiceChannelMute,
            (oldState, newState) => ({ channel: newState.channel, user: newState.member.user }),
            (action, oldState, newState) => !oldState.mute && newState.mute,
        );
        this.handleEvent(
            client, 'voiceStateUpdate', PredefinedActionEventTypes.OnVoiceChannelSelfMute,
            (oldState, newState) => ({ channel: newState.channel, user: newState.member.user }),
            (action, oldState, newState) => !oldState.selfMute && newState.selfMute,
        );
        this.handleEvent(
            client, 'voiceStateUpdate', PredefinedActionEventTypes.OnVoiceChannelDeaf,
            (oldState, newState) => ({ channel: newState.channel, user: newState.member.user }),
            (action, oldState, newState) => !oldState.deaf && newState.deaf,
        );
        this.handleEvent(
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
                const result = await callback(ctx as any);
                if (result && typeof (result as any).then === "function") {
                    if (await result == MagicSkipAllActions) {
                        break actionsLoop;
                    }
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