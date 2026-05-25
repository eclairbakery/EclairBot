import { client } from '@/features/serchat/client.ts';
import { client as discord_client } from '@/client.ts';
import { db } from '@/bot/apis/db/bot-db.ts';
import User from '@/bot/apis/db/user.ts';
import { translate } from '@/bot/apis/translations/translate.ts';
import { cfg } from '@/bot/cfg.ts';
import { addLvlRole, xpToLevel } from '@/bot/level.ts';

// TODO: it would be nice to somehow integrate translations api 
// more "natively" w/ serchat.ts; i have no ideas on how to do 
// that, so I'll leave it for now

const doNotNotifyAboutDiscord: string[] = [];

export default function registerLeveling() {
    client.on('messageCreate', async (msg) => {
        if (msg.senderIsBot) return;
        
        // user fetch logic
        const account = await db.platforms.getDiscordAccount('serchat', msg.senderId);
        if (!account) {
            if (doNotNotifyAboutDiscord.includes(msg.senderId)) return;
            await msg.reply(translate("hej!\nleveling oraz wiele innych rzeczy jest tu zarządzanych przez bota discord, który został przeportowany na serchat! moze dolaczysz na discorda (link w kategorii wazne) i połączysz discorda z serchatem przez komende `manage-accounts` z discorda by nabijał sie level?\n-# ta wiadomość nie pokaże się ponownie do następnego restartu bota"));
            doNotNotifyAboutDiscord.push(msg.senderId);
            return;
        }
        const user = new User(account.discord_account);
        
        // generate amount
        let amount = cfg.features.leveling.xpPerMessage;
        if ((msg.attachments ?? []).length > 0 && msg.text.length > 5) amount = Math.floor(amount * 1.5);
        if (msg.text.length > 100) amount = Math.floor(amount * 1.2);
        
        // calculations 
        const prevXp = await user.leveling.getXP();
        const newXp = prevXp + amount;
        const prevLevel = xpToLevel(prevXp, cfg.features.leveling.levelDivider);
        const newLevel = xpToLevel(newXp, cfg.features.leveling.levelDivider);

        // add level 
        await user.leveling.addXP(amount);
        if (newLevel > prevLevel) {
            const gotNewRole = await addLvlRole(discord_client.guilds.cache.first()!, newLevel, user.id);

            await msg.reply({
                content: translate(
                    `Wbiłeś poziom ${newLevel}! Jestem dumny!`
                    + gotNewRole
                        ? "A i nową rolę na Discordzie zdobyłeś!"
                        : ""
                )
            });
        } 
    })
}
