import { Action, MessageEventCtx, PredefinedActionEventTypes } from '@/features/actions/index.ts';
import { cfg } from '@/bot/cfg.ts';
import { GuildTextBasedChannel } from 'discord.js';
import { mkMessageReferenceEmbed } from '@/bot/templates/message-reference.ts';
import { PredefinedColors } from '@/util/color.ts';

export const deleteMessageAction: Action<MessageEventCtx> = {
    name: "logs/delete-messages",
    activatesOn: PredefinedActionEventTypes.OnMessageDelete,
    
    constraints: [ () => true ],
    callbacks: [
        async (msg) => {
            const logs_channel = await msg.client.channels.fetch(cfg.channels.mod.logs) as GuildTextBasedChannel;
            logs_channel.send({
                embeds: [
                    await mkMessageReferenceEmbed(msg, { 
                        title: "Wiadomość została usunięta", 
                        color: PredefinedColors.Red 
                    })
                ]
            });
        }
    ]
};
