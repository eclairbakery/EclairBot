import { cfg } from '@/bot/cfg.ts';
import { output } from '@/bot/logging.ts';
import * as dsc from 'discord.js';
import { Action, PredefinedActionEventTypes, ReactionEventCtx } from '../index.ts';
import { mkMessageReferenceEmbed } from '@/bot/templates/messageReference.ts';

const alreadyInHallOfFame: dsc.Snowflake[] = [];

export const hallOfFameAction: Action<ReactionEventCtx> = {
    activationEventType: PredefinedActionEventTypes.OnMessageReactionAdd,
    constraints: [
        () => true,
    ],
    callbacks: [
        async ({ reaction }) => {
            if (reaction.partial) {
                try {
                    await reaction.fetch();
                    if (!reaction.message.inGuild()) return;
                } catch (err) {
                    output.err(err);
                    return;
                }
            }

            const msg = reaction.message;
            const count = reaction.count;
            const emoji = reaction.emoji.name;

            if ((emoji === '⭐' || emoji === '💎' || emoji === '🔥') && count === 3 && cfg.features.hallOfFame.eligibleChannels.includes(msg.channelId)) {
                if (!cfg.features.hallOfFame.enabled) {
                    await reaction.message.reply('hall of fame jest wyłączony/zaarchiwizowany btw; miałeś szanse ale wyłączyli');
                    return;
                }

                const channel = await msg.guild?.channels.fetch(cfg.features.hallOfFame.channel);
                if (!channel) return;
                if (!channel.isTextBased()) return;
                if (alreadyInHallOfFame.includes(msg.id)) return;
                alreadyInHallOfFame.push(msg.id);
                
                channel.send({ embeds: [ await mkMessageReferenceEmbed( msg.channelId, msg.id, `#${Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0')}` ) ] }); 
            }
        },
    ],
};
