import { Action, PredefinedActionEventTypes, ActionCallback, ConstraintCallback, Skip, Ok, AnyAction } from '../actions.js';
import { MessageEventCtx, UserEventCtx, VoiceChannelsEventCtx, ThreadEventCtx, ChannelEventCtx } from '../actions.js';
import { PredefinedActionCallbacks, PredefinedActionConstraints } from '../actions.js';

import { mkAutoreplyAction } from './autoreply.js';

import { cfg } from '@/bot/cfg.js'

import * as dsc from 'discord.js';
import * as log from '@/util/log.js';

export default class AutoModRules {
    static readonly msgAuthorIsNotImmuneToAutomod = (msg: MessageEventCtx) => {
        for (const role of cfg.cheatsRoles.automodBypassRoles) {
            if (PredefinedActionConstraints.userHasRole(role)(msg.member) == Ok) return Skip;
        }
        return Ok;
    };

    static readonly EveryoneAutoreply: Action<MessageEventCtx> = mkAutoreplyAction({
        activationOptions: [
            { type: 'contains', keyword: '@everyone' },
            { type: 'contains', keyword: 'małpa everyone' },
            { type: 'contains', keyword: '@here' },
            { type: 'contains', keyword: 'małpa here' },
        ],
        reply: (msg) => `Upomnienie dla <@${msg.author.id}> za próbe pingu everyone!!11!1@!!`,
        additionalConstraints: [ AutoModRules.msgAuthorIsNotImmuneToAutomod ],
    });

    static readonly BlockInvites: Action<MessageEventCtx> = mkAutoreplyAction({
        activationOptions: [
            {
                type: 'matches-regex',
                keyword: '(?:https?:\\/\\/)?(?:www\\.)?(?:discord\\.gg|discord\\.com\\/invite)\\/[A-Za-z0-9]+'
            },
            {
                type: 'matches-regex',
                keyword: '(?:discord\\.gg|discord\\.com\\/invite)\\/[A-Za-z0-9]{4,}'
            },
        ],
        reply: 'Wypier*alaj ze swoją reklamą na serwery reklamowe ;)',
        additionalCallbacks: [ PredefinedActionCallbacks.deleteMsg ],
        additionalConstraints: [ AutoModRules.msgAuthorIsNotImmuneToAutomod ],
    });

    static readonly BlockNWords: Action<MessageEventCtx> = mkAutoreplyAction({
        activationOptions: [
            { type: 'contains', keyword: 'nigger' },
            { type: 'contains', keyword: 'nigga' },
            { type: 'contains', keyword: 'czarnuch' },
        ],
        reply: 'osoba na którą wiadomość odpowiadam jest gejem 🥀',
        additionalConstraints: [ AutoModRules.msgAuthorIsNotImmuneToAutomod ],
    });

    static readonly BlockAnime: Action<MessageEventCtx> = mkAutoreplyAction({
        activationOptions: [
            { type: 'contains', keyword: 'anime' },
        ],
        reply: 'osoba na którą wiadomość odpowiadam jest gejem 🥀',
        additionalConstraints: [ () => Math.random() < 0.14, AutoModRules.msgAuthorIsNotImmuneToAutomod ],
    });

    static readonly Ecliar25VideoQuestion: Action<MessageEventCtx> = mkAutoreplyAction({
        activationOptions: [
            { type: 'is-equal-to', keyword: 'kiedy odcinek' },
            { type: 'is-equal-to', keyword: 'kiedy odcinek?' },
            { type: 'is-equal-to', keyword: 'kiedy film' },
            { type: 'is-equal-to', keyword: 'kiedy film?' },
        ],
        reply: 'nigdy - powiedział StartIT, ale ponieważ startit jest jebanym gównem no to spinguj eklerke by odpowiedział',
        additionalConstraints: [],
    })

    static readonly GitHubAutoreply: Action<MessageEventCtx> = mkAutoreplyAction({
        activationOptions: [
            { type: 'is-equal-to', keyword: 'git' }
        ],
        reply: 'hub'
    });

    static readonly InwiduaUnderflowAutoReply: Action<MessageEventCtx> = mkAutoreplyAction(
        {
            activationOptions: [
                { type: 'contains', keyword: 'inwidua' },
                { type: 'contains', keyword: 'underflow' },
                { type: 'contains', keyword: 'jakyb' }
            ],
            reply: '*zdrajca piekarni'
        }
    );

    static all(): AnyAction[] {
        const rules = [
            //AutoModRules.EveryoneAutoreply,
            //AutoModRules.Ecliar25VideoQuestion,
            AutoModRules.GitHubAutoreply,
            AutoModRules.BlockInvites,
            AutoModRules.BlockNWords,
            //AutoModRules.BlockAnime,
            //AutoModRules.InwiduaUnderflowAutoReply,
        ];
        return rules;
    }
}
