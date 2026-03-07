import { cfg } from "@/bot/cfg.js";
import { Command, CommandFlags } from "@/bot/command.js";

import * as email from '@/bot/apis/email/mail.js';
import { db } from "@/bot/apis/db/bot-db.js";

import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

function parseEmailMessage(input: string): { subject: string, content: string } {
    let index = -1;

    for (let i = 0; i < input.length; i++) {
        if (input[i] == ":" && input[i - 1] != "\\") {
            index = i;
            break;
        }
    }

    if (index == -1) {
        return { subject: '', content: input.replace(/\\:/g, ":") };
    }

    let subject = input.slice(0, index);
    let content = input.slice(index + 1);

    subject = subject.replace(/\\:/g, ":").trim();
    content = content.replace(/\\:/g, ":").trim();

    return { subject, content };
}

export const sendEmailCmd: Command = {
    name: 'send-email',
    description: {
        main: 'Wysyła emaila do danego użytkownika z adresu eclairbota.',
        short: 'Wysyła email.'
    },
    aliases: ['email'],
    expectedArgs: [
        {
            name: 'receiver',
            description: 'Odbiorca twojego pięknego emaila',
            type: 'string',
            optional: false,
        },
        {
            name: 'content',
            description: 'Zawartość emaila, możesz zrobić subject:content jak chcesz zmienić temat maila.',
            type: 'trailing-string',
            optional: false,
        }
    ],
    flags: CommandFlags.Important,
    permissions: {
        allowedRoles: cfg.devPerms.allowedRoles,
        allowedUsers: cfg.devPerms.allowedUsers,
    },
    
    async execute(api) {
        const receiver = api.getTypedArg('receiver', 'string')?.value!;
        const contentArg = api.getTypedArg('content', 'trailing-string')?.value!;

        const COOLDOWN_MS = 10 * 60 * 1000;
        const check = await api.executor.cooldowns.check('email', COOLDOWN_MS);

        if (!process.env.EB_EMAIL_USER || !process.env.EB_EMAIL_PASS) 
            return api.log.replyWarn(
                api, 'Brakuje czegoś!',
                'Poproś administrację o dostęp do e-mail\'a (w skrócie by ustawili EB_EMAIL_USER i EB_EMAIL_PASS).'
            );

        if (!check.can) {
            return api.log.replyError(
                api, 'Spam check!',
                `Będziesz mógł wysłać nastepnego maila dopiero ${check.discordTime}, bo nie chcemy `
                   + `by nasz brand new mail stracił reputacje i trafial do spamu odrazu po uruchomieniu.`
            );
        }

        const drow = await db.selectOne(
            "SELECT 1 FROM email_security WHERE enabled_domain = ? LIMIT 1",
            [
                receiver.split('@')[1] ?? 'hashcat.dev'
            ]
        );

        if (!drow) {
            return await api.log.replyWarn(api, "Niestety nie...", "Tej domeny nie ma na whiteliście. Nie możesz więc do niej wysyłać maili. Wiem, szkoda... ALE UWAGA! Jest jedna opcja. Możesz utworzyć konto pocztowe na tej domenie i wysłać wiadomość do `theeclairbot@gmail.com`, aby permamentnie dodać ją do whitelisty.");
        }

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('cancel_email')
                .setLabel('Cofnij wysyłanie')
                .setStyle(ButtonStyle.Danger)
        );
        
        let msg = await api.reply({
            embeds: [
                api.log.getInfoEmbed(
                    "Are you siur about that?",
                    "Maili nie da się usunąć po wysłaniu. Więc jak coś wyślesz gdzieś to masz problem. A jak wysyłasz jakiś donos na policję czy coś to i tak jest napisany twój username i Discord ID w notce na dole, więc nie, anonimowy nie jesteś.\n\nMasz **10 sekund**, aby ewentualnie anulować, bo inaczej się wyśle."
                )
            ],
            components: [row]
        });

        let cancelled = false;
        
        const collector = msg.createMessageComponentCollector({
            time: 10000
        });
        
        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'cancel_email' && interaction.user.id === api.invoker.id) {
                cancelled = true;
                await interaction.update({
                    embeds: [api.log.getSuccessEmbed("Anulowano", "Wysyłanie maila zostało anulowane.")],
                    components: []
                });
                collector.stop();
            }
        });
        
        await new Promise(resolve => collector.on('end', resolve));
        
        if (cancelled) return;

        const now = Date.now();

        msg.edit( { embeds: [api.log.getTipEmbed('Wysyłanie... ', 'Poczekaj, to chwile potrwa!')], components: [] } );

        try {
            let { subject, content } = parseEmailMessage(contentArg);
            subject = `Wiadomość od ${api.invoker.user.displayName}: ${(subject == '') ? "brak tematu" : subject}`; 
            if (content == '') {
                return msg.edit({
                    embeds: [api.log.getErrorEmbed('Błędna wiadomość', 'Nie możesz wysłać pustego emaila!')],
                });
            }
            content += `\n\nEN: This message was sent automatically, because Discord user @${api.invoker.user.username} (id: ${api.invoker.id}) used the \`${cfg.general.prefix}${api.invokedViaAlias}\` command.\nPL: Ta wiadomość została wysłana automatycznie przez bota Discord na skutek wykonania komendy \`${cfg.general.prefix}${api.invokedViaAlias}\` przez użytkownika Discord @${api.invoker.user.username} (id: ${api.invoker.id}).`; 

            await email.sendMessage({
                receiver: receiver,
                subject: subject,
                content: content,
            });

            await api.executor.cooldowns.set('email', now);

            msg.edit({
                embeds: [api.log.getSuccessEmbed('Udało się!', `Wysłalem emaila do ${receiver}!`)],
            });
        } catch (err) {
            msg.edit({
                embeds: [api.log.getErrorEmbed(
                    'Zjebało się!',
                    `Jak zawsze coś się jebie z tym emailem wina tuska i tych calych internetów.\nKod błędu: ${err}`
                )],
            });
        }
    }
};
