import { Action, Skip, Ok, AnyAction, MessageEventCtx, PredefinedActionCallbacks, PredefinedActionConstraints } from '../index.js';

import { mkAutoreplyAction } from '../autoreply.js';

import { cfg } from '@/bot/cfg.js'

import * as dsc from 'discord.js';
import * as log from '@/util/log.js';
import { client } from '@/client.js';

export default class AutoModRules {
    static readonly msgAuthorIsNotImmuneToAutomod = (msg: MessageEventCtx) => {
        for (const role of [...cfg.roles.automodBypassRoles, cfg.roles.eclair25, cfg.roles.secondLevelOwner, cfg.roles.headAdmin]) {
            if (PredefinedActionConstraints.userHasRole(role)(msg.member!) == Ok) return Skip;
        }

        if (msg.author.id == client.user!.id) return Skip;

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
        additionalCallbacks: [ PredefinedActionCallbacks.deleteMsg ]
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

    static readonly GitHubAutoreply: Action<MessageEventCtx> = mkAutoreplyAction({
        activationOptions: [
            { type: 'is-equal-to', keyword: 'git' }
        ],
        reply: 'hub'
    });

    static all(): AnyAction[] {
        const rules = [
            AutoModRules.EveryoneAutoreply,
            AutoModRules.GitHubAutoreply,
            AutoModRules.BlockInvites,
            AutoModRules.BlockNWords,
        ];
        return rules;
    }
}
