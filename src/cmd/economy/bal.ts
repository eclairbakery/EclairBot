import { Command } from '../../bot/command.js';
import { cfg } from '../../bot/cfg.js'
import { db, sqlite } from '../../bot/db.js';

import * as log from '../../util/log.js';
import * as cfgManager from '../../bot/cfgManager.js';
import * as automod from '../../bot/automod.js';

import * as dsc from 'discord.js';
import { PredefinedColors } from '../../util/color.js';

export const balCmd: Command = {
    name: 'bal',
    desc: 'Wyświetl swój balans zadłużenia (raczej jesteś mało warty, w sensie konto, nie pozywaj za zniesławienie).',
    category: 'ekonomia',
    expectedArgs: [],

    aliases: ['balance'],
    allowedRoles: null,
    allowedUsers: [],

    execute(msg, args) {
        db.get('SELECT * FROM economy WHERE user_id = ?', [msg.mentions.users.first() ?? msg.member.id], async (err, row: {money: number}) => {
            if (err) {
                console.error(err);
                return log.replyError(msg, 'Błąd pobierania topki', 'Pytaj twórców biblioteki sqlite3...');
            }

            if (!row) {
                return log.replyError(msg, 'Zero pieniędzy', 'Nie ma żadnego w bazie takiego usera z hajsem :sob:');
            }

            return msg.reply({
                embeds: [
                    new dsc.EmbedBuilder()
                        .setTitle('📊 Twoje pieniądze')
                        .setDescription(`Konto jest ${row.money >= 0 ? 'warte' : 'zadłużone o'} ${row.money.toString().replaceAll('-', '')}$.`)
                        .setColor("#1ebfd5")
                ]
            });
        });
    }
}
