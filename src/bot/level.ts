import * as dsc from 'discord.js';
import * as log from '@/util/log.js';
import { cfg } from '@/bot/cfg.js';
import { db } from '@/bot/db.js';
import actionsManager, { Action } from '@/features/actions/index.js';
import { dbGet, dbRun } from '@/util/dbUtils.js';
import { client } from '@/client.js';
import { mkProgressBar } from '@/util/progressbar.js';
import { output } from './logging.js';

export const OnSetXpEvent = actionsManager.mkEvent('OnSetXpEvent');
export interface XpEventCtx {
    userID: dsc.Snowflake;
    user?: dsc.GuildMember | undefined;
    guild: dsc.Guild;
    action: 'set' | 'add' | 'delete';
    amount: number;
};

export function xpToLevel(xp: number, levelDivider: number = cfg.features.leveling.levelDivider): number {
    return Math.floor(
        (1 + Math.sqrt(1 + 8 * xp / levelDivider)) / 2
    );
}

export function levelToXp(level: number, levelDivider: number = cfg.features.leveling.levelDivider): number {
    return Math.floor((level * (level - 1) / 2) * levelDivider);
}

export const lvlRoles = Object.values(cfg.features.leveling.milestoneRoles);

function getMention(user: dsc.GuildMember, ping: boolean = cfg.features.leveling.shallPingWhenNewLevel) {
    return ping ? `<@${user.user.id}>` : `**${user.displayName.replace('**', '\*\*')}**`;
}

export function mkLvlProgressBar(xp: number, levelDivider: number, totalLength: number = 10): string {
    const level = xpToLevel(xp, levelDivider);
    const xpCurrentLevel = levelToXp(level, levelDivider);
    const xpNextLevel = levelToXp(level + 1, levelDivider);

    const progressXp = xp - xpCurrentLevel;
    const neededXp = xpNextLevel - xpCurrentLevel;

    return `${mkProgressBar(progressXp, neededXp, totalLength)} ${progressXp}/${neededXp}xp`;
}

let generalActivityMeter = 0;
setInterval(() => {
    generalActivityMeter = 0;
}, 5 * 60 * 1000);
let generalLevelBoost: Record<dsc.Snowflake, boolean> = {};

function msgEligibleForGeneralLevelBoost(msg: dsc.OmitPartialGroupDMChannel<dsc.Message<boolean>>) {
    if (msg.channelId !== cfg.channels.general.general) return false;
    if (++generalActivityMeter !== 10) return false;
    for (const phrase of ['aborcja', 'seks', 'rucha', 'putin', 'hitler', 'niemcy', 'legal']) {
        if (msg.content.includes(phrase)) return false;
    }
    return Math.random() < 0.001 && cfg.features.leveling.generalLevelBoost.enabled;
}

export async function addExperiencePoints(msg: dsc.OmitPartialGroupDMChannel<dsc.Message<boolean>>) {
    // add an event if good message
    if (msgEligibleForGeneralLevelBoost(msg)) {
        const row = new dsc.ActionRowBuilder();
        row.addComponents(new dsc.ButtonBuilder().setEmoji('👍').setLabel('Zdobądź').setStyle(dsc.ButtonStyle.Success).setCustomId('get-lvl'))
        let sent = await msg.channel.send({
            content: '🔥 kto pierwszy naciśnie przycisk, dostanie boost levela!',
            components: [row.toJSON()]
        });
        const collector = sent.createMessageComponentCollector({
            componentType: dsc.ComponentType.Button,
            time: 15000,
        });
        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'get-lvl') {
                collector.stop('someone_clicked');
                await sent.edit({
                    content: `✅ ${interaction.user.username} zdobył boost levela (lvl * 3)`,
                    components: []
                });
                generalLevelBoost[interaction.user.id] = true;
                setInterval(() => {
                    generalLevelBoost[interaction.user.id] = false;
                }, cfg.features.leveling.generalLevelBoost.boostTimeInMinutes * 60 * 1000);
            }
        });
        collector.on('end', async (collected, reason) => {
            if (reason !== 'someone_clicked') {
                await sent.edit({
                    content: '⏳ nikt nie zdążył kliknąć, więc nikt nie dostał boosta lvl...',
                    components: []
                });
            }
        });
    }

    // check if eligible
    if (cfg.features.leveling.excludedChannels.includes(msg.channelId)) return;
    if (msg.channelId == cfg.unfilteredRelated.unfilteredChannel) return;

    // amount
    let amount = cfg.features.leveling.xpPerMessage;
    if (msg.attachments.size > 0 && msg.content.length > 5) amount = Math.floor(amount * 1.5);
    if (msg.content.length > 100) amount = Math.floor(amount * 1.2);

    // events
    if (cfg.features.leveling.currentEvent.enabled && cfg.features.leveling.currentEvent.channels.includes(msg.channelId)) {
        amount = Math.floor(amount * cfg.features.leveling.currentEvent.multiplier);
    }
    if (generalLevelBoost[msg.author.id] == true) {
        amount = Math.floor(amount * 3);
    }

    //output.log(`Receiving ${amount} XP, while multiplier ${cfg.features.leveling.currentEvent.multiplier}`);

    // checkpoints
    // Fetch current XP from the database
    db.get(
        `SELECT xp FROM leveling WHERE user_id = ?`,
        [msg.author.id],
        async (err, row: any) => {
            if (err) {
                log.replyError(msg, 'Błąd', err.message);
                return;
            }

            const prevXp = row ? row.xp : 0;
            const newXp = prevXp + amount;

            const prevLevel = xpToLevel(prevXp, cfg.features.leveling.levelDivider);
            const newLevel = xpToLevel(newXp, cfg.features.leveling.levelDivider);

            // let's insert this data
            db.run(
                `INSERT INTO leveling (user_id, xp) VALUES (?, ?)
                 ON CONFLICT(user_id) DO UPDATE SET xp = xp + excluded.xp`,
                [msg.author.id, amount]
            );

            // Check for level up
            if (newLevel > prevLevel) {
                // Check for milestone roles
                const milestones = cfg.features.leveling.milestoneRoles || {};
                const milestoneRoleId: string | null = milestones[newLevel] ?? null;
                if (milestoneRoleId != null && msg.guild) {
                    const member = msg.guild.members.cache.get(msg.author.id);
                    if (member) {
                        for (const roleId of lvlRoles) {
                            try {
                                if (member.roles.cache.has(roleId)) {
                                    await member.roles.remove(roleId);
                                }
                            } catch (err) {
                                output.log(`Failed to remove role ${roleId}:`, err);
                            }
                        }
                        try {
                            await member.roles.add(milestoneRoleId);
                        } catch (err: any) {
                            log.replyError(msg, `Błąd`, err.message ?? err);
                        }
                    }
                }

                // Let's ping this guy
                const channelLvl = await msg.client.channels.fetch(cfg.features.leveling.levelChannel);
                if (!channelLvl || !channelLvl.isSendable()) return;

                let content = `${getMention(msg.member!)} wbił poziom ${newLevel}! Wow co za osiągnięcie!`;
                if (milestoneRoleId) content += 'I btw nową rolę zdobyłeś!';
                channelLvl.send(content);
            }
        }
    );
}

const updateXpAction: Action<XpEventCtx> = {
    activationEventType: OnSetXpEvent,
    constraints: [],
    callbacks: [
        async (ctx) => {
            const res = await dbGet('SELECT xp FROM leveling WHERE user_id = ?', [ctx.userID]);
            const prevXp = res ? res.xp : 0;

            let newXp: number;
            switch (ctx.action) {
            case 'set':    newXp = ctx.amount;                       break;
            case 'add':    newXp = prevXp + ctx.amount;              break;
            case 'delete': newXp = Math.max(0, prevXp - ctx.amount); break;
            }

            await dbRun(`
                INSERT INTO leveling (user_id, xp)
                VALUES (?, ?)
                ON CONFLICT(user_id) DO UPDATE SET xp = excluded.xp;
            `, [ctx.userID, newXp]);

            let user: dsc.GuildMember;
            if (ctx?.user) {
                user = ctx.user;
            } else {
                user = await ctx.guild.members.fetch(ctx.userID);
                if (user == null) throw new Error;
            }

            let content: string;

            const prevLevel = xpToLevel(prevXp, cfg.features.leveling.levelDivider);
            const newLevel = xpToLevel(newXp, cfg.features.leveling.levelDivider);

            if (newLevel > prevLevel) {
                content = `Level użytkownika ${getMention(user)} został zmieniony i teraz ma aż ${newLevel} level!`;
            } else if (newLevel < prevLevel) {
                content = `Level użytkownika ${getMention(user)} został zmieniony, przez co cofną się do levela ${newLevel}!`;
            } else {
                if (prevXp == newXp) {
                    content = `Administrator próbował zmienić level użytkownika ${getMention(user)}, ale ma autyzm i ustawił dokladnie taki sam jaki był wcześniej czyli ${prevLevel} level. Nic tylko pogratulować`;
                } else {
                    content = `Level użytkownika ${getMention(user)} został zmieniony, co prawda dalej ma ${prevLevel} level, ale tym razem ${newXp}xp zamiast ${prevXp}xp?`
                        + ` Dobra przestane yappowac tych nerdowskich liczb i dam ci progress bar do następnego levela:` +
                        '\n' + mkLvlProgressBar(newXp, levelToXp(xpToLevel(newXp) + 1));
                }
            }

            const channelLvl = await client.channels.fetch(cfg.features.leveling.levelChannel);
            if (!channelLvl || !channelLvl.isSendable()) return;
            return channelLvl.send(content);
        },
    ],
};

actionsManager.addAction(updateXpAction);
