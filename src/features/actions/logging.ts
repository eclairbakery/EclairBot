import { cfg } from "@/bot/cfg.js";
import { PredefinedColors } from "@/util/color.js";
import * as dsc from 'discord.js';

export default function registerLogging(client: dsc.Client) {
    client.on('channelCreate', async (chan) => {
        const channel = await client.channels.fetch(cfg.logs.channel);
        if (!channel.isSendable()) return;
        channel.send({
            embeds: [
                new dsc.EmbedBuilder()
                    .setAuthor({
                        name: 'EclairBOT'
                    })
                    .setColor(PredefinedColors.Yellow)
                    .setTitle('Nowy kanał na piekarnii!')
                    .setDescription(`Powstał kanał <#${chan.id}> na naszym serwerze!`)
            ]
        });
    });

    client.on('channelDelete', async (chan) => {
        const channel = await client.channels.fetch(cfg.logs.channel);
        if (!channel.isSendable()) return;
        channel.send({
            embeds: [
                new dsc.EmbedBuilder()
                    .setAuthor({
                        name: 'EclairBOT'
                    })
                    .setColor(PredefinedColors.Red)
                    .setTitle('Usunięto kawał historii piekarnii!')
                    .setDescription(`Kanał <#${chan.id}> został usunięty! Niestety nie mam zielonego pojęcia co to za kanał.`)
            ]
        });
    });

    client.on('messageDelete', async (msg) => {
        const channel = await client.channels.fetch(cfg.logs.channel);
        if (!channel.isSendable()) return;
        channel.send({
            embeds: [
                new dsc.EmbedBuilder()
                    .setAuthor({
                        name: 'EclairBOT'
                    })
                    .setColor(PredefinedColors.Red)
                    .setTitle('W internecie nic nie ginie!')
                    .setDescription(`Jakiś jełop zwany <@${msg.author.id}> usunął tą wiadomość: https://discord.com/channels/${msg.guildId}/${msg.channelId}/${msg.id}`)
                    .setFields([
                        {
                            name: 'Treść',
                            value: msg.content.slice(1, 1020)
                        }
                    ])
            ]
        });
    });

    client.on('messageUpdate', async (oldMsg, msg) => {
        const channel = await client.channels.fetch(cfg.logs.channel);
        if (!channel.isSendable()) return;
        channel.send({
            embeds: [
                new dsc.EmbedBuilder()
                    .setAuthor({
                        name: 'EclairBOT'
                    })
                    .setColor(PredefinedColors.Blue)
                    .setTitle('Edycja wiadomości')
                    .setDescription(`Tu masz autora co nie: <@${msg.author.id}>\nA tu masz link co nie: https://discord.com/channels/${msg.guildId}/${msg.channelId}/${msg.id}`)
                    .setFields([
                        {
                            name: 'Stara wiadomość',
                            value: oldMsg.content.slice(1, 1020)
                        },
                        {
                            name: 'Nowa wiadomość',
                            value: msg.content.slice(1, 1020)
                        }
                    ])
            ]
        });
    });

    client.on('guildMemberUpdate', async (oldMember, newMember) => {
        const rolesToWatch = [cfg.unfilteredRelated.gifBan];
        const allowedRoleIds = cfg.unfilteredRelated.eligibleToRemoveGifBan;

        const removedRoles = rolesToWatch.filter(roleId =>
            oldMember.roles.cache.has(roleId) && !newMember.roles.cache.has(roleId)
        );

        if (removedRoles.length > 0) {
            try {
                const fetchedLogs = await newMember.guild.fetchAuditLogs({
                    limit: 1,
                    type: dsc.AuditLogEvent.MemberRoleUpdate
                });

                const logEntry = fetchedLogs.entries.first();

                if (
                    logEntry &&
                    logEntry.target.id === newMember.id &&
                    logEntry.changes.some(change =>
                        change.key === "$remove" &&
                        change.new.some(r => removedRoles.includes(r.id))
                    )
                ) {
                    const executor = logEntry.executor;
                    const memberExecutor = await newMember.guild.members.fetch(executor.id);

                    const hasAllowedRole = allowedRoleIds.some(id => memberExecutor.roles.cache.has(id));

                    if (!hasAllowedRole) {
                        for (const roleId of removedRoles) {
                            await newMember.roles.add(roleId, "Nieautoryzowane odebranie roli");
                        }
                    }
                }
            } catch (err) {
                console.error(err);
            }
        }
    });
}