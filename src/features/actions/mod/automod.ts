import { Action, AnyAction, MessageEventCtx, PredefinedActionCallbacks, PredefinedActionEventTypes } from '../index.ts';

import { mkAutoreplyAction } from '../autoreply.ts';

import { cfg } from '@/bot/cfg.ts';
import { client } from '@/client.ts';

export default class AutoModRules {
    static readonly msgAuthorIsNotImmuneToAutomod = (msg: MessageEventCtx) => {
        for (const role of [...cfg.hierarchy.automodBypassRoles, cfg.hierarchy.administration.eclair25, cfg.hierarchy.administration.headAdmin]) {
            if (msg.member!.roles.cache.has(role)) return false;
        }

        return msg.author.id !== client.user!.id;
    };

    static readonly EveryoneAutoreply: Action<MessageEventCtx> = mkAutoreplyAction({
        activationOptions: [
            { type: 'contains', keyword: '@everyone' },
            { type: 'contains', keyword: 'małpa everyone' },
            { type: 'contains', keyword: '@here' },
            { type: 'contains', keyword: 'małpa here' },
        ],
        reply: (msg) => `Upomnienie dla <@${msg.author.id}> za próbe pingu everyone!!11!1@!!`,
        additionalConstraints: [AutoModRules.msgAuthorIsNotImmuneToAutomod],
        additionalCallbacks: [PredefinedActionCallbacks.deleteMsg],
    });

    static readonly BlockInvites: Action<MessageEventCtx> = mkAutoreplyAction({
        activationOptions: [
            {
                type: 'matches-regex',
                keyword: '(?:https?:\\/\\/)?(?:www\\.)?(?:discord\\.gg|discord\\.com\\/invite)\\/[A-Za-z0-9]+',
            },
            {
                type: 'matches-regex',
                keyword: '(?:discord\\.gg|discord\\.com\\/invite)\\/[A-Za-z0-9]{4,}',
            },
        ],
        reply: 'Wypier*alaj ze swoją reklamą na serwery reklamowe ;)',
        additionalCallbacks: [PredefinedActionCallbacks.deleteMsg],
        additionalConstraints: [AutoModRules.msgAuthorIsNotImmuneToAutomod],
    });

    static readonly BlockNonSafeMessages: Action<MessageEventCtx> = {
        name: 'auto-reply/automod/block-non-safe-messages',
        activatesOn: PredefinedActionEventTypes.OnMessageCreateOrEdit,
        constraints: [
            (ctx) => ctx.author.id !== ctx.client.user.id,
            (ctx) => ctx.channel.id == cfg.channels.other.safeChat 
        ],

        callbacks: [
            async (msg) => {
                // regex expressions from chatgpt lmao
                const signedRegex =
                    /^-----BEGIN PGP SIGNED MESSAGE-----\r?\nHash: .+\r?\n\r?\n[\s\S]+?\r?\n-----BEGIN PGP SIGNATURE-----\r?\n\r?\n(?:[A-Za-z0-9+/=\r\n]+)\r?\n-----END PGP SIGNATURE-----$/;
                const encryptedRegex =
                    /^-----BEGIN PGP MESSAGE-----\r?\n\r?\n(?:[A-Za-z0-9+/=\r\n]+)\r?\n-----END PGP MESSAGE-----$/;
                const onlyMentionsRegex =
                    /^(?:\s*(?:<@!?\d+>|<@&\d+>|@everyone|@here)\s*)+$/;

                if (!signedRegex.test(msg.content) && !encryptedRegex.test(msg.content) && !onlyMentionsRegex.test(msg.content)) {
                    await msg.reply(`<@${msg.author.id}> naucz sie uzywac tego kanału na <#${cfg.channels.other.info}>, pozdrawiam`);
                    if (msg.deletable) await msg.delete();
                }
            }
        ]
    };

    static readonly BlockNWords: Action<MessageEventCtx> = mkAutoreplyAction({
        activationOptions: [
            { type: 'contains', keyword: 'nigger' },
            { type: 'contains', keyword: 'nigga' },
            { type: 'contains', keyword: 'czarnuch' },
        ],
        reply: 'osoba na którą wiadomość odpowiadam jest gejem 🥀',
        additionalConstraints: [AutoModRules.msgAuthorIsNotImmuneToAutomod],
    });

    static readonly GitHubAutoreply: Action<MessageEventCtx> = mkAutoreplyAction({
        activationOptions: [
            { type: 'is-equal-to', keyword: 'git' },
        ],
        reply: 'hub',
    });

    static all(): AnyAction[] {
        const rules = [
            AutoModRules.EveryoneAutoreply,
            AutoModRules.GitHubAutoreply,
            AutoModRules.BlockInvites,
            AutoModRules.BlockNWords,
            AutoModRules.BlockNonSafeMessages
        ];
        console.log(rules);
        return rules;
    }
}
