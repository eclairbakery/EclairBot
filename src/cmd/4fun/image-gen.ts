import { type Command } from '@/bot/command.ts';
import { CommandFlags } from '@/bot/apis/commands/misc.ts';
import { CommandPermissions } from '@/bot/apis/commands/permissions.ts';
import logError from '@/util/log-error.ts';
import { ReplyEmbed } from '@/bot/apis/translations/reply-embed.ts';
import { PredefinedColors } from '@/util/color.ts';
import { AttachmentBuilder } from 'discord.js';
import { Buffer } from 'node:buffer';

export default {
    name: 'gen-image',
    aliases: ['image'],
    description: {
        main: 'Generuje obraz używając takiego fajnego API z internetu.',
        short: 'Generuje nowy obraz'
    },

    flags: CommandFlags.None,
    permissions: CommandPermissions.everyone(),

    expectedArgs: [
        {
            name: "resolution", type: { base: "enum", options: ["16:9", "1:1"] },
            optional: false, description: "No jakie proporcje obrazu"
        },
        {
            name: "prompt", type: { base: "string", trailing: true },
            optional: false, description: "Twój prompt"
        }
    ],

    async execute(api) {
        async function handleError(result: Uint8Array<ArrayBuffer>): Promise<boolean> {
            const decoded = new TextDecoder().decode(result).trim();
            if (!decoded.startsWith('{') || !decoded.endsWith('}')) return false;
            logError("stdwarn", new Error(decoded), "Image generation API");
            await api.log.replyError(api, 'Masz problem lol', 'Niestety model generujący obrazy się zepsuł i ma problem, jak jesteś adminem sprawdź stdwarn.');
            return true;
        }

        function getImageResolution(proportions: '16:9' | '1:1') {
            switch (proportions) {
            case '16:9':
                return {
                    width: 1920,
                    height: 1080
                };
            case '1:1':
                return {
                    width: 1024,
                    height: 1024
                };
            }
        }

        const api_shit = 'https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell';
        const shit_headers = {
            "Authorization": `Bearer ${Deno.env.get("JB_IMAGE_GEN_API_KEY")}`,
            "Content-Type": "application/json"
        };
        const shit_body = {
            inputs: api.getTypedArg('prompt', 'string').value,
            parameters: getImageResolution(api.getEnumArg('resolution', ['16:9', '1:1']).value) 
        };
        const fetched_slop = await fetch(api_shit, { headers: shit_headers, body: JSON.stringify(shit_body), method: "POST" });
        const fetched_txt = await fetched_slop.bytes();
        if (await handleError(fetched_txt)) return;

        const attachment = new AttachmentBuilder(Buffer.from(fetched_txt), {
            name: 'image.png'
        });

        api.reply({
            embeds: [
                new ReplyEmbed()
                    .setColor(PredefinedColors.Pink)
                    .setAuthor({ name: 'EclairBOT' })
                    .setTitle('🎨 Oto twoje zdjęcie')
                    .setImage("attachment://image.png")
            ],
            files: [attachment]
        });
    },
} satisfies Command;
