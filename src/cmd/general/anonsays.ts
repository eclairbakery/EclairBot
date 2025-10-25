import { cfg } from "@/bot/cfg.js";
import { Command, CommandFlags } from "@/bot/command.js";
import { client } from "@/client.js";
import { getChannel } from "@/features/actions/templateChannels.js";
import { PredefinedColors } from "@/util/color.js";
import { getErrorEmbed, getSuccessEmbed, replyError } from "@/util/log.js";
import {
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    InteractionType,
    WebhookClient,
    Snowflake,
    ChatInputCommandInteraction,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder as ActionRowComponents,
    ComponentType,
    EmbedBuilder,
} from "discord.js";

const cooldown: Record<Snowflake, boolean> = {};

const anonSaysCmd: Command = {
    name: "anonsays",
    aliases: ["say-anonymously"],
    description: {
        main: "Wyślij anonimową wiadomość przez webhook",
        short: "Anonimowe wysyłanie wiadomości",
    },
    flags: CommandFlags.None,
    slashCmdFlags: { ephemeral: true },
    expectedArgs: [],
    permissions: {
        discordPerms: [],
        allowedRoles: null,
        allowedUsers: null,
    },

    async execute(api) {
        const interaction = api.plainInteraction as ChatInputCommandInteraction;
        const userId = api.msg.author.id;
        const guild = api.msg.guild;

        if (!interaction || !guild) {
            return replyError(
                { reply: (o) => interaction?.reply(o) as any },
                "Ta komenda działa tylko na serwerze i jako slash comamnds.",
                "Nie miała by sensu jakby inaczej działała."
            );
        }

        if (cooldown[userId]) {
            return replyError(
                { reply: (o) => interaction?.reply(o) as any },
                "STOP",
                "Zbyt szybko wysyłasz wiadomości. Odczekaj chwilę przed kolejną próbą."
            );
        }

        cooldown[userId] = true;
        setTimeout(() => delete cooldown[userId], 25_000);

        const button = new ButtonBuilder()
            .setCustomId("openAnonModal")
            .setLabel("✏️ Napisz anonimową wiadomość")
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowComponents<ButtonBuilder>().addComponents(button);

        await interaction.editReply({
            content: "Kliknij przycisk, aby wysłać anonimową wiadomość.",
            components: [row],
        });

        const collector = interaction.channel?.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 120_000,
            filter: (i) => i.user.id === userId && i.customId === "openAnonModal",
        });

        collector?.on("collect", async (btnInt) => {
            const textInput = new TextInputBuilder()
                .setCustomId("anonText")
                .setLabel("Co chcesz powiedzieć anonimowo?")
                .setStyle(TextInputStyle.Paragraph)
                .setMaxLength(500)
                .setMinLength(3)
                .setPlaceholder("Wpisz swoją anonimową wiadomość...");

            const modalRow = new ActionRowBuilder<TextInputBuilder>().addComponents(textInput);

            const modal = new ModalBuilder()
                .setCustomId("anonSaysModal")
                .setTitle("Wyślij anonimowo")
                .addComponents(modalRow);

            await btnInt.showModal(modal);

            const submitted = await btnInt.awaitModalSubmit({
                filter: (i) => i.user.id === userId && i.customId === "anonSaysModal",
                time: 120_000,
            }).catch(() => null);

            if (!submitted) {
                return replyError(
                    { reply: (o) => btnInt.followUp(o) as any },
                    "Czas minął",
                    "Nie wysłałeś żadnej wiadomości anonimowej."
                );
            }

            const text = submitted.fields.getTextInputValue("anonText").trim();
            if (text.length < 3) {
                return replyError(
                    { reply: (o) => submitted.reply(o) as any },
                    "Za krótka wiadomość",
                    "Twoja anonimowa wiadomość musi mieć przynajmniej 3 znaki."
                );
            }

            const webhook = new WebhookClient({ url: process.env.ANON_SAYS_WEBHOOK! });
            const sent = await webhook.send({
                content: `💬 **jakiś anonim powiedział** ${text}`,
                allowedMentions: {
                    parse: []
                }
            });

            await submitted.reply({
                ephemeral: true,
                embeds: [getSuccessEmbed("Udało się!", "Twoja anonimowa wiadomość została wysłana!")],
            });

            const modChan = await getChannel(cfg.channels.mod.logs, client);
            if (modChan?.isSendable() && sent) {
                await modChan.send({
                    embeds: [
                        new EmbedBuilder()
                            .setDescription(`https://discord.com/channels/${guild.id}/${sent.channel_id}/${sent.id} jest wyslane przez <@${userId}>`)
                            .setTitle('Anonimowa wiadomość')
                            .setColor(PredefinedColors.Grey)
                            .setAuthor({
                                name: 'EclairBOT'
                            })
                    ],
                    allowedMentions: { parse: [] },
                });
            }

            collector.stop("done");
        });

        collector?.on("end", async (_, reason) => {
            if (reason !== "done") {
                await interaction.editReply({
                    components: [],
                    embeds: [
                        getErrorEmbed("Czas minął", "Nie wysłałeś żadnej anonimowej wiadomości."),
                    ],
                });
            }
        });
    },
};

export default anonSaysCmd;
